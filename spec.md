# Bandhan Matrimonial

## Current State
App has a NotificationBell component in the top-right of the main screen that shows a dropdown with current match requests and mutual match notifications. Notifications are tracked using localStorage for seen/unseen state. The dropdown has a max-height with overflow scroll.

## Requested Changes (Diff)

### Add
- `NotificationHistoryPage` -- a full-page notification history view listing all past notifications (match requests and mutual matches) with timestamps, profile avatars, notification type icons, and read/unread indicators.
- "See all" / "View history" button at the bottom of the NotificationBell dropdown that navigates to the history page.
- `notifications` page type in the Page union in App.tsx.
- Route handling in App.tsx to render NotificationHistoryPage with a back button.
- Notification history persisted to localStorage so past notifications remain visible even after they're gone from backend state.

### Modify
- `App.tsx`: add `"notifications"` to the Page type and render NotificationHistoryPage.
- `NotificationBell.tsx`: add a "See all" link/button at the bottom of the dropdown that calls a prop/callback to navigate to the notifications page, and persist notifications to localStorage history.

### Remove
- Nothing removed.

## Implementation Plan
1. Create `src/frontend/src/pages/NotificationHistoryPage.tsx` -- full page with header, back button, grouped or chronological list of all notifications from localStorage history, empty state.
2. Update `NotificationBell.tsx` to accept optional `onViewAll?: () => void` prop and show a "See all" button at dropdown bottom; also persist each new notification to a localStorage history array.
3. Update `App.tsx` to add `"notifications"` to Page type, pass `onViewAll` to NotificationBell, and render NotificationHistoryPage with `onBack`.
