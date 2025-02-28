# Sound Files Organization

This directory contains the master copies of all sound files used in the Chess Woodpecker application.

## How Sound Files Are Managed

1. **Source of Truth**: All sound files should be stored in this directory (`apps/shared/assets/sounds/`).
2. **Automatic Copying**: When you run the web or mobile apps, the sound files are automatically copied to their respective platform-specific locations:
   - Web: `apps/web/public/sounds/`
   - Mobile: `apps/mobile/assets/sounds/`

## Adding or Updating Sound Files

To add or update a sound file:

1. Place the new/updated sound file in this directory
2. Update the `soundFiles` record in `apps/shared/utils/sounds.ts` if needed
3. Run the app - the files will be automatically copied to the correct locations

## Why This Approach?

React Native and web applications handle static assets differently:
- React Native requires assets to be imported using `require()`
- Web serves static files from the `public` directory

By maintaining a single source of truth and automatically copying files, we ensure consistency across platforms while respecting their different asset handling requirements. 