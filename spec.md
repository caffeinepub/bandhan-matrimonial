# Bandhan Matrimonial

## Current State
Version 56 is deployed. The app has full feature set (stories, chat, matches, live streaming, voice/video calls, etc.) but the authentication system has a critical bug causing an infinite re-initialization loop that blocks all profile queries and saves.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- `useInternetIdentity.ts`: Move `authClient` from `useState` to `useRef` with `initDoneRef` guard. Empty `[]` dep array on `useEffect`. Fix `clear()` to NOT nullify the ref (prevents re-init after logout). Add `derivationOrigin` at actual login call time. Add corrupted token auto-clearing.
- `App.tsx`: Add `actorFetching` guard to `needsProfile` so profile setup screen only shows after authenticated actor is ready.

### Remove
- Nothing

## Implementation Plan
1. Rewrite `useInternetIdentity.ts` with `authClientRef = useRef<AuthClient | null>(null)` and `initDoneRef = useRef(false)` — effect runs exactly once.
2. Fix `clear()` to keep the client in ref, only clear identity state.
3. Pass `derivationOrigin` inside `login()` call after loading config.
4. Auto-clear corrupted localStorage delegation tokens on init.
5. Update `App.tsx` `needsProfile` to include `!actorFetching` guard.
6. Build and deploy.
