import { describe, expect, it } from "vitest";

import {
  isWithinPollDeadline,
  VIDEO_POLL_DEADLINE_MS,
  VIDEO_POLL_INTERVAL_MS,
} from "@/libs/video-poll";

describe("isWithinPollDeadline", () => {
  it("keeps polling from the start until just before the 10 minute deadline", () => {
    expect(VIDEO_POLL_INTERVAL_MS).toBe(4000);
    expect(VIDEO_POLL_DEADLINE_MS).toBe(10 * 60 * 1000);
    expect(isWithinPollDeadline(0)).toBe(true);
    expect(isWithinPollDeadline(VIDEO_POLL_DEADLINE_MS - 1)).toBe(true);
    expect(isWithinPollDeadline(VIDEO_POLL_DEADLINE_MS)).toBe(false);
    expect(isWithinPollDeadline(-1)).toBe(false);
  });
});
