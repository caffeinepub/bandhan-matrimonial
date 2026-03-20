# Bandhan Matrimonial

## Current State
Version 50 with all features from versions 1-50. Authentication via Internet Identity only.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- `useInternetIdentity.ts`: Fix auth re-initialization loop by using a `useRef` guard (`initDone`) so the `useEffect` runs exactly once on mount, with NO `authClient` in the dependency array. `authClient` is stored in a `useRef` (not useState) so it never triggers re-renders or re-effects. `clear()` calls `authClient.logout()` but does NOT set authClient to undefined. `login()` fetches `derivationOrigin` from config at call time and passes it to `authClient.login()`. Corrupted localStorage tokens are auto-cleared.
- `App.tsx`: Remove any `useEffect` that interferes with logout navigation; use a simple effect that sets page to "browse" when logged out.

### Remove
- Nothing

## Implementation Plan
1. Rewrite `useInternetIdentity.ts` with ref-based client (no dependency array issues)
2. Clean up `App.tsx` logout/redirect logic
3. Validate and deploy
