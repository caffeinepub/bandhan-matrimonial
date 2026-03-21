# Bandhan Matrimonial

## Current State
App has persistent authentication issues: profile creation fails, data doesn't load, profile save doesn't work. Root cause is in `useInternetIdentity.ts`.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- `useInternetIdentity.ts`: Fix the auth hook so it never loops

### Remove
- Nothing

## Implementation Plan
1. Move `authClient` from `useState` to `useRef` + add `initDoneRef` guard so `useEffect` truly runs only once
2. Use empty `[]` dependency array on the init `useEffect`
3. Pass `derivationOrigin` in the actual `login()` call (loaded from config at login time)
4. In `clear()`, do NOT destroy the authClient (keep ref alive) — only clear identity/status
5. Auto-clear corrupted localStorage delegation tokens on parse error
