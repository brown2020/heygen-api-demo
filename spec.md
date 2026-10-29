# Spec

Current behavior of the HeyGen API demo as built on `dev`. This describes the product, not a future design.

## Purpose

A signed-in user connects their own HeyGen API key, syncs that account's talking photos, generates a talking-photo video, and can buy one fixed credit pack. The app stores profile, photos, video metadata, and the credit ledger in Firebase. Stripe charges the pack. HeyGen renders the video.

## Actors

- **Visitor.** Can open `/` and use the email/password or Google sign-in form.
- **Signed-in user.** Can open `/avatars`, `/generate`, `/profile`, `/payment-attempt`, and `/payment-success`.
- **Stripe.** Sends `payment_intent.succeeded` to the webhook when that endpoint is configured.
- **Operator.** Supplies env vars and deploys Firebase rules outside this app.

## Routes

| Path | Access |
| --- | --- |
| `/` | Public. Shows the Firebase Auth form when Firebase web config is present |
| `/avatars` | Protected |
| `/generate` | Protected |
| `/profile` | Protected |
| `/payment-attempt` | Protected |
| `/payment-success` | Protected. Reads `payment_intent` from the query string |
| `POST /api/stripe/webhook` | Public route. Grants credits only after a valid Stripe signature |

`src/proxy.ts` verifies the Firebase ID token cookie on protected paths. Development allows those pages through without a session. Production returns 401 when the token is missing or `verifyIdToken` rejects it. Server actions call `verifyIdToken` and reject unauthenticated callers.

## Authentication and identity

1. The home page offers email/password sign-in, email/password sign-up, and Google sign-in (`signInWithPopup`). The header shows a user menu with sign-out when a session exists.
2. After sign-in, the client sends the Firebase ID token to `establishAuthSession`. The server verifies it with `firebase-admin` `verifyIdToken` and stores it in an httpOnly cookie. Later server actions read that cookie and verify it again. The uid from the token is the user id.
3. Firestore paths and security rules use that Firebase Auth uid (`request.auth.uid == userId`).
4. If `users/{firebaseUid}` does not exist and the token email is verified, the server copies at most one legacy `users/{clerkUserId}` tree with a matching `authEmail`, root `email`, or profile `email`. It never deletes the old documents. Unverified emails, documents with no email field, and ambiguous matches are skipped.
5. If the session cookie cannot be created, the app keeps the Firebase user and sets an auth error.
6. The browser never writes `isAdmin`, `premium`, or `credits`.

## Profile

Document: `users/{uid}/profile/userData`.

- The first create sets `credits` to 1000. Rules reject any other initial balance and reject deletes.
- Later client updates may change contact fields, the HeyGen key, the ElevenLabs key, and the selected talking photo. They cannot change `credits`.
- API key inputs are password fields. Generate, status, and avatar fetch read the HeyGen key with the Admin SDK. The key is not a server-action argument.
- The ElevenLabs key is stored and not used by any generation call.

## Talking photos

- "Fetch Talking Photos" calls HeyGen with the saved key and merges the photos into `users/{uid}/talkingPhotos/{talkingPhotoId}`.
- Ids must match `^[A-Za-z0-9_-]{1,128}$`. Preview URLs saved from the client must be empty or `https`.
- The signed-in user can rename, favorite, and select their own photos.
- There is no shared global talking-photo collection.

## Video generation

1. The user selects a talking photo and optionally enters a script and an audio URL.
2. The server debits 1 credit in a transaction. A balance below 1 fails before HeyGen is called.
3. HeyGen `POST /v2/video/generate` runs with the user's key. `HEYGEN_USE_FIXTURES=true` sets HeyGen's `test` flag.
4. If HeyGen does not accept the job, the 1 credit is refunded.
5. The browser polls `retrieveVideo` every 4 seconds for up to 10 minutes. Each call checks HeyGen status once.
6. On completion, the server downloads the file only from `https://files.heygen.ai`, `files2.heygen.ai`, `resource.heygen.ai`, or `resource2.heygen.ai`, with redirects disabled and a 100 MiB cap.
7. The file is stored at `videos/{uid}/{talkingPhotoId}/{videoId}.mp4`. A 15-minute signed read URL is returned for playback. Firestore stores `storage_path`, not a long-lived URL.
8. Previous videos are listed by a server action that signs the same path again.

Voice selection: an audio URL uses HeyGen's audio voice; otherwise a script plus voice id uses text; otherwise the clip is 10 seconds of silence. A missing or known-invalid voice id is replaced with the built-in fallback voice id.

## Credits and payments

- The only pack is $99.99 (9999 cents). The server ignores any other amount.
- A succeeded PaymentIntent in USD with metadata `purpose=credit_pack` and a valid `userId` grants `amount + 1` credits (10000 for this pack).
- `finalizePayment` requires the verified Firebase uid to be that `userId`. It does not return the PaymentIntent client secret. `createPaymentIntent` returns the client secret so Stripe.js can confirm the payment.
- The grant writes `users/{uid}/payments/{paymentIntentId}` and increments profile credits in one transaction. A second delivery does not grant again.
- The webhook performs the same grant when `STRIPE_WEBHOOK_SECRET` and `STRIPE_SECRET_KEY` are set and the signature matches. Otherwise it returns 503 and does not grant.
- The payments page lists the user's payment documents. The displayed id is the Stripe id stored on the document. Clients cannot write that collection.

## Security boundaries

- Firestore: owner read/write of their user doc and talking photos, with credits and privilege fields frozen. Payment and video documents are Admin-write only.
- Storage: owner read of `videos/{userId}/**`. All writes denied for clients. Every other path is denied.
- Storage CORS allows GET from `http://localhost:3000` and `https://heygen-api-demo.vercel.app`.
- Admin credentials are not `NEXT_PUBLIC_` and are not read during `next build` unless a request calls Admin.

## Build and test

- `npm run build` must succeed with no secrets.
- Unit tests cover billing eligibility, credit math, URL allowlisting, log redaction, proxy decisions, and the rules files. They do not call HeyGen, Stripe, or Firebase.

## Out of scope

- No password-reset form. Email/password sign-in and sign-up are on the home page.
- No live HeyGen calls in CI.
- No automatic Firebase rules or Storage CORS deploy from this repo.
- No model or AI-provider configuration. HeyGen is called over its REST API.
