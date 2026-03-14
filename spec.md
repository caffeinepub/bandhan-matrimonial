# Bandhan Matrimonial

## Current State
Version 17 is live with story highlights, gallery lightbox, Discover header row, search+filter sheet, who-liked viewer, and all previous features.

## Requested Changes (Diff)

### Add
- Story music overlay: music note icon in story creator/viewer, user can pick from a short list of moods/tracks (simulated, no real audio streaming)
- Story sticker overlays: sticker picker in story creator (emoji stickers placed on story), rendered on story viewer
- Wire "Near Me" filter to browser Geolocation API: when user taps Near Me, request location permission and filter profiles by city match (approximate, based on stored city vs detected city name)
- Footer copyright: "© 2026. I would ❤️ using Bandhan"

### Modify
- Notification bell icon: visible ONLY on the Browse/Discover screen (remove from other screens where it may appear)
- Footer: replace "© 2026. Built with ❤️ using caffeine.ai" with "© 2026. I would ❤️ using Bandhan"

### Remove
- "© 2026. Built with ❤️ using caffeine.ai" text wherever it appears

## Implementation Plan
1. Find all footer/copyright text and replace with new string
2. Audit all screens -- notification bell must only render on Browse screen
3. Story creator: add sticker picker (emoji grid) and music label picker (mood list), save selections with story data
4. Story viewer: render sticker overlays and music badge on story
5. Near Me filter: call navigator.geolocation, reverse-geocode to city name (via nominatim or approximate), filter profiles whose city matches
