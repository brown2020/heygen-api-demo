import { describe, expect, it } from "vitest";

import { decideProxyAccess, isProtectedPath } from "@/libs/route-guard";

describe("isProtectedPath", () => {
  it("protects app routes and allows home", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/avatars")).toBe(true);
    expect(isProtectedPath("/generate/extra")).toBe(true);
    expect(isProtectedPath("/profile")).toBe(true);
  });
});

describe("decideProxyAccess", () => {
  it("fails closed for protected routes in production without a session", () => {
    expect(
      decideProxyAccess({
        hasSession: false,
        isProduction: true,
        pathname: "/profile",
      })
    ).toBe("deny");
    expect(
      decideProxyAccess({
        hasSession: false,
        isProduction: true,
        pathname: "/",
      })
    ).toBe("allow");
    expect(
      decideProxyAccess({
        hasSession: false,
        isProduction: false,
        pathname: "/avatars",
      })
    ).toBe("allow");
    expect(
      decideProxyAccess({
        hasSession: true,
        isProduction: true,
        pathname: "/profile",
      })
    ).toBe("allow");
  });
});
