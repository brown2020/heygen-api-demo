import { describe, expect, it } from "vitest";

import {
  creditsForPaymentAmountCents,
  extractTalkingPhotos,
  mapHeygenVideoStatus,
  resolveVoiceId,
} from "@/libs/heygen-response";

describe("extractTalkingPhotos", () => {
  it("reads nested talking_photos (fixture labeled — no live HeyGen)", () => {
    const photos = extractTalkingPhotos({
      data: { data: { talking_photos: [{ talking_photo_id: "tp1" }] } },
    });
    expect(photos).toHaveLength(1);
    expect(photos[0].talking_photo_id).toBe("tp1");
  });

  it("returns empty for unknown shapes", () => {
    expect(extractTalkingPhotos(null)).toEqual([]);
    expect(extractTalkingPhotos({ data: {} })).toEqual([]);
  });
});

describe("mapHeygenVideoStatus", () => {
  it("maps completed and failed statuses from fixtures", () => {
    expect(
      mapHeygenVideoStatus({ data: { status: "completed", video_url: "https://x" } })
        .status
    ).toBe("completed");
    expect(mapHeygenVideoStatus({ data: { status: "failed", error: "boom" } })).toEqual(
      { status: "failed", error: "boom" }
    );
    expect(mapHeygenVideoStatus({ data: { status: "processing" } }).status).toBe(
      "processing"
    );
  });
});

describe("resolveVoiceId", () => {
  it("replaces missing or known-invalid voice ids", () => {
    expect(resolveVoiceId(undefined)).toBe("1bd001e7e50f421d891986aad5158bc8");
    expect(resolveVoiceId("8awO799gQXhcAUkg9d9l")).toBe(
      "1bd001e7e50f421d891986aad5158bc8"
    );
    expect(resolveVoiceId("good-voice")).toBe("good-voice");
  });
});

describe("creditsForPaymentAmountCents", () => {
  it("grants amount+1 credits", () => {
    expect(creditsForPaymentAmountCents(1000)).toBe(1001);
  });
});
