import { describe, expect, it } from "vitest";

import { selectLegacySource, type LegacyCandidate } from "@/libs/legacy-user";

const base = {
  firebaseUid: "firebase-uid",
  verifiedEmail: "person@example.com",
  emailVerified: true,
  destinationExists: false,
};

function candidate(partial: Partial<LegacyCandidate> & { id: string }): LegacyCandidate {
  return {
    email: null,
    authEmail: null,
    profileEmail: null,
    ...partial,
  };
}

describe("selectLegacySource", () => {
  it("copies the single legacy doc with a matching authEmail", () => {
    expect(
      selectLegacySource({
        ...base,
        candidates: [
          candidate({ id: "user_clerk", authEmail: "person@example.com" }),
          candidate({ id: "user_other", authEmail: "other@example.com" }),
        ],
      })
    ).toEqual({ action: "copy", sourceId: "user_clerk" });
  });

  it("matches profile email and root email", () => {
    expect(
      selectLegacySource({
        ...base,
        candidates: [candidate({ id: "user_clerk", profileEmail: "Person@Example.com" })],
      }).action
    ).toBe("copy");
    expect(
      selectLegacySource({
        ...base,
        candidates: [candidate({ id: "user_clerk", email: "person@example.com" })],
      }).action
    ).toBe("copy");
  });

  it("skips docs with no email field, an existing destination, and unverified mail", () => {
    expect(
      selectLegacySource({
        ...base,
        candidates: [candidate({ id: "user_clerk" })],
      })
    ).toEqual({ action: "skip", reason: "no-email-match" });
    expect(
      selectLegacySource({
        ...base,
        destinationExists: true,
        candidates: [candidate({ id: "user_clerk", authEmail: "person@example.com" })],
      })
    ).toEqual({ action: "skip", reason: "destination-exists" });
    expect(
      selectLegacySource({
        ...base,
        emailVerified: false,
        candidates: [candidate({ id: "user_clerk", authEmail: "person@example.com" })],
      })
    ).toEqual({ action: "skip", reason: "unverified-email" });
  });

  it("does not copy when two legacy docs share the address", () => {
    expect(
      selectLegacySource({
        ...base,
        candidates: [
          candidate({ id: "user_a", authEmail: "person@example.com" }),
          candidate({ id: "user_b", email: "person@example.com" }),
        ],
      })
    ).toEqual({ action: "skip", reason: "ambiguous" });
  });

  it("ignores the destination uid", () => {
    expect(
      selectLegacySource({
        ...base,
        candidates: [candidate({ id: "firebase-uid", authEmail: "person@example.com" })],
      })
    ).toEqual({ action: "skip", reason: "no-email-match" });
  });
});
