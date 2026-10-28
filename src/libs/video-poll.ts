export const VIDEO_POLL_INTERVAL_MS = 4000;
export const VIDEO_POLL_DEADLINE_MS = 10 * 60 * 1000;

/** Playback URLs minted for the current viewer. */
export const SIGNED_URL_TTL_MS = 15 * 60 * 1000;

export function isWithinPollDeadline(elapsedMs: number): boolean {
  return elapsedMs >= 0 && elapsedMs < VIDEO_POLL_DEADLINE_MS;
}
