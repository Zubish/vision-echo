# Mobile Roadmap

## Phase 1: Ship Mobile Web Fast

The current build is mobile responsive and installable as a PWA. Users can add VisionEcho to their home screen, submit field reports, read the live feed, comment, share links, and use editor actions on mobile browsers.

Immediate improvements:

- Add offline draft storage for reports before upload
- Add upload progress and retry states
- Compress images and video client-side before submission
- Add push notification topics by state and category
- Add deep links for reports, categories, and breaking alerts

## Phase 2: Native App Shell

Use the same API contract for native clients.

Recommended path:

- Expo React Native for iOS and Android
- Shared TypeScript API types copied or published from `src/lib/types.ts`
- Auth token storage with secure storage
- Native camera, microphone, geolocation, and background upload support
- Push notifications through Expo Notifications or Firebase Cloud Messaging

## Phase 3: Field Reporter Mode

- Offline drafts
- Evidence checklist
- Exact or approximate location selector
- Source protection toggle
- Background media upload
- Editor request-more-info workflow
- Low-bandwidth mode for poor network conditions
