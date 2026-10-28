/** Never persisted from the browser. Authorization and balances are server-owned. */
export const PRIVILEGED_CLIENT_FIELDS = ["isAdmin", "premium", "credits", "authError"] as const;

export function stripPrivilegedFields<T extends Record<string, unknown>>(
  details: T
): Partial<T> {
  const payload: Partial<T> = {};
  for (const key of Object.keys(details) as (keyof T)[]) {
    if ((PRIVILEGED_CLIENT_FIELDS as readonly string[]).includes(String(key))) continue;
    const value = details[key];
    if (value !== undefined && value !== null) payload[key] = value;
  }
  return payload;
}
