# Roadmap

Punchlist after the dependency maintenance pass. Items here are not implemented.

## Next steps

1. Deploy `firestore.rules`, `storage.rules`, and `cors.json` to the Firebase project. The app now reads and writes `users/{uid}/talkingPhotos` and `videos/{uid}/...`. Those paths stay denied until the rules are deployed.
2. Enable Email/Password and Google in Firebase Authentication and authorize the production domain. Rules compare `request.auth.uid` to `users/{firebaseUid}`. Legacy documents are copied only on the first verified sign-in; see the README.
3. Register the Stripe webhook for `payment_intent.succeeded` at `/api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET` in the host. Until then, only the signed-in success page grants the pack.
4. Re-fetch talking photos after the rules deploy. Documents left in the old root `talkingPhotos` collection are not migrated and are not read.
5. CI runs on Node 24. `firebase` 13 still declares Node >= 24.12.0. Confirm the Vercel project runtime matches.

## Known bugs

- Preview images render with `next/image` only for `files2.heygen.ai` (plus Firebase and Google). Another HeyGen image host throws at render time. The repo does not contain a sample URL on a different host, so the allowlist was not widened.
- Completed-video downloads allow only `files.heygen.ai`, `files2.heygen.ai`, `resource.heygen.ai`, and `resource2.heygen.ai`. A HeyGen CDN host outside that list fails the download after the credit has already been debited.
- The optional audio URL is forwarded to HeyGen as-is. This server does not fetch it.
- Video status polling holds the browser tab for up to 10 minutes. There is no background job if the tab closes after HeyGen accepts the job. The 1 credit stays spent once HeyGen returns a video id.
- A profile that has never been created has 0 credits, so the first generate click can fail until the profile document exists. Opening the app while signed in creates it with the 1000-credit starter balance.
- `FIREBASE_TYPE`, `FIREBASE_PRIVATE_KEY_ID`, `FIREBASE_CLIENT_ID`, `FIREBASE_AUTH_URI`, `FIREBASE_TOKEN_URI`, `FIREBASE_AUTH_PROVIDER_X509_CERT_URL`, `FIREBASE_CLIENT_CERTS_URL`, and `FIREBASE_UNIVERSE_DOMAIN` are in `.env.example` and are not read by Admin init.
- The ElevenLabs API key is collected and stored, and nothing calls ElevenLabs.
- `glob@10.5.0`, pulled in by `firebase-admin` through `rimraf`, is deprecated. `npm audit` reports no advisory. It was left in place so Admin's dependency tree stays intact.

## Open issues

- typescript-eslint does not support the TypeScript 7 compiler API. `typescript` is aliased to `@typescript/typescript6` so ESLint can load, and `@typescript/native` provides TypeScript 7's `tsc`. Drop the alias when typescript-eslint supports TypeScript 7.
- Firebase client packages require Node >= 24.12.0. CI is pinned to Node 24. Confirm the installed 24.x release is at least 24.12.0.
- Storage download rules still depend on Firebase Auth. A 15-minute signed URL works without that session, and it is a bearer token until it expires.
- There is no App Check, rate limit, or server-side cap on how many HeyGen status calls one session can make during the 10-minute poll.
- Starter credits (1000) are granted by the client create of the profile document because rules allow that exact value once. A delete is denied, so it cannot be repeated through the client. Moving that grant to the Admin SDK would remove the last client-minted balance.

## Needs Steve

- Deploy the Firebase rules and Storage CORS. Do not treat a green Vercel build as a rules deploy.
- Set production env vars, including `STRIPE_WEBHOOK_SECRET` if webhook grants are required. The app degrades when that secret is unset.
- Enable Email/Password and Google sign-in on the existing Firebase project. Do not expect this repo to deploy that change.
- Choose whether to move hosting and CI to Node 24.
- Promote `dev` to `main` only after QA. This maintenance pass does not touch `main`.
