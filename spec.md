# Bandhan Matrimonial - Version 4

## Current State
Backend Profile: basic fields only (name, age, gender, religion, location, bio, photoUrl). No chat persistence. No story persistence. Frontend UI has extended fields but none save to backend.

## Requested Changes (Diff)

### Add
- Backend extended Profile: interests, hobbies, education, favoriteMovies, favoriteSongs, thoughts, mood, mediaUrls (7), occupation, height, motherTongue, maritalStatus
- Backend: sendMessage / getMessages for persistent chat
- Backend: addStory / getStories
- Frontend: wire all profile fields to backend
- Frontend: ConversationPage polls backend messages
- Frontend: ViewProfilePage shows all extended fields

### Modify
- Backend createOrUpdateProfile accepts all new fields
- ProfileSetupPage and MyProfilePage persist extended fields
- BrowsePage cards show richer profile info

### Remove
- Frontend ephemeral mock chat

## Implementation Plan
1. Regenerate backend with extended Profile + messages + stories
2. Wire ProfileSetupPage/MyProfilePage to new backend
3. Update ViewProfilePage for rich display
4. Wire ConversationPage to backend messages
5. Polish call/video call screens
