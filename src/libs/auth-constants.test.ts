import { describe, expect, it } from "vitest";

import { isProtectedPath } from "@/libs/auth-constants";

describe("isProtectedPath", () => {
  it("protects app routes and allows home", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/avatars")).toBe(true);
    expect(isProtectedPath("/generate/extra")).toBe(true);
    expect(isProtectedPath("/profile")).toBe(true);
  });
});
