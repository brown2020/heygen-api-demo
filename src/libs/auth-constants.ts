/** Paths protected by Clerk proxy (src/proxy.ts). */
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

export type ProxyDecision = "clerk" | "allow" | "deny";

/** Production without Clerk denies protected routes. Development stays open for local/CI UI. */
export function decideProxyAccess(input: {
  clerkConfigured: boolean;
  isProduction: boolean;
  pathname: string;
}): ProxyDecision {
  if (input.clerkConfigured) return "clerk";
  if (input.isProduction && isProtectedPath(input.pathname)) return "deny";
  return "allow";
}
