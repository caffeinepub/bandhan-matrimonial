# Bandhan Matrimonial - Version 6

## Current State
Version 5 is live with: Internet Identity auth, WebRTC voice/video calls, extended profile (interests, hobbies, movies, songs, education, mood, 7 media URL slots), chat with typing indicators & read receipts, stories with comments, swipe browse, match requests, mutual matches, admin dashboard, incoming call overlay, call history.

Media is added via pasting URLs (not direct upload). Story images are also added via URL.

## Requested Changes (Diff)

### Add
- Blob storage media upload: replace URL paste inputs with file picker upload buttons for profile photo and all 7 media gallery slots
- Story upload from device: replace URL prompt with file upload for story creation
- Story likes: users can like/unlike stories; like count shown
- Story comment replies: users can reply to existing comments on a story
- Phone/mobile number field on profile (optional, stored in backend)

### Modify
- Profile setup Step 0: photo upload uses StorageClient (file → blob URL)
- Profile setup Step 5 (Media): file pickers instead of URL text inputs
- ChatPage add story: file upload from device instead of URL prompt
- Story viewer modal: add like button + reply to comment
- Profile data model: add `phone` field

### Remove
- URL paste inputs for profile photo, media gallery, and story creation

## Implementation Plan
1. Update backend: add `phone` field to Profile, add `likeStory`, `unlikeStory`, `getStoryLikes` (returns likes count and whether caller liked), add `replyToStoryComment` (reply with parentCommentId), `StoryCommentReply` type
2. Select blob-storage component
3. Frontend: update ProfileSetupPage to use StorageClient for photo and media uploads
4. Frontend: update ChatPage story creation to use file upload via StorageClient
5. Frontend: update StoryViewerModal to show likes + like/unlike button + comment replies
6. Frontend: add phone field to ProfileSetupPage step 0
7. Frontend: add phone field to MyProfilePage edit form
