import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { decideProxyAccess } from "@/libs/auth-constants";
import { SIGNED_URL_TTL_MS, VIDEO_POLL_DEADLINE_MS } from "@/libs/video-poll";

const firestoreRules = readFileSync("firestore.rules", "utf8");
const storageRules = readFileSync("storage.rules", "utf8");
const retrieveVideo = readFileSync("src/actions/retrieveVideo.ts", "utf8");
const paymentActions = readFileSync("src/actions/paymentActions.ts", "utf8");
const webhook = readFileSync("src/app/api/stripe/webhook/route.ts", "utf8");
const cors = readFileSync("cors.json", "utf8");

describe("firestore rules", () => {
  it("keeps credits and payments server-owned and scopes media to the owner", () => {
    expect(firestoreRules).toContain("request.resource.data.credits == resource.data.credits");
    expect(firestoreRules).toContain("request.resource.data.credits == 1000");
    expect(firestoreRules).toContain("allow write: if false");
    expect(firestoreRules).not.toContain("allow read, write: if isAuthenticated()");
    expect(firestoreRules).toContain("match /users/{userId}");
    expect(firestoreRules).toContain("match /talkingPhotos/{photoId}");
    expect(firestoreRules).not.toMatch(/match \/talkingPhotos\/\{photoId\}[\s\S]*allow read, write: if isAuthenticated/);
  });
});

describe("storage rules", () => {
  it("allows the owner to read only their video prefix", () => {
    expect(storageRules).toContain("match /videos/{userId}/{allPaths=**}");
    expect(storageRules).toContain("request.auth.uid == userId");
    expect(storageRules).not.toContain("allow read: if isAuthenticated();");
  });
});

describe("video retrieval", () => {
  it("does not poll inside the action or mint century-long URLs", () => {
    expect(retrieveVideo).not.toContain("attempts < 600");
    expect(retrieveVideo).not.toContain("01-01-2124");
    expect(retrieveVideo).toContain("maxRedirects: 0");
    expect(retrieveVideo).toContain("videos/${userId}/");
    expect(SIGNED_URL_TTL_MS).toBeLessThanOrEqual(60 * 60 * 1000);
    expect(VIDEO_POLL_DEADLINE_MS).toBeLessThanOrEqual(10 * 60 * 1000);
  });
});

describe("payments", () => {
  it("does not return a client secret from finalization and verifies webhooks", () => {
    expect(paymentActions).not.toContain("client_secret: paymentIntent");
    expect(paymentActions).toContain("callerUserId: userId");
    expect(webhook).toContain("STRIPE_WEBHOOK_SECRET");
    expect(webhook).toContain("503");
    expect(webhook).toContain("constructEvent");
  });
});

describe("storage cors", () => {
  it("does not allow every origin", () => {
    expect(cors).not.toContain('"*"');
    expect(cors).toContain("https://heygen-api-demo.vercel.app");
  });
});

describe("decideProxyAccess", () => {
  it("fails closed for protected routes in production without Clerk", () => {
    expect(
      decideProxyAccess({
        clerkConfigured: false,
        isProduction: true,
        pathname: "/profile",
      })
    ).toBe("deny");
    expect(
      decideProxyAccess({
        clerkConfigured: false,
        isProduction: true,
        pathname: "/",
      })
    ).toBe("allow");
    expect(
      decideProxyAccess({
        clerkConfigured: false,
        isProduction: false,
        pathname: "/avatars",
      })
    ).toBe("allow");
    expect(
      decideProxyAccess({
        clerkConfigured: true,
        isProduction: true,
        pathname: "/profile",
      })
    ).toBe("clerk");
  });
});
