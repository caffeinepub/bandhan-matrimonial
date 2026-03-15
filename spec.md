# Bandhan Matrimonial

## Current State
Version 37 is live with all features from versions 1-37 intact: swipe discovery, profile creation, match requests, stories, advanced chat (reply, edit, react, delete, Messenger-style, read/seen, typing, mute, pin, unread badges, message requests), voice/video calls, live streaming, admin dashboard, gift history, and all authentication methods.

## Requested Changes (Diff)

### Add
- **Starred Messages page**: A dedicated screen accessible from the Chats header (star icon) showing all starred messages across all conversations, grouped by conversation/contact, with sender name, avatar, message text, and timestamp.
- **Star a message**: Long-press any message in a conversation to reveal a context menu with a "Star" option (in addition to existing reply/edit/react/delete/pin options). Starred messages get a small ⭐ indicator.
- **Unstar a message**: Long-press a starred message to unstar it, or swipe-to-unstar from the Starred Messages page.
- **Starred count badge**: Small count shown next to the star icon in the Chats header.
- **Navigate to original**: Tapping a starred message in the Starred Messages page opens the original conversation at that message.

### Modify
- Chats header: Add a star icon (⭐) alongside existing gear/inbox/pencil icons to open the Starred Messages page.
- Message long-press context menu: Add "Star" / "Unstar" option.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `starredMessages` state (array of {msgId, conversationId, contactName, contactAvatar, text, timestamp, senderId}) stored in localStorage for persistence.
2. Add `StarredMessagesPage` component: lists all starred messages grouped by contact, with unstar swipe/button, and tap-to-navigate.
3. Update Chats header to include star icon with count badge that opens StarredMessagesPage.
4. Update message long-press context menu in ConversationPage to include Star/Unstar option.
5. Show ⭐ indicator on starred messages in conversation view.
6. Wire navigation: tapping a starred message navigates to the conversation (existing nav logic).
