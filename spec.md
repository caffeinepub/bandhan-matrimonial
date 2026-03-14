# Bandhan Matrimonial

## Current State
Version 20 is live with: swipe discovery, browse with marquee, profile creation, match requests, mutual matches, chat (reply/edit/react/delete), voice/video calls, Instagram-style stories (reactions, highlights, views, expiry, admin moderation, music/sticker overlays), notifications (bell, history, story notifs, super like notifs), live streaming, daily match suggestions, who viewed my profile, super like, profile completion bar, mutual interests badge, story highlights on profile, profile boost, admin dashboard.

## Requested Changes (Diff)

### Add
- **Compatibility Score widget** on ViewProfilePage: calculate % match from shared interests + religion match + location match + age proximity. Show as animated gradient ring with percentage.
- **"Super Liked You" section** in MatchesPage: dedicated row/section using existing `getSuperLikedBy()` API showing profiles who super liked the current user (star ⭐ badge).
- **Chat List Search**: search/filter input at the top of ChatPage to filter conversations by name in real-time.
- **Profile Share button**: on ViewProfilePage, a share icon button that uses navigator.share (native) or copies a link to clipboard as fallback.
- **Quick Card Reactions**: on browse cards in BrowsePage, small ❤️ 🔥 😍 emoji reaction buttons below the card; tapping records a reaction in local state with a pop animation.
- **"Matched X days ago" milestone** in ConversationPage: below the profile name in the conversation header, show a subtle "Matched X days ago" or "Matched today" label.
- **Online indicator**: green dot on profile photos in browse cards and chat list for profiles where showLastActive is true and createdAt suggests recent activity.

### Modify
- ViewProfilePage: add compatibility score widget near the top and share button in header.
- MatchesPage: add "Super Liked You" collapsible section above or alongside the matches list.
- ChatPage: add search input at top of conversation list.
- ConversationPage: add matched-duration label to header.
- BrowsePage: add quick emoji reactions at bottom of browse cards.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `CompatibilityScore` component: takes two Profile objects, computes score, renders gradient ring.
2. Add `getSuperLikedBy` call in MatchesPage and render a "Super Liked You ⭐" section.
3. Add search state + filter logic in ChatPage for conversation list.
4. Add share button in ViewProfilePage header using navigator.share / clipboard.
5. Add quick emoji reaction row on browse cards with bounce animation and local state.
6. In ConversationPage header, compute and show days since match (use profile.createdAt as proxy or fixed label).
7. Add green dot overlay on profile avatar in BrowsePage cards and ChatPage list rows.
