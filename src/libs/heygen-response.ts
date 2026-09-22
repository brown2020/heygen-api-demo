import type { TalkingPhoto } from "@/types/heygen";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Extract talking photos from varied HeyGen API payload shapes (fixture-safe). */
export function extractTalkingPhotos(payload: unknown): TalkingPhoto[] {
  if (!isRecord(payload)) return [];

  const data = payload.data;
  if (isRecord(data)) {
    const inner = data.data;
    if (isRecord(inner) && Array.isArray(inner.talking_photos)) {
      return inner.talking_photos as TalkingPhoto[];
    }
    if (Array.isArray(inner)) return inner as TalkingPhoto[];
    if (Array.isArray(data.talking_photos)) {
      return data.talking_photos as TalkingPhoto[];
    }
  }

  if (Array.isArray(data)) return data as TalkingPhoto[];
  return [];
}

export type HeygenVideoStatus = "processing" | "completed" | "failed" | "pending";

/** Map HeyGen status.get payload into app status (no live API). */
export function mapHeygenVideoStatus(raw: unknown): {
  status: HeygenVideoStatus;
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
} {
  if (!isRecord(raw)) return { status: "pending" };
  const data = isRecord(raw.data) ? raw.data : raw;
  const status = String(data.status || "pending").toLowerCase();
  if (status === "completed") {
    return {
      status: "completed",
      video_url: typeof data.video_url === "string" ? data.video_url : undefined,
      thumbnail_url:
        typeof data.thumbnail_url === "string" ? data.thumbnail_url : undefined,
    };
  }
  if (status === "failed") {
    return {
      status: "failed",
      error:
        (isRecord(data.error) && typeof data.error.message === "string"
          ? data.error.message
          : typeof data.error === "string"
            ? data.error
            : undefined) || "Video rendering failed.",
    };
  }
  return { status: "processing" };
}

/** Resolve voice id with known-invalid fallback (fixture / unit tested). */
export function resolveVoiceId(voiceId: string | undefined | null): string {
  const FALLBACK = "1bd001e7e50f421d891986aad5158bc8";
  const INVALID = "8awO799gQXhcAUkg9d9l";
  if (!voiceId || voiceId === INVALID) return FALLBACK;
  return voiceId;
}

/** Demo credit grant formula preserved from client payment success flow. */
export function creditsForPaymentAmountCents(amountCents: number): number {
  return amountCents + 1;
}
