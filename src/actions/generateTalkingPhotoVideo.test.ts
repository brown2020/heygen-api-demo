import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  getUserHeygenApiKey: vi.fn(),
  debitGenerationCredit: vi.fn(),
  refundGenerationCredit: vi.fn(),
  requireUser: vi.fn(async () => ({ uid: "user_1" })),
}));

vi.mock("axios", () => {
  const isAxiosError = (error: unknown) =>
    Boolean(
      error &&
        typeof error === "object" &&
        (error as { isAxiosError?: boolean }).isAxiosError
    );
  return {
    default: {
      post: mocks.post,
      isAxiosError,
    },
    isAxiosError,
  };
});

vi.mock("@/server/verify-id-token", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/server/heygen-user", () => ({
  getUserHeygenApiKey: mocks.getUserHeygenApiKey,
  MISSING_HEYGEN_KEY_MESSAGE: "HeyGen API key is not set",
}));

vi.mock("@/server/billing", () => ({
  debitGenerationCredit: mocks.debitGenerationCredit,
  refundGenerationCredit: mocks.refundGenerationCredit,
}));

import { generateTalkingPhotoVideo } from "@/actions/generateTalkingPhotoVideo";
import { SAMPLE_TALKING_PHOTO_VIDEO } from "@/libs/heygen-demo";

function axiosFailure(status: number | undefined, data: unknown) {
  return {
    isAxiosError: true,
    message: "Request failed",
    response: status ? { status, data } : undefined,
  };
}

describe("generateTalkingPhotoVideo fallback", () => {
  beforeEach(() => {
    mocks.post.mockReset();
    mocks.getUserHeygenApiKey.mockReset();
    mocks.debitGenerationCredit.mockReset();
    mocks.refundGenerationCredit.mockReset();
    mocks.refundGenerationCredit.mockResolvedValue(undefined);
    mocks.debitGenerationCredit.mockResolvedValue(9);
  });

  it("returns the bundled sample and does not charge when the key is missing", async () => {
    mocks.getUserHeygenApiKey.mockRejectedValue(new Error("HeyGen API key is not set"));

    const result = await generateTalkingPhotoVideo("photo_1", "voice", "Hello");

    expect(result?.demo).toBe(true);
    expect(result?.video_url).toBe(SAMPLE_TALKING_PHOTO_VIDEO);
    expect(result?.notice).toContain("no HeyGen API key");
    expect(result?.notice).not.toBe("{}");
    expect(result?.video_id.startsWith("sample-missing_key-")).toBe(true);
    expect(mocks.debitGenerationCredit).not.toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it("refunds and returns the sample when HeyGen returns an error", async () => {
    mocks.getUserHeygenApiKey.mockResolvedValue("live-key");
    mocks.post.mockRejectedValue(axiosFailure(401, {}));

    const result = await generateTalkingPhotoVideo("photo_1", "voice", "Hello");

    expect(mocks.debitGenerationCredit).toHaveBeenCalledWith("user_1");
    expect(mocks.refundGenerationCredit).toHaveBeenCalledWith("user_1");
    expect(result?.demo).toBe(true);
    expect(result?.video_id.startsWith("sample-auth-")).toBe(true);
    expect(result?.video_url).toBe(SAMPLE_TALKING_PHOTO_VIDEO);
    expect(result?.notice).not.toBe("{}");
    expect(result?.error).toBeUndefined();
  });

  it("uses the sample for a 500 body that is only an empty object", async () => {
    mocks.getUserHeygenApiKey.mockResolvedValue("live-key");
    mocks.post.mockRejectedValue(axiosFailure(500, {}));

    const result = await generateTalkingPhotoVideo("photo_1");

    expect(result?.demo).toBe(true);
    expect(result?.video_id.startsWith("sample-upstream-")).toBe(true);
    expect(result?.notice).not.toContain("{}");
    expect(mocks.refundGenerationCredit).toHaveBeenCalledTimes(1);
  });

  it("keeps the live video id when HeyGen accepts the job", async () => {
    mocks.getUserHeygenApiKey.mockResolvedValue("live-key");
    mocks.post.mockResolvedValue({ data: { data: { video_id: "vid_123" } } });

    const result = await generateTalkingPhotoVideo("photo_1", "voice", "Hello");

    expect(result).toEqual({ video_id: "vid_123" });
    expect(mocks.debitGenerationCredit).toHaveBeenCalledTimes(1);
    expect(mocks.refundGenerationCredit).not.toHaveBeenCalled();
  });
});
