# Bandhan Matrimonial

## Current State
Notification system is localStorage-based for match requests and mutual matches. The NotificationHistoryPage has tabs: All / Match Requests / Matches. The backend already stores story likes, comments, and replies but does not track notifications for story owners.

## Requested Changes (Diff)

### Add
- Backend `StoryNotification` type with fields: id, storyId, storyOwnerId, actorUserId, actorName, actorPhoto, notifType (#like | #comment | #reply), text, timestamp
- Backend `storyNotifications` map and `nextStoryNotifId` counter
- Backend `getMyStoryNotifications` query -- returns all story notifications for the caller (as story owner)
- Story interactions (`likeStory`, `addStoryComment`, `replyToStoryComment`) now push a notification to the story owner's list
- Frontend hook `useStoryNotifications` calling `getMyStoryNotifications`
- "Stories" tab in `NotificationHistoryPage` (tabs: All / Match Requests / Matches / Stories)
- Story notifications shown with emoji: ❤️ for like, 💬 for comment, 💬 for reply
- `NotificationBell` polls and shows story notifications in dropdown and unread badge count

### Modify
- `StoredNotification.type` extended to include `"story_like" | "story_comment" | "story_reply"`
- `NotificationBell` fetches story notifications and merges into display list
- `NotificationHistoryPage` adds Stories filter tab and correct empty state text

### Remove
- Nothing removed

## Implementation Plan
1. Update `src/backend/main.mo`: add StoryNotification type, storage map, counter, getMyStoryNotifications query, and push notifications inside likeStory/addStoryComment/replyToStoryComment
2. Regenerate `backend.d.ts` bindings
3. Update `NotificationHistoryPage.tsx`: extend StoredNotification type, add Stories tab
4. Update `NotificationBell.tsx`: add useStoryNotifications hook call, merge story notifs into display and badge count
