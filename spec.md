# Bandhan Matrimonial

## Current State
- ChatPage has a Messenger-style header with Menu and Edit icons
- BrowsePage header has a 💍 ring icon displayed prominently
- No chat settings panel exists in ChatPage
- Blocked users are managed only in MyProfilePage with localStorage

## Requested Changes (Diff)

### Add
- Chat Settings button/icon in ChatPage header (top right area or as gear icon)
- Chat Settings Sheet with working settings:
  - Who can send me messages (Everyone / Matches Only / Nobody)
  - Who can add me to group chats (Everyone / Matches Only / Nobody)
  - Read Receipts toggle
  - Online Status toggle  
  - Blocked Users section (view list + unblock button for each)
  - Other Chats (Message Requests toggle - store unknown senders in a separate folder)

### Modify
- ChatPage header: replace Menu button with Settings gear icon that opens the settings sheet
- BrowsePage header: hide the ring icon (💍)
- Chat settings are persisted in localStorage

### Remove
- Ring icon from BrowsePage header row (hidden, not removed from code)

## Implementation Plan
1. In ChatPage.tsx: Add gear/settings icon button in header
2. Create ChatSettingsSheet component inline or as state-driven Sheet
3. Settings stored in localStorage: whoCanMessage, whoCanAddToGroup, readReceipts, showOnlineStatus, messageRequests
4. Blocked users section reads from localStorage (same source as MyProfilePage)
5. Unblock removes from localStorage blocked list
6. In BrowsePage.tsx: hide the ring icon div (add hidden class or remove rendering)
