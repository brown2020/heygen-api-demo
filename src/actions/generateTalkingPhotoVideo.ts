"use server";

import { auth } from "@clerk/nextjs/server";
import axios from "axios";

interface GenerateVideoResponse {
  video_id: string;
  error?: string;
}

type VoiceSettings =
  | { type: "audio"; audio_url: string }
  | { type: "text"; voice_id: string; input_text: string }
  | { type: "silence"; duration: number };

export async function generateTalkingPhotoVideo(
  apiKey: string,
  talkingPhotoId: string,
  voiceId?: string,
  script?: string,
  audioUrl?: string
): Promise<GenerateVideoResponse | null> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
    const voice: VoiceSettings = audioUrl
      ? { type: "audio", audio_url: audioUrl }
      : voiceId && script
        ? { type: "text", voice_id: voiceId, input_text: script }
        : { type: "silence", duration: 10.0 };

    const response = await axios.post(
      "https://api.heygen.com/v2/video/generate",
      {
        test: false,
        video_inputs: [
          {
            character: {
              type: "talking_photo",
              talking_photo_id: talkingPhotoId,
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
      }
    );

    const videoId = response.data?.data?.video_id;
    if (!videoId) {
      console.error(
        "No video ID found in response data:",
        JSON.stringify(response.data, null, 2)
      );
      return {
        video_id: "",
        error: "Failed to retrieve video ID. Please try again.",
      };
    }

    return { video_id: videoId };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      if (statusCode === 429) {
        return {
          video_id: "",
          error: "Rate limit exceeded. Please try again later.",
        };
      }

      const apiErrorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message;
      return {
        video_id: "",
        error: `API Error: ${apiErrorMessage}`,
      };
    } else if (error instanceof Error) {
      // Handle generic errors
      console.error("Unexpected error occurred:", error.message);
    } else {
      console.error("An unknown error occurred.");
    }

    return {
      video_id: "",
      error: "An error occurred while generating the video. Please try again.",
    };
  }
}
