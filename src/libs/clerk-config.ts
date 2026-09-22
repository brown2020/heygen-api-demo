/** True when Clerk publishable key is present (false in CI / local without secrets). */
export const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);
