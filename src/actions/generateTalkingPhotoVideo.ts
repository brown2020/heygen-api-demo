"use server";

import { auth } from "@clerk/nextjs/server";
import axios from "axios";

interface GenerateVideoResponse {
  video_id: string;
  error?: string;
}

export async function generateTalkingPhotoVideo(
  apiKey: string,
  talkingPhotoId: string,
  voiceId?: string,
  script?: string,
  audioUrl?: string
): Promise<GenerateVideoResponse | null> {
  auth.protect();

  console.log(
    "Starting generateTalkingPhotoVideo function with apiKey, script, audioUrl:",
    apiKey,
    script,
    audioUrl
  );

  try {
    let voiceSettings;

    // Determine voice settings based on available inputs
    if (audioUrl) {
      console.log("Using pre-recorded audio with audioUrl:", audioUrl);
      voiceSettings = {
        type: "audio",
        audio_url: audioUrl,
      };
    } else if (voiceId && script) {
      console.log(
        "Using text-to-speech with voiceId:",
        voiceId,
        "and script:",
        script
      );
      voiceSettings = {
        type: "text",
        voice_id: voiceId,
        input_text: script,
      };
    } else {
      console.log("No audio or script provided, defaulting to silent video");
      voiceSettings = {
        type: "silence",
        duration: 10.0, // Default to 10 seconds of silence
      };
    }

    const config = {
      method: "post",
      url: "https://api.heygen.com/v2/video/generate",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      data: {
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
            voice: voiceSettings,
            background: {
              type: "color",
              value: "#000000", // Default to black background
            },
          },
        ],
        dimension: { width: 512, height: 512 }, // Default dimension
      },
    };

    console.log("Axios config prepared:", JSON.stringify(config, null, 2));

    // Send request to API
    const response = await axios.request(config);

    console.log(
      "Full API response received:",
      JSON.stringify(response.data, null, 2)
    );

    if (response.status === 429) {
      console.warn("API rate limit exceeded. Please try again later.");
      return {
        video_id: "",
        error: "Rate limit exceeded. Please try again later.",
      };
    }

    console.log("API response data:", response.data);

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

    console.log("Video generation successful, video_id:", videoId);
    return { video_id: videoId };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      // Handle Axios errors
      console.error("Axios error response received:");
      console.error("Status code:", error.response?.status);
      console.error(
        "Response data:",
        JSON.stringify(error.response?.data, null, 2)
      );
      console.error(
        "Headers:",
        JSON.stringify(error.response?.headers, null, 2)
      );
      
      const apiErrorMessage = error.response?.data?.error?.message || error.message;
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
