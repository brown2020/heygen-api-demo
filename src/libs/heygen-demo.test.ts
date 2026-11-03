import { readFileSync, statSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  DEMO_MODE_AUTH_NOTICE,
  DEMO_MODE_ERROR_NOTICE,
  DEMO_MODE_NO_KEY_NOTICE,
  DEMO_TALKING_PHOTO_ID,
  SAMPLE_TALKING_PHOTO_IMAGE,
  SAMPLE_TALKING_PHOTO_VIDEO,
  classifyHeygenDemoFallback,
  createSampleVideoId,
  demoSample,
  heygenFailureReason,
  isSampleVideoId,
  profileHasHeygenKey,
  readableError,
  sampleListItem,
  withBuiltinDemoTalkingPhoto,
} from "@/libs/heygen-demo";

describe("readableError", () => {
  it("never surfaces an empty object", () => {
    expect(readableError({}, "Try again.")).toBe("Try again.");
    expect(readableError("{}", "Try again.")).toBe("Try again.");
    expect(readableError({ message: "{}" }, "Try again.")).toBe("Try again.");
    expect(readableError(new Error("{}"), "Try again.")).toBe("Try again.");
    expect(readableError(new Error("Not enough credits"), "Try again.")).toBe(
      "Not enough credits"
    );
  });
});

describe("no HeyGen key", () => {
  it("plans the bundled sample and does not charge", () => {
    expect(profileHasHeygenKey("  ")).toBe(false);
    expect(profileHasHeygenKey("hg_live")).toBe(true);
    const sample = demoSample("missing_key");
    expect(sample.notice).toBe(DEMO_MODE_NO_KEY_NOTICE);
    expect(sample.notice).not.toBe("{}");
    expect(sample.videoUrl).toBe(SAMPLE_TALKING_PHOTO_VIDEO);
    expect(sample.imageUrl).toBe(SAMPLE_TALKING_PHOTO_IMAGE);
    const photos = withBuiltinDemoTalkingPhoto([], false);
    expect(photos[0]?.talking_photo_id).toBe(DEMO_TALKING_PHOTO_ID);
    expect(withBuiltinDemoTalkingPhoto([], true)).toEqual([]);
  });
});

describe("HeyGen error fallback", () => {
  it("maps auth, quota, and other 4xx/5xx responses onto a sample", () => {
    expect(classifyHeygenDemoFallback(401, "{}")).toBe("auth");
    expect(classifyHeygenDemoFallback(403, "forbidden")).toBe("auth");
    expect(classifyHeygenDemoFallback(402, "")).toBe("credits");
    expect(classifyHeygenDemoFallback(429, "")).toBe("quota");
    expect(classifyHeygenDemoFallback(500, "{}")).toBe("upstream");
    expect(classifyHeygenDemoFallback(400, "bad request")).toBe("upstream");
    expect(heygenFailureReason({ network: true })).toBe("upstream");
    expect(demoSample("auth").notice).toBe(DEMO_MODE_AUTH_NOTICE);
    expect(demoSample("upstream").notice).toBe(DEMO_MODE_ERROR_NOTICE);
    expect(demoSample("upstream").notice).not.toContain("{}");
  });

  it("builds an id the status poll can finish immediately", () => {
    const id = createSampleVideoId("auth");
    expect(isSampleVideoId(id)).toBe(true);
    expect(isSampleVideoId("heygen-video-1")).toBe(false);
  });
});

describe("sample list row", () => {
  it("accepts only the bundled public video", () => {
    expect(
      sampleListItem("sample-auth-abc", {
        demo_mode: true,
        video_url: SAMPLE_TALKING_PHOTO_VIDEO,
        notice: DEMO_MODE_AUTH_NOTICE,
      })
    ).toEqual({
      id: "sample-auth-abc",
      videoUrl: SAMPLE_TALKING_PHOTO_VIDEO,
      demo: true,
      notice: DEMO_MODE_AUTH_NOTICE,
    });
    expect(
      sampleListItem("live", {
        demo_mode: true,
        video_url: "https://evil.example/video.mp4",
      })
    ).toBeNull();
    expect(sampleListItem("live", { storage_path: "videos/u/p/v.mp4" })).toBeNull();
  });
});

describe("bundled sample media", () => {
  it("ships a small original video and image", () => {
    const video = statSync("public/demo/sample-talking-avatar.mp4");
    const image = readFileSync("public/demo/sample-talking-avatar.png");
    expect(video.size).toBeGreaterThan(200);
    expect(video.size).toBeLessThan(200_000);
    expect(image.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });
});
