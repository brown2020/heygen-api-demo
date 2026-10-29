"use server";

import axios from "axios";
import { axiosErrorSummary } from "@/libs/axios-error";
import { assertSafeStorageId } from "@/libs/storage-id";
import { debitGenerationCredit, refundGenerationCredit } from "@/server/billing";
import { getUserHeygenApiKey } from "@/server/heygen-user";
import { requireUser } from "@/server/verify-id-token";

interface GenerateVideoResponse {
  video_id: string;
  error?: string;
}

type VoiceSettings =
  | { type: "audio"; audio_url: string }
  | { type: "text"; voice_id: string; input_text: string }
  | { type: "silence"; duration: number };

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
      error: error instanceof Error ? error.message : "Talking photo id is invalid",
    };
  }

  let apiKey: string;
  try {
    apiKey = await getUserHeygenApiKey(userId);
    await debitGenerationCredit(userId);
  } catch (error) {
    return {
      video_id: "",
      error: error instanceof Error ? error.message : "Could not start generation",
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
    }

    if (error instanceof Error && error.message === "NO_VIDEO_ID") {
      return {
        video_id: "",
        error: "Failed to retrieve video ID. Please try again.",
      };
    }

    if (axios.isAxiosError(error)) {
      console.error("HeyGen generate failed:", axiosErrorSummary(error));
      const statusCode = error.response?.status;
      if (statusCode === 429) {
        return {
          video_id: "",
          error: "Rate limit exceeded. Please try again later.",
        };
      }
      const apiErrorMessage =
        (typeof error.response?.data?.error?.message === "string" &&
          error.response.data.error.message) ||
        (typeof error.response?.data?.message === "string" && error.response.data.message) ||
        "HeyGen request failed";
      return {
        video_id: "",
        error: `API Error: ${apiErrorMessage}`,
      };
    }

    console.error("Unexpected generate error:", axiosErrorSummary(error));
    return {
      video_id: "",
      error: "An error occurred while generating the video. Please try again.",
    };
  }
}
