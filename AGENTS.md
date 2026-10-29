# AGENTS.md

Agent instructions for autonomous work in **heygen-api-demo**. Read this file before changing code.

## Project overview

Next.js (App Router) demo that integrates the **HeyGen API** for talking-photo video generation. Users sign in with **Firebase Auth** (email/password and Google), store a HeyGen API key on their profile, sync talking photos, generate videos (polling HeyGen status), and buy credits via Stripe.

Production deployment target: **Vercel** (when linked). Prefer fixtures/mocks for HeyGen in CI and eval — do not burn paid HeyGen credits unless explicitly authorized.

## Auth

- Firebase Auth email/password and Google sign-in live on the home page (`AuthForm`). The header shows a user menu with sign-out.
- After sign-in, the client sends a Firebase ID token to `establishAuthSession`. Server actions verify it with `verifyIdToken` and use the token uid.
- When `NEXT_PUBLIC_FIREBASE_*` is missing, the client skips Firebase init and the sign-in form stays disabled.

## CI secrets policy (critical)

- Never inline `NEXT_PUBLIC_*`, Stripe, Firebase, or HeyGen keys in `.github/workflows/*`.
- Use `${{ secrets.* }}` only when a job truly needs them; keep the default **gate** job secret-free.
- `firebaseClient` must skip `initializeApp` / `getAuth` when public config is missing so SSG/build tolerates empty secrets.
- `firebaseAdmin` must soft-fail init when service-account env is missing (expected in CI build).
- Prefer deferred / guarded client init over depending on secret population.
- `isFirebaseConfigured` skips Auth client init when public config is missing so CI/SSG and empty-secret smoke still render. Production `src/proxy.ts` returns 401 for protected routes without a verified ID token.

## Package scripts

- `npm run lint` / `typecheck` / `test` / `build` / `validate` / `doctor`
- Package manager: **npm** (`package-lock.json`)

## Test / fixture policy

- Unit tests use labeled fixtures for HeyGen response shapes (`src/libs/heygen-response.test.ts`) — they do **not** call live HeyGen.
- Live `generateTalkingPhotoVideo` / `retrieveVideo` burn credits; avoid in until-100 / CI.

## Critical paths

1. Firebase Auth email/password or Google sign-in, then an ID-token session cookie
2. Profile API key save
3. Fetch / sync talking photos (HeyGen)
4. Generate video + poll status + store URL
5. Stripe payment intent + credits
6. Unauthorized access to protected routes (`src/proxy.ts`)
