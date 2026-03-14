# Bandhan Matrimonial

## Current State
Chat messages are sent/received via backend. Reactions, edits, and deletes are currently stored only in local React state (not persisted). The Message type has id, fromUserId, toUserId, text, timestamp, read fields.

## Requested Changes (Diff)

### Add
- `reactToMessage(messageId, emoji)` backend function - stores a reaction emoji on a message
- `editMessage(messageId, newText)` backend function - updates message text (only sender can edit)
- `deleteMessage(messageId)` backend function - marks message as deleted (only sender can delete)
- `reaction`, `editedText`, `deleted` optional fields on Message type

### Modify
- `getMessages` to filter out deleted messages OR include deleted flag
- `ConversationPage.tsx` to call backend for react/edit/delete instead of local state only, and load reactions/edits/deleted status from returned messages

### Remove
- Nothing removed; local state is kept as fallback for optimistic updates

## Implementation Plan
1. Add `reaction: ?Text`, `isDeleted: Bool` fields to Message type in backend
2. Add `reactToMessage`, `editMessage`, `deleteMessage` backend functions
3. Update `getMessages` to return updated messages (with reaction/isDeleted fields)
4. Update `backend.d.ts` with new function signatures and updated Message type
5. Update `ConversationPage.tsx` to call backend functions and read persisted state from messages
