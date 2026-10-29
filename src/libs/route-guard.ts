/** Paths that require a signed-in Firebase user in production. */
export const PROTECTED_PATH_PREFIXES = [
  "/avatars",
  "/generate",
  "/payment-attempt",
  "/payment-success",
  "/profile",
] as const;

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export type ProxyDecision = "allow" | "deny";

/**
 * Production denies protected routes unless a Firebase ID token verified.
 * Development stays open so local and CI renders work without secrets.
 */
export function decideProxyAccess(input: {
  hasSession: boolean;
  isProduction: boolean;
  pathname: string;
}): ProxyDecision {
  if (!isProtectedPath(input.pathname)) return "allow";
  if (input.hasSession) return "allow";
  if (!input.isProduction) return "allow";
  return "deny";
}
