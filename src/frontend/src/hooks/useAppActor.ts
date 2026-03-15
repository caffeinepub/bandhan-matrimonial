import type { AppBackend } from "../backend";
import { useActor } from "./useActor";

/**
 * Wrapper around useActor that returns the actor cast to AppBackend,
 * which includes all app-specific methods beyond the base backendInterface.
 */
export function useAppActor() {
  const { actor, isFetching, principalStr } = useActor();
  return {
    actor: actor as unknown as AppBackend | null,
    isFetching,
    principalStr,
  };
}
