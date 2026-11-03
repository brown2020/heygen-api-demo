import type { TalkingPhoto } from "@/types/heygen";

/** Bundled stand-in used when HeyGen cannot render a talking photo. */
export const SAMPLE_TALKING_PHOTO_VIDEO = "/demo/sample-talking-avatar.mp4";
export const SAMPLE_TALKING_PHOTO_IMAGE = "/demo/sample-talking-avatar.png";

export const DEMO_TALKING_PHOTO_ID = "demo-sample-avatar";

export const DEMO_MODE_NO_KEY_NOTICE =
  "Demo mode: showing a sample video because no HeyGen API key is configured.";

export const DEMO_MODE_AUTH_NOTICE =
  "Demo mode: showing a sample video because HeyGen rejected the API key.";

export const DEMO_MODE_QUOTA_NOTICE =
  "Demo mode: showing a sample video because the HeyGen account is out of credits or quota.";

export const DEMO_MODE_ERROR_NOTICE =
  "Demo mode: showing a sample video because HeyGen could not complete this request.";

export type HeygenDemoReason = "missing_key" | "auth" | "quota" | "credits" | "upstream";

export type HeygenDemoSample = {
  demo: true;
  reason: HeygenDemoReason;
  notice: string;
  videoUrl: string;
  imageUrl: string;
};

const CREDIT_PATTERN =
  /\bcredits?\b|payment required|insufficient funds|out of credit/i;
const QUOTA_PATTERN = /\bquota\b|rate limit|too many requests/i;
const SAMPLE_ID =
  /^sample-(missing_key|auth|quota|credits|upstream)-[a-z0-9]+$/;
const UNREADABLE = new Set(["", "{}", "[]", "undefined", "null", "[object Object]"]);

export function readableText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.trim();
  if (!text || UNREADABLE.has(text)) return undefined;
  return text;
}

/** A sentence a person can read. Never "{}", an object dump, or a blank string. */
export function readableError(error: unknown, fallback: string): string {
  if (typeof error === "string") return readableText(error) ?? fallback;
  if (error instanceof Error) return readableText(error.message) ?? fallback;
  if (error && typeof error === "object" && "message" in error) {
    return readableText((error as { message: unknown }).message) ?? fallback;
  }
  return fallback;
}

export function demoNotice(reason: HeygenDemoReason): string {
  if (reason === "missing_key") return DEMO_MODE_NO_KEY_NOTICE;
  if (reason === "auth") return DEMO_MODE_AUTH_NOTICE;
  if (reason === "quota" || reason === "credits") return DEMO_MODE_QUOTA_NOTICE;
  return DEMO_MODE_ERROR_NOTICE;
}

export function demoSample(reason: HeygenDemoReason): HeygenDemoSample {
  return {
    demo: true,
    reason,
    notice: demoNotice(reason),
    videoUrl: SAMPLE_TALKING_PHOTO_VIDEO,
    imageUrl: SAMPLE_TALKING_PHOTO_IMAGE,
  };
}

/**
 * Auth, quota, credit, and every other HTTP 4xx/5xx become a sample.
 * Credit and quota phrases win over the status code.
 */
export function classifyHeygenDemoFallback(
  status: number | undefined,
  bodyText: string
): HeygenDemoReason | null {
  const text = bodyText.slice(0, 2000);
  if (status === 402 || CREDIT_PATTERN.test(text)) return "credits";
  if (status === 429 || QUOTA_PATTERN.test(text)) return "quota";
  if (status === 401 || status === 403) return "auth";
  if (status !== undefined && status >= 400) return "upstream";
  return null;
}

/** A HeyGen call that did not succeed. Network failures count. */
export function heygenFailureReason(input: {
  status?: number;
  bodyText?: string;
  network?: boolean;
}): HeygenDemoReason | null {
  if (input.network) return "upstream";
  return classifyHeygenDemoFallback(input.status, input.bodyText ?? "");
}

export function createSampleVideoId(reason: HeygenDemoReason): string {
  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return `sample-${reason}-${token}`;
}

export function isSampleVideoId(videoId: string): boolean {
  return SAMPLE_ID.test(videoId);
}

export function sampleReasonFromVideoId(videoId: string): HeygenDemoReason | null {
  const match = SAMPLE_ID.exec(videoId);
  if (!match) return null;
  return match[1] as HeygenDemoReason;
}

export function isDemoTalkingPhotoId(id: string | null | undefined): boolean {
  return id === DEMO_TALKING_PHOTO_ID;
}

export function profileHasHeygenKey(apiKey: string | null | undefined): boolean {
  return Boolean(apiKey?.trim());
}

export function builtinDemoTalkingPhoto(): TalkingPhoto {
  return {
    talking_photo_id: DEMO_TALKING_PHOTO_ID,
    talking_photo_name: "Sample talking photo",
    preview_image_url: SAMPLE_TALKING_PHOTO_IMAGE,
  };
}

/** Shows the bundled photo when the profile has no HeyGen key. */
export function withBuiltinDemoTalkingPhoto(
  photos: TalkingPhoto[],
  hasHeygenKey: boolean
): TalkingPhoto[] {
  if (hasHeygenKey) return photos;
  if (photos.some((photo) => photo.talking_photo_id === DEMO_TALKING_PHOTO_ID)) {
    return photos;
  }
  return [builtinDemoTalkingPhoto(), ...photos];
}

export type SampleListItem = {
  id: string;
  videoUrl: string;
  demo: true;
  notice: string;
};

/** Public sample rows skip Storage. Only the bundled path is accepted. */
export function sampleListItem(
  id: string,
  data: Record<string, unknown>
): SampleListItem | null {
  if (data.demo_mode !== true) return null;
  if (data.video_url !== SAMPLE_TALKING_PHOTO_VIDEO) return null;
  const notice = readableText(data.notice) ?? DEMO_MODE_ERROR_NOTICE;
  return {
    id,
    videoUrl: SAMPLE_TALKING_PHOTO_VIDEO,
    demo: true,
    notice,
  };
}
