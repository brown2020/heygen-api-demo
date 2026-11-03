"use server";

import axios from "axios";
import { axiosErrorSummary } from "@/libs/axios-error";
import {
  createSampleVideoId,
  demoSample,
  heygenFailureReason,
  readableError,
  readableText,
  type HeygenDemoReason,
} from "@/libs/heygen-demo";
import { assertSafeStorageId } from "@/libs/storage-id";
import { debitGenerationCredit, refundGenerationCredit } from "@/server/billing";
import {
  getUserHeygenApiKey,
  MISSING_HEYGEN_KEY_MESSAGE,
} from "@/server/heygen-user";
import { requireUser } from "@/server/verify-id-token";

interface GenerateVideoResponse {
  video_id: string;
  error?: string;
  demo?: boolean;
  notice?: string;
  video_url?: string;
}

type VoiceSettings =
  | { type: "audio"; audio_url: string }
  | { type: "text"; voice_id: string; input_text: string }
  | { type: "silence"; duration: number };

function sampleResponse(reason: HeygenDemoReason): GenerateVideoResponse {
  const sample = demoSample(reason);
  return {
    video_id: createSampleVideoId(reason),
    demo: true,
    notice: sample.notice,
    video_url: sample.videoUrl,
  };
}

function heygenBodyText(data: unknown, fallback: string): string {
  if (typeof data === "string") return data;
  if (data == null) return fallback;
  try {
    return JSON.stringify(data);
  } catch {
    return fallback;
  }
}

export async function generateTalkingPhotoVideo(
  talkingPhotoId: string,
  voiceId?: string,
  script?: string,
  audioUrl?: string
): Promise<GenerateVideoResponse | null> {
  const { uid: userId } = await requireUser();

  let safePhotoId: string;
  try {
    safePhotoId = assertSafeStorageId(talkingPhotoId, "Talking photo id");
  } catch (error) {
    return {
      video_id: "",
      error: readableError(error, "Talking photo id is invalid"),
    };
  }

  let apiKey: string;
  try {
    apiKey = await getUserHeygenApiKey(userId);
  } catch (error) {
    if (error instanceof Error && error.message === MISSING_HEYGEN_KEY_MESSAGE) {
      return sampleResponse("missing_key");
    }
    return {
      video_id: "",
      error: readableError(error, "Could not read the HeyGen API key"),
    };
  }

  try {
    await debitGenerationCredit(userId);
  } catch (error) {
    return {
      video_id: "",
      error: readableError(error, "Not enough credits"),
    };
  }

  try {
    const voice: VoiceSettings = audioUrl
      ? { type: "audio", audio_url: audioUrl }
      : voiceId && script
        ? { type: "text", voice_id: voiceId, input_text: script }
        : { type: "silence", duration: 10.0 };

    const response = await axios.post(
      "https://api.heygen.com/v2/video/generate",
      {
        test: process.env.HEYGEN_USE_FIXTURES === "true",
        video_inputs: [
          {
            character: {
              type: "talking_photo",
              talking_photo_id: safePhotoId,
              scale: 1,
              talking_photo_style: "square",
              talking_style: "stable",
              expression: "happy",
            },
            voice,
            background: { type: "color", value: "#000000" },
          },
        ],
        dimension: { width: 512, height: 512 },
      },
      {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        timeout: 30_000,
        maxRedirects: 0,
      }
    );

    const videoId = response.data?.data?.video_id;
    if (typeof videoId !== "string" || !videoId) {
      throw new Error("NO_VIDEO_ID");
    }
    assertSafeStorageId(videoId, "Video id");

    return { video_id: videoId };
  } catch (error: unknown) {
    try {
      await refundGenerationCredit(userId);
    } catch (refundError) {
      console.error("Credit refund failed:", axiosErrorSummary(refundError));
      return {
        video_id: "",
        error: readableError(refundError, "Could not refund the credit after HeyGen failed"),
      };
    }

    const fallback = axios.isAxiosError(error)
      ? heygenFailureReason({
          status: error.response?.status,
          bodyText: heygenBodyText(error.response?.data, error.message),
          network: !error.response,
        })
      : error instanceof Error && error.message === "NO_VIDEO_ID"
        ? heygenFailureReason({ network: true })
        : null;

    if (fallback) {
      console.error("HeyGen generate failed; using sample video:", axiosErrorSummary(error));
      return sampleResponse(fallback);
    }

    if (axios.isAxiosError(error)) {
      console.error("HeyGen generate failed:", axiosErrorSummary(error));
      const apiErrorMessage =
        readableText(error.response?.data?.error?.message) ||
        readableText(error.response?.data?.message) ||
        "HeyGen request failed";
      return {
        video_id: "",
        error: `API Error: ${apiErrorMessage}`,
      };
    }

    console.error("Unexpected generate error:", axiosErrorSummary(error));
    return {
      video_id: "",
      error: readableError(error, "An error occurred while generating the video. Please try again."),
    };
  }
}
