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
