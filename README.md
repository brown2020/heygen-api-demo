# HeyGen API Demo

Next.js app that generates talking-photo videos with the [HeyGen](https://www.heygen.com/) API. Users sign in with Firebase Auth (email/password or Google), save a HeyGen API key on their profile, sync talking photos, generate videos, and buy a fixed credit pack with Stripe. Live demo: [https://heygen-api-demo.vercel.app](https://heygen-api-demo.vercel.app).

## Features

- Email/password and Google sign-in. Protected routes are enforced in `src/proxy.ts` with a Firebase ID token.
- Firestore paths and security rules use the Firebase Auth uid.
- Per-user HeyGen API key, read on the server for generate, status, and avatar sync.
- Talking photos and videos stored under that user. Playback URLs last 15 minutes.
- Browser polling of video status (the server checks HeyGen once per call).
- Stripe credit pack at a fixed price. Credits are granted only by the Admin SDK.
- Optional Stripe webhook. If its secret is unset, the webhook route returns 503 and the signed-in success page still grants the pack.

## Tech stack

| Layer | Package |
| --- | --- |
| Framework | Next.js 16.4.3 (App Router) |
| UI | React 19.3.1, Tailwind CSS 4.3.3, Lucide 1.63.0 |
| Language | TypeScript 7.0.2 (`tsc`). ESLint loads the TypeScript 6 API via `typescript` aliased to `@typescript/typescript6` (`tsc6` reports 6.0.3) |
| Auth | Firebase Auth (`firebase` 13.1.0, verified on the server with `firebase-admin`) |
| Data | `firebase` 13.1.0, `firebase-admin` 14.5.0 |
| Payments | `stripe` 23.0.1, `@stripe/stripe-js` 10.2.0, `@stripe/react-stripe-js` 7.0.1 |
| State | Zustand 5.0.16 |
| HTTP | Axios 1.21.0 |
| Tests | Vitest 5.0.5, Vite 8.3.5 |
| Lint | ESLint 10.13.0, `eslint-config-next` 16.4.3 |

`firebase-admin` 14 / `jwks-rsa` 4 stays on `jose` 5.10.0 through the `jwks-rsa` override.

## Project structure

```
src/
  app/                 # Pages plus POST /api/stripe/webhook
  actions/             # HeyGen, Stripe, and video listing server actions
  components/          # Generate, avatars, profile, payments, header
  firebase/            # Client init (skips when unset) and lazy Admin init
  libs/                # Billing, URL allowlist, parsers, proxy decision
  server/              # Stripe client, credit ledger, HeyGen key lookup
  zustand/             # Auth, profile, and payment-history stores
  proxy.ts             # Firebase session route protection
firestore.rules  storage.rules  cors.json  .env.example
```

## Getting started

### Prerequisites

- Node.js 24 (CI runs on Node 24; the Firebase client packages declare Node >= 24.12.0)
- npm
- Firebase project with Email/Password and Google sign-in enabled, used for profile, credits, and media
- Stripe account
- A HeyGen API key entered on the profile page (not a server env var)

### Install

```bash
git clone https://github.com/brown2020/heygen-api-demo.git
cd heygen-api-demo
cp .env.example .env.local
# Fill in placeholders — never commit real secrets
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Names only. Copy `.env.example` and set values locally or in the host. Never commit values.

| Name | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_APIKEY` | For sign-in and client data | Firebase web apiKey |
| `NEXT_PUBLIC_FIREBASE_AUTHDOMAIN` | For client data | Firebase authDomain |
| `NEXT_PUBLIC_FIREBASE_PROJECTID` | For client data | Firebase projectId |
| `NEXT_PUBLIC_FIREBASE_STORAGEBUCKET` | For client data and Admin storage | Storage bucket name |
| `NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID` | For client data | Firebase messagingSenderId |
| `NEXT_PUBLIC_FIREBASE_APPID` | For client data | Firebase appId |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENTID` | No | Analytics measurement id |
| `FIREBASE_PROJECT_ID` | For Admin and ID token checks | Service account project id |
| `FIREBASE_CLIENT_EMAIL` | For Admin and ID token checks | Service account client email |
| `FIREBASE_PRIVATE_KEY` | For Admin and ID token checks | Service account private key |
| `FIREBASE_TYPE` | No | Present in `.env.example`; Admin init does not read it |
| `FIREBASE_PRIVATE_KEY_ID` | No | Present in `.env.example`; Admin init does not read it |
| `FIREBASE_CLIENT_ID` | No | Present in `.env.example`; Admin init does not read it |
| `FIREBASE_AUTH_URI` | No | Present in `.env.example`; Admin init does not read it |
| `FIREBASE_TOKEN_URI` | No | Present in `.env.example`; Admin init does not read it |
| `FIREBASE_AUTH_PROVIDER_X509_CERT_URL` | No | Present in `.env.example`; Admin init does not read it |
| `FIREBASE_CLIENT_CERTS_URL` | No | Present in `.env.example`; Admin init does not read it |
| `FIREBASE_UNIVERSE_DOMAIN` | No | Present in `.env.example`; Admin init does not read it |
| `NEXT_PUBLIC_STRIPE_KEY` | For checkout | Stripe publishable key |
| `STRIPE_SECRET_KEY` | For charges and grants | Stripe secret key. The client is constructed only when this is set |
| `NEXT_PUBLIC_STRIPE_PRODUCT_NAME` | For checkout | Label stored on the PaymentIntent |
| `STRIPE_WEBHOOK_SECRET` | No | Webhook signing secret. When unset, `POST /api/stripe/webhook` returns 503 |
| `HEYGEN_USE_FIXTURES` | No | When `true`, HeyGen generate calls set `test: true` |

HeyGen API keys are saved by each user on their profile.

Client Firebase init and Admin init skip or throw a single configuration error when their required env vars are missing, so `npm run build` succeeds with empty secrets.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` (TypeScript 7) |
| `npm test` | Vitest. No live HeyGen, Stripe, or Firebase calls |
| `npm run validate` | lint, typecheck, test, and build |
| `npm run doctor` | React Doctor |

## Testing and CI

`.github/workflows/ci.yml` runs on `dev` and `main`: `npm ci --ignore-scripts`, lint, typecheck, test, build. The gate job does not receive secrets.

## Firebase and Stripe

Deploy from the Firebase console or CLI. This repo does not deploy them.

- `firestore.rules` — owner-scoped profiles, talking photos, and videos. Clients cannot change `credits` or write payment or video documents.
- `storage.rules` — the owner can read `videos/{userId}/**`. Writes are Admin-only.
- `cors.json` — GET from localhost and the production Vercel host. Apply it to the bucket separately if you use it.

No composite Firestore indexes are required. Existing Clerk user documents are left untouched and are not copied.

Register `POST /api/stripe/webhook` for `payment_intent.succeeded` when `STRIPE_WEBHOOK_SECRET` is set.

## Deployment

Set the env var names above in the host. Do not put secrets in the workflow file. In production, protected routes return 401 unless the request carries a verified Firebase ID token. Enable Email/Password and Google in Firebase Authentication, and authorize the app domain for Google sign-in. This repo does not deploy those provider settings.

## Contributing

Branch from `dev`. Do not call live HeyGen in CI. Never commit `.env.local` or inline secrets.

## License

GNU Affero General Public License v3.0 — see [LICENSE.md](LICENSE.md).
