# Bandhan Matrimonial

## Current State
- BrowsePage has two rows: (1) header with Discover text + LIVE button + NotificationBell + ring icon, (2) search input + filter button always visible
- StoriesRow has a generic + button for own story, and gradient border rings for all stories (no distinction between viewed/new)
- ChatPage has a basic layout: title, stories row, search, chat list
- NotificationBell uses a Bell icon with heart functionality

## Requested Changes (Diff)

### Add
- BrowsePage: search icon that toggles search+filter row (hidden by default, shows on tap)
- StoriesRow: current logged-in user story shown leftmost with + icon (gray/dashed border), new unviewed stories with gradient border ring, viewed stories with gray border, multiple stories per user = segmented border ring equal to story count
- ChatPage: Facebook Messenger-style layout with centered "Chats" title, search bar, active contacts row with circular avatars + online dots, and redesigned chat list rows

### Modify
- BrowsePage header: single row = "Discover" text + ring icon + LIVE button + Search icon (toggles search) + Heart icon (replaces Bell icon but keeps notification functionality)
- StoriesRow: distinguish own story (leftmost, +), new (gradient ring), viewed (gray ring), segmented ring for multiple stories
- ChatPage: full layout redesign to Messenger style while preserving all existing functionality (story viewing, search, navigation)
- NotificationBell: extract notification logic, render as Heart icon in BrowsePage header row

### Remove
- BrowsePage always-visible search row (replaced by toggle)

## Implementation Plan
1. Refactor NotificationBell to accept an `icon` prop or create HeartNotificationBell variant that renders Heart icon but uses same notification logic
2. Update BrowsePage header to single row: Discover text (left), ring icon + LIVE + search-toggle icon + heart-notification icon (right)
3. Add `showSearch` state; search+filter row only shows when search icon tapped
4. Update StoriesRow:
   - Accept `myUserId` to identify own stories
   - Own story: leftmost, gray dashed border, + overlay
   - Unviewed stories: gradient border ring
   - Viewed stories: gray border
   - Multiple stories from same user: segment the ring border into N equal arcs
5. Redesign ChatPage to Messenger style:
   - Header: hamburger (left) + "Chats" (center) + compose (right)
   - Search input below header
   - Active contacts horizontal scroll row with online indicator dots
   - Chat list with larger avatars, name, last message preview, timestamp, unread dot
