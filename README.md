# HeyGen API Demo

Demo Next.js app that generates talking-photo videos with the [HeyGen](https://www.heygen.com/) API. Sign in with Clerk, save your HeyGen API key on your profile, sync talking photos / avatars, generate videos (with status polling), and buy credits via Stripe. Live demo: [https://heygen-api-demo.vercel.app](https://heygen-api-demo.vercel.app).

## Features

- **Clerk authentication** (hosted sign-in / user button); optional Firebase custom-token bridge for Firestore
- **HeyGen integration** — list avatars and talking photos, generate talking-photo videos (text / audio / silence voice), poll video status
- **Per-user HeyGen API key** stored on the profile (BYOK)
- **Previous videos** gallery and generation UI
- **Stripe credits** — PaymentIntent checkout and payment history
- **Zustand** stores for auth, profile, and payments
- Soft route protection via Clerk middleware (`src/proxy.ts`)

## Tech stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js ^16.3.6 (App Router) |
| UI | React ^19.2.5, Tailwind CSS ^4.2.4, Lucide |
| Language | TypeScript ^6.0.3 |
| Auth | Clerk (`@clerk/nextjs` 6.39.3) |
| Data | Firebase ^12.12.1 + Firebase Admin ^13.8.0 |
| Payments | Stripe ^22 + React Stripe.js |
| State | Zustand ^5.0.12 |
| HTTP | Axios |
| Tests | Vitest ^3.2.4, ESLint 9 |

## Project structure

```
src/
  app/                 # Pages: home, generate, avatars, profile, payment-*
  actions/             # Server actions: HeyGen generate/retrieve/avatars, Stripe payments
  components/          # Generate, Avatars, Profile, payments UI, Header/Footer
  firebase/            # Client + Admin (soft-fail when env missing)
  libs/                # Clerk config helpers, HeyGen response parsers
  zustand/             # Auth, profile, payments stores
  proxy.ts             # Clerk middleware / route protection
firestore.rules  storage.rules  .env.example
```

## Getting started

### Prerequisites

- Node.js 22+
- npm
- Clerk application
- Firebase project (optional but used for profile / credits persistence)
- Stripe account
- A HeyGen API key (entered in-app on the profile page)

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

| Name | Purpose | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | [Clerk Dashboard](https://dashboard.clerk.com) |
| `CLERK_SECRET_KEY` | Clerk secret key | Same |
| `NEXT_PUBLIC_FIREBASE_*` | Client Firebase config | Firebase Console → Project settings |
| `FIREBASE_*` | Admin service account fields | Firebase Console → Service accounts |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key | Stripe Dashboard |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard |
| `NEXT_PUBLIC_STRIPE_PRODUCT_NAME` | Credit product label | Your choice / Stripe product |
| `HEYGEN_USE_FIXTURES` | When `true`, HeyGen generate calls use test mode (avoid burning credits in CI/eval) | Set locally / in CI as needed |

HeyGen API keys are supplied by each user on their profile, not via a shared server env var.

Firebase and Clerk client init soft-skip when keys are missing so CI builds can succeed without secrets.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (HeyGen response fixtures — no live API) |
| `npm run validate` | lint + typecheck + test + build |
| `npm run doctor` | React Doctor |

## Testing and CI

- Unit tests cover HeyGen response parsing and auth constants with fixtures (no live HeyGen calls).
- `.github/workflows/ci.yml` on `dev` / `main`: lint → typecheck → test → build (secret-free gate).

## Firebase

Deploy `firestore.rules` and `storage.rules` if you use Firebase for profiles and media. Configure the Clerk ↔ Firebase integration if you enable the custom-token bridge in the header.

## Deployment

Vercel-friendly Next.js app. Set env vars in the host dashboard. Prefer `HEYGEN_USE_FIXTURES=true` in non-production eval environments.

## Contributing

Branch from `dev`. Do not call live HeyGen in CI. Never commit `.env.local` or inline secrets in workflows.

## License

GNU Affero General Public License v3.0 — see [LICENSE.md](LICENSE.md).
