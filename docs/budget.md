# Runtime budget

Stated before measure (until-100):

- Production `next build` must succeed with empty optional secrets (Clerk/Firebase/Stripe public keys may be absent).
- React Doctor score must be 100/100.
- CI gate on `origin/dev` must be green for HEAD (lint, typecheck, test, build).
- Critical path for measure: home → avatars navigation (anonymous / Clerk-unconfigured soft UI).
