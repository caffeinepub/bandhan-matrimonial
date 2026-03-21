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
  identity?: Identity;
  login: () => void;
  clear: () => void;
  loginStatus: Status;
  isInitializing: boolean;
  isLoginIdle: boolean;
  isLoggingIn: boolean;
  isLoginSuccess: boolean;
  isLoginError: boolean;
  loginError?: Error;
};

const ONE_HOUR_IN_NANOSECONDS = BigInt(3_600_000_000_000);
const DEFAULT_IDENTITY_PROVIDER = process.env.II_URL;

type ProviderValue = InternetIdentityContext;
const InternetIdentityReactContext = createContext<ProviderValue | undefined>(
  undefined,
);

async function createAuthClient(
  createOptions?: AuthClientCreateOptions,
): Promise<AuthClient> {
  const options: AuthClientCreateOptions = {
    idleOptions: {
      disableDefaultIdleCallback: true,
      disableIdle: true,
      ...createOptions?.idleOptions,
    },
    ...createOptions,
  };
  return AuthClient.create(options);
}

function assertProviderPresent(
  context: ProviderValue | undefined,
): asserts context is ProviderValue {
  if (!context) {
    throw new Error(
      "InternetIdentityProvider is not present. Wrap your component tree with it.",
    );
  }
}

export const useInternetIdentity = (): InternetIdentityContext => {
  const context = useContext(InternetIdentityReactContext);
  assertProviderPresent(context);
  return context;
};

export function InternetIdentityProvider({
  children,
  createOptions,
}: PropsWithChildren<{
  children: ReactNode;
  createOptions?: AuthClientCreateOptions;
}>) {
  // Use a ref for the authClient so changes to it never trigger re-renders or re-runs of useEffect
  const authClientRef = useRef<AuthClient | undefined>(undefined);
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
      setErrorMessage("AuthClient is not initialized yet.");
      return;
    }

    const currentIdentity = client.getIdentity();
    if (
      !currentIdentity.getPrincipal().isAnonymous() &&
      currentIdentity instanceof DelegationIdentity &&
      isDelegationValid(currentIdentity.getDelegation())
    ) {
      setErrorMessage("User is already authenticated");
      return;
    }

    // Load derivationOrigin at login time (what II actually checks)
    void loadConfig().then((config) => {
      const options: AuthClientLoginOptions = {
        identityProvider: DEFAULT_IDENTITY_PROVIDER,
        derivationOrigin: config.ii_derivation_origin,
        onSuccess: handleLoginSuccess,
        onError: handleLoginError,
        maxTimeToLive: ONE_HOUR_IN_NANOSECONDS * BigInt(24 * 30), // 30 days
      };
      setStatus("logging-in");
      void client.login(options);
    });
  }, [handleLoginError, handleLoginSuccess, setErrorMessage]);

  const clear = useCallback(() => {
    const client = authClientRef.current;
    if (!client) return;

    void client
      .logout()
      .then(() => {
        // Do NOT set authClientRef.current = undefined — keep the client alive
        // so the init useEffect never re-runs
        setIdentity(undefined);
        setStatus("idle");
        setError(undefined);
      })
      .catch((unknownError: unknown) => {
        setStatus("loginError");
        setError(
          unknownError instanceof Error
            ? unknownError
            : new Error("Logout failed"),
        );
      });
  }, []);

  // This effect runs EXACTLY ONCE on mount. Never again.
  // authClientRef is a ref, not state, so it cannot trigger re-runs.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once on mount
  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;

    void (async () => {
      try {
        setStatus("initializing");
        const client = await createAuthClient(createOptions);
        authClientRef.current = client;

        // Clear corrupted tokens if any
        let isAuthenticated = false;
        try {
          isAuthenticated = await client.isAuthenticated();
        } catch {
          // Corrupted delegation — clear II storage keys
          const keysToRemove = Object.keys(localStorage).filter(
            (k) =>
              k.startsWith("ic-") ||
              k.includes("delegation") ||
              k.includes("identity"),
          );
          for (const k of keysToRemove) localStorage.removeItem(k);
        }

        if (isAuthenticated) {
          const loadedIdentity = client.getIdentity();
          setIdentity(loadedIdentity);
          setStatus("success");
        } else {
          setStatus("idle");
        }
      } catch (unknownError) {
        setStatus("idle"); // Don't block the app
        setError(
          unknownError instanceof Error
            ? unknownError
            : new Error("Initialization failed"),
        );
      }
    })();
  }, []); // Empty deps — run once only

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
