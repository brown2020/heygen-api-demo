export type LegacyCandidate = {
  id: string;
  /** Root user document `email`, when present. */
  email: string | null;
  /** Root user document `authEmail`, when present. */
  authEmail: string | null;
  /** `users/{id}/profile/*` `email`, when present. */
  profileEmail: string | null;
};

export type LegacyDecision =
  | { action: "copy"; sourceId: string }
  | { action: "skip"; reason: string };

function normalized(value: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function candidateEmails(candidate: LegacyCandidate): string[] {
  return [candidate.email, candidate.authEmail, candidate.profileEmail]
    .map(normalized)
    .filter((value): value is string => value !== null);
}

/**
 * Pick at most one legacy `users/{id}` document to copy onto a Firebase uid.
 * Documents with no email, authEmail, or profile email are ignored.
 */
export function selectLegacySource(input: {
  firebaseUid: string;
  verifiedEmail: string | null;
  emailVerified: boolean;
  destinationExists: boolean;
  candidates: LegacyCandidate[];
}): LegacyDecision {
  if (input.destinationExists) {
    return { action: "skip", reason: "destination-exists" };
  }
  const verified = normalized(input.verifiedEmail);
  if (!input.emailVerified || !verified) {
    return { action: "skip", reason: "unverified-email" };
  }

  const matches: LegacyCandidate[] = [];
  const seen = new Set<string>();
  for (const candidate of input.candidates) {
    if (!candidate.id || candidate.id === input.firebaseUid || seen.has(candidate.id)) {
      continue;
    }
    const emails = candidateEmails(candidate);
    if (emails.length === 0) continue;
    if (!emails.includes(verified)) continue;
    seen.add(candidate.id);
    matches.push(candidate);
  }

  if (matches.length === 0) {
    return { action: "skip", reason: "no-email-match" };
  }
  if (matches.length > 1) {
    return { action: "skip", reason: "ambiguous" };
  }
  return { action: "copy", sourceId: matches[0].id };
}
