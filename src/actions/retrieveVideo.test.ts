import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  set: vi.fn(async () => undefined),
  get: vi.fn(),
  adminThrows: false,
  getUserHeygenApiKey: vi.fn(),
}));

vi.mock("@/firebase/firebaseAdmin", () => ({
  getAdminServices: () => {
    if (mocks.adminThrows) {
      throw new Error("{}");
    }
    const videoDoc = () => ({ set: mocks.set });
    const photosDoc = () => ({ collection: () => ({ doc: videoDoc }) });
    const userDoc = () => ({ collection: () => ({ doc: photosDoc }) });
    return {
      db: { collection: () => ({ doc: userDoc }) },
      bucket: {},
    };
  },
}));

vi.mock("@/server/heygen-user", () => ({
  getUserHeygenApiKey: mocks.getUserHeygenApiKey,
  MISSING_HEYGEN_KEY_MESSAGE: "HeyGen API key is not set",
}));

vi.mock("@/server/verify-id-token", () => ({
  requireUser: vi.fn(async () => ({ uid: "user_1" })),
}));

vi.mock("axios", () => ({
  default: {
    get: mocks.get,
    isAxiosError: () => false,
  },
  isAxiosError: () => false,
}));

import { retrieveVideo } from "@/actions/retrieveVideo";
import { SAMPLE_TALKING_PHOTO_VIDEO } from "@/libs/heygen-demo";

describe("retrieveVideo sample", () => {
  beforeEach(() => {
    mocks.set.mockClear();
    mocks.get.mockClear();
    mocks.adminThrows = false;
    mocks.getUserHeygenApiKey.mockReset();
    mocks.getUserHeygenApiKey.mockRejectedValue(new Error("key should not be read"));
  });

  it("completes immediately and stores the public sample", async () => {
    const result = await retrieveVideo("sample-auth-abc123", "photo_1");

    expect(result?.status).toBe("completed");
    expect(result?.demo).toBe(true);
    expect(result?.video_url).toBe(SAMPLE_TALKING_PHOTO_VIDEO);
    expect(result?.notice).toContain("rejected the API key");
    expect(result?.notice).not.toBe("{}");
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.getUserHeygenApiKey).not.toHaveBeenCalled();
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        demo_mode: true,
        video_url: SAMPLE_TALKING_PHOTO_VIDEO,
      })
    );
  });

  it("still returns the sample when the list save fails", async () => {
    mocks.adminThrows = true;

    const result = await retrieveVideo("sample-upstream-abc123", "photo_1");

    expect(result?.status).toBe("completed");
    expect(result?.video_url).toBe(SAMPLE_TALKING_PHOTO_VIDEO);
    expect(result?.error).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain('"{}');
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
