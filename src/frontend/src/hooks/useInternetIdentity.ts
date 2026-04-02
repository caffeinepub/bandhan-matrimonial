import {
  AuthClient,
  type AuthClientCreateOptions,
  type AuthClientLoginOptions,
} from "@dfinity/auth-client";
import type { Identity } from "@icp-sdk/core/agent";
import { DelegationIdentity, isDelegationValid } from "@icp-sdk/core/identity";
import {
  type PropsWithChildren,
  type ReactNode,
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { loadConfig } from "../config";

export type Status =
  | "initializing"
  | "idle"
  | "logging-in"
  | "success"
  | "loginError";

export type InternetIdentityContext = {
  /** The identity is available after successfully loading the identity from local storage
   * or completing the login process. */
  identity?: Identity;

  /** Connect to Internet Identity to login the user. */
  login: () => void;

  /** Clears the identity from the state and local storage. Effectively "logs the user out". */
  clear: () => void;

  /** The loginStatus of the login process. Note: The login loginStatus is not affected when a stored
   * identity is loaded on mount. */
  loginStatus: Status;

  /** `loginStatus === "initializing"` */
  isInitializing: boolean;

  /** `loginStatus === "idle"` */
  isLoginIdle: boolean;

  /** `loginStatus === "logging-in"` */
  isLoggingIn: boolean;

  /** `loginStatus === "success"` */
  isLoginSuccess: boolean;

  /** `loginStatus === "loginError"` */
  isLoginError: boolean;

  loginError?: Error;
};

const ONE_HOUR_IN_NANOSECONDS = BigInt(3_600_000_000_000);
const DEFAULT_IDENTITY_PROVIDER = process.env.II_URL;

type ProviderValue = InternetIdentityContext;
const InternetIdentityReactContext = createContext<ProviderValue | undefined>(
  undefined,
);

/**
 * Helper function to set loginError state.
 */
function assertProviderPresent(
  context: ProviderValue | undefined,
): asserts context is ProviderValue {
  if (!context) {
    throw new Error(
      "InternetIdentityProvider is not present. Wrap your component tree with it.",
    );
  }
}

/**
 * Hook to access the internet identity as well as loginStatus along with
 * login and clear functions.
 */
export const useInternetIdentity = (): InternetIdentityContext => {
  const context = useContext(InternetIdentityReactContext);
  assertProviderPresent(context);
  return context;
};

/**
 * The InternetIdentityProvider component makes the saved identity available
 * after page reloads. It also allows you to configure default options
 * for AuthClient and login.
 */
export function InternetIdentityProvider({
  children,
  createOptions,
}: PropsWithChildren<{
  children: ReactNode;
  createOptions?: AuthClientCreateOptions;
}>) {
  // CRITICAL: authClient MUST be in a ref, not state.
  // If it were in state, setting it would trigger re-renders and cause
  // the useEffect below to re-run, creating an infinite initialization loop.
  const authClientRef = useRef<AuthClient | null>(null);
  const initDoneRef = useRef(false);

  const [identity, setIdentity] = useState<Identity | undefined>(undefined);
  const [loginStatus, setStatus] = useState<Status>("initializing");
  const [loginError, setError] = useState<Error | undefined>(undefined);

  const setErrorMessage = useCallback((message: string) => {
    setStatus("loginError");
    setError(new Error(message));
  }, []);

  const handleLoginSuccess = useCallback(() => {
    const client = authClientRef.current;
    if (!client) {
      setErrorMessage("Identity not found after successful login");
      return;
    }
    const latestIdentity = client.getIdentity();
    setIdentity(latestIdentity);
    setStatus("success");
  }, [setErrorMessage]);

  const handleLoginError = useCallback(
    (maybeError?: string) => {
      setErrorMessage(maybeError ?? "Login failed");
    },
    [setErrorMessage],
  );

  const login = useCallback(() => {
    const client = authClientRef.current;
    if (!client) {
      setErrorMessage(
        "AuthClient is not initialized yet, make sure to call `login` on user interaction e.g. click.",
      );
      return;
    }

    const currentIdentity = client.getIdentity();
    if (
      !currentIdentity.getPrincipal().isAnonymous() &&
      currentIdentity instanceof DelegationIdentity &&
      isDelegationValid(currentIdentity.getDelegation())
    ) {
      // Already authenticated - just update state
      setIdentity(currentIdentity);
      setStatus("success");
      return;
    }

    // Load derivationOrigin and trigger login
    void loadConfig().then((config) => {
      const options: AuthClientLoginOptions = {
        identityProvider: DEFAULT_IDENTITY_PROVIDER,
        onSuccess: handleLoginSuccess,
        onError: handleLoginError,
        maxTimeToLive: ONE_HOUR_IN_NANOSECONDS * BigInt(24 * 30), // 30 days
        ...(config.ii_derivation_origin
          ? { derivationOrigin: config.ii_derivation_origin }
          : {}),
      };

      setStatus("logging-in");
      void client.login(options);
    });
  }, [handleLoginError, handleLoginSuccess, setErrorMessage]);

  const clear = useCallback(() => {
    const client = authClientRef.current;
    if (!client) return;

    // Logout but KEEP the client alive in the ref.
    // Setting authClientRef.current = null would NOT trigger re-init
    // since it's a ref, but we keep the client so it can be reused.
    void client
      .logout()
      .then(() => {
        setIdentity(undefined);
        setStatus("idle");
        setError(undefined);
        // Clear any stale II-related localStorage keys
        for (const key of Object.keys(localStorage)) {
          if (
            key.startsWith("ic-delegation") ||
            key.startsWith("ic-identity") ||
            key.startsWith("auth-client-db")
          ) {
            localStorage.removeItem(key);
          }
        }
      })
      .catch((_unknownError: unknown) => {
        // Even on error, clear local state
        setIdentity(undefined);
        setStatus("idle");
        setError(undefined);
      });
  }, []);

  // CRITICAL: Empty dependency array [] means this runs EXACTLY ONCE on mount.
  // Never add authClient, createOptions, or anything else here.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally empty — must run only once on mount
  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    void (async () => {
      try {
        setStatus("initializing");

        // Clear any corrupted delegation tokens before creating client
        try {
          const testKey = Object.keys(localStorage).find(
            (k) => k.startsWith("ic-delegation") || k.startsWith("ic-identity"),
          );
          if (testKey) {
            const val = localStorage.getItem(testKey);
            if (val) JSON.parse(val); // will throw if corrupted
          }
        } catch {
          // Clear corrupted tokens
          for (const key of Object.keys(localStorage)) {
            if (
              key.startsWith("ic-delegation") ||
              key.startsWith("ic-identity") ||
              key.startsWith("auth-client-db")
            ) {
              localStorage.removeItem(key);
            }
          }
        }

        // loadConfig is called here for side-effects / future use; result not needed at creation time
        await loadConfig();
        const options: AuthClientCreateOptions = {
          idleOptions: {
            disableDefaultIdleCallback: true,
            disableIdle: true,
            ...createOptions?.idleOptions,
          },
          ...createOptions,
        };

        const client = await AuthClient.create(options);
        authClientRef.current = client;

        let isAuthenticated = false;
        try {
          isAuthenticated = await client.isAuthenticated();
        } catch {
          // Corrupted session - clear and treat as unauthenticated
          for (const key of Object.keys(localStorage)) {
            if (
              key.startsWith("ic-delegation") ||
              key.startsWith("ic-identity") ||
              key.startsWith("auth-client-db")
            ) {
              localStorage.removeItem(key);
            }
          }
          isAuthenticated = false;
        }

        if (isAuthenticated) {
          const loadedIdentity = client.getIdentity();
          // Verify the delegation is actually valid
          if (
            loadedIdentity instanceof DelegationIdentity &&
            isDelegationValid(loadedIdentity.getDelegation())
          ) {
            setIdentity(loadedIdentity);
          }
        }
      } catch (unknownError) {
        setStatus("loginError");
        setError(
          unknownError instanceof Error
            ? unknownError
            : new Error("Initialization failed"),
        );
        return;
      }
      setStatus("idle");
    })();
  }, []); // MUST stay empty — adding any dep here would break the one-time init guarantee

  const value = useMemo<ProviderValue>(
    () => ({
      identity,
      login,
      clear,
      loginStatus,
      isInitializing: loginStatus === "initializing",
      isLoginIdle: loginStatus === "idle",
      isLoggingIn: loginStatus === "logging-in",
      isLoginSuccess: loginStatus === "success",
      isLoginError: loginStatus === "loginError",
      loginError,
    }),
    [identity, login, clear, loginStatus, loginError],
  );

  return createElement(InternetIdentityReactContext.Provider, {
    value,
    children,
  });
}
