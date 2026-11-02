import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieSet = vi.fn();
const cookieDelete = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: cookieSet,
    delete: cookieDelete,
  }),
}));

const verifyFirebaseIdToken = vi.fn();

vi.mock("@/server/verify-id-token", () => ({
  FIREBASE_ID_TOKEN_COOKIE: "firebase-id-token",
  verifyFirebaseIdToken: (...args: unknown[]) => verifyFirebaseIdToken(...args),
}));

import { clearAuthSession, establishAuthSession } from "@/actions/authSession";

describe("establishAuthSession", () => {
  beforeEach(() => {
    cookieSet.mockReset();
    cookieDelete.mockReset();
    verifyFirebaseIdToken.mockReset();
    vi.stubEnv("NODE_ENV", "test");
  });

  it("rejects an empty or oversized token before verification", async () => {
    await expect(establishAuthSession("")).rejects.toThrow("Unauthorized");
    await expect(establishAuthSession("x".repeat(8193))).rejects.toThrow("Unauthorized");
    expect(verifyFirebaseIdToken).not.toHaveBeenCalled();
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it("stores a verified Firebase ID token in the session cookie", async () => {
    verifyFirebaseIdToken.mockResolvedValue({ uid: "user_1" });

    await expect(establishAuthSession("signed-id-token")).resolves.toEqual({
      uid: "user_1",
    });

    expect(verifyFirebaseIdToken).toHaveBeenCalledWith("signed-id-token");
    expect(cookieSet).toHaveBeenCalledWith(
      "firebase-id-token",
      "signed-id-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 55 * 60,
        secure: false,
      })
    );
  });
});

describe("clearAuthSession", () => {
  it("deletes the session cookie", async () => {
    cookieDelete.mockReset();
    await clearAuthSession();
    expect(cookieDelete).toHaveBeenCalledWith("firebase-id-token");
  });
});
