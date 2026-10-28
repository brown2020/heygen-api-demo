import { describe, expect, it } from "vitest";

import { clientProfileWritePayload } from "@/libs/profile-fields";
import { stripPrivilegedFields } from "@/libs/privileged-fields";
import { assertSafeStorageId } from "@/libs/storage-id";

describe("stripPrivilegedFields", () => {
  it("drops privilege and balance fields", () => {
    expect(
      stripPrivilegedFields({
        uid: "user_1",
        isAdmin: true,
        premium: true,
        credits: 999999,
        authError: "nope",
        authEmail: "a@b.c",
      })
    ).toEqual({ uid: "user_1", authEmail: "a@b.c" });
  });
});

describe("clientProfileWritePayload", () => {
  it("does not let the client write credits", () => {
    expect(
      clientProfileWritePayload({
        heygen_api_key: "key",
        credits: 999999,
        selectedTalkingPhoto: "photo_1",
      })
    ).toEqual({
      heygen_api_key: "key",
      selectedTalkingPhoto: "photo_1",
    });
  });
});

describe("assertSafeStorageId", () => {
  it("rejects path traversal", () => {
    expect(assertSafeStorageId("photo_1", "Talking photo id")).toBe("photo_1");
    expect(() => assertSafeStorageId("../other", "Talking photo id")).toThrow(/invalid/);
    expect(() => assertSafeStorageId("a/b", "Talking photo id")).toThrow(/invalid/);
  });
});
