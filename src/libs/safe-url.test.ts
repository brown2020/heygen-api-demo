import { describe, expect, it } from "vitest";

import { assertSafeHeygenAssetUrl, MAX_VIDEO_DOWNLOAD_BYTES } from "@/libs/safe-url";

describe("assertSafeHeygenAssetUrl", () => {
  it("allows HeyGen https asset hosts", () => {
    expect(
      assertSafeHeygenAssetUrl("https://files2.heygen.ai/video.mp4").hostname
    ).toBe("files2.heygen.ai");
  });

  it("rejects other hosts, redirects targets, and credentials", () => {
    expect(() => assertSafeHeygenAssetUrl("http://files2.heygen.ai/v.mp4")).toThrow(
      /https/
    );
    expect(() => assertSafeHeygenAssetUrl("https://evil.example/v.mp4")).toThrow(/host/);
    expect(() =>
      assertSafeHeygenAssetUrl("https://user:pass@files2.heygen.ai/v.mp4")
    ).toThrow(/credentials/);
    expect(() => assertSafeHeygenAssetUrl("https://169.254.169.254/latest")).toThrow(/host/);
  });
});

describe("download cap", () => {
  it("is bounded", () => {
    expect(MAX_VIDEO_DOWNLOAD_BYTES).toBeLessThanOrEqual(100 * 1024 * 1024);
  });
});
