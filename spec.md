# Bandhan Matrimonial

## Current State
App uses Internet Identity for auth via `useInternetIdentity.ts`. The `login` function called `authClient.login()` without passing `derivationOrigin` in the login options. The `useEffect` for initialization included `authClient` in its dependency array, causing it to re-run after setting the auth client and resetting status back to "initializing".

## Requested Changes (Diff)

### Add
- `derivationOrigin` now loaded from config and passed at login time via `authClient.login()` options
- `initializedRef` guard to prevent the init effect from running more than once
- Auth client captured in closure so `handleLoginSuccess` always uses the correct, non-stale client

### Modify
- `useEffect` dependency array changed from `[createOptions, authClient]` to `[]` (runs once on mount only)
- `handleLoginSuccess` now accepts the client as a parameter instead of reading from stale closure
- `clear()` resets `initializedRef.current = false` so re-login works after logout

### Remove
- Removed `loginOptions.derivationOrigin` from `createAuthClient` (it belongs at login time, not creation time)

## Implementation Plan
1. Fix `useInternetIdentity.ts` with derivationOrigin at login time and single-init ref guard
