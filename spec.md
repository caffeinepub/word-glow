# Word Glow

## Current State
Full-featured word search PWA with 200 levels, profiles, leaderboards, achievements, power-ups, and PWA install support. Custom app icon is live.

## Requested Changes (Diff)

### Add
- SplashScreen component: shows on app load for ~2 seconds, then fades out
- Displays the Word Glow icon, app name, and a short tagline
- Animated: icon scales in, tagline fades in, then whole screen fades out
- Only shows once per app open (not stored in localStorage -- just shows every launch, feels native)

### Modify
- App.tsx: render SplashScreen on top of everything; hide it after animation completes

### Remove
- Nothing

## Implementation Plan
1. Create `src/frontend/src/components/SplashScreen.tsx` with animated logo, name, tagline, and fade-out transition
2. In App.tsx, add `showSplash` state (true initially), pass `onDone` to SplashScreen, render it conditionally
