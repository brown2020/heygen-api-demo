"use server";

import { DIDVideoStatus, Emotion, Movement } from "@/types/heygen";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { addErrorReport } from "./addErrorReport";

export type GenerateVideoSuccessResponse = {
  id: string;
  status: DIDVideoStatus;
};

export type GenerateVideoFailResponse = {
  error: string;
};

export async function generateDIDVideo(
  apiKey: string | null,
  imageUrl: string,
  webhookUrl: string,
  inputText?: string,
  voiceId?: string,
  audioUrl?: string,
  elevenlabsApiKey?: string,
  emotion: Emotion = "Excited",
  movement: Movement = "neutral"
): Promise<GenerateVideoSuccessResponse | GenerateVideoFailResponse> {
  await auth.protect();

  if (!apiKey && process.env.D_ID_API_KEY !== undefined) {
    apiKey = process.env.D_ID_API_KEY;
  }
  if (!elevenlabsApiKey && process.env.ELEVENLABS_API_KEY !== undefined) {
    elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
  }

  try {
    let scriptSettings;

    // Determine script settings based on available inputs
    if (audioUrl) {
      console.log("Audio URL provided. Using pre-recorded audio:", audioUrl);
      scriptSettings = {
        type: "audio",
        url: audioUrl,
      };
    } else if (voiceId && inputText) {
      console.log("Voice ID and script provided. Using text-to-speech:", {
        voiceId,
        inputText,
      });
      scriptSettings = {
        type: "text",
        input: inputText,
        provider: {
          type: "elevenlabs",
          voice_id: voiceId,
        },
      };
    } else {
      console.log("No audio or script provided. Defaulting to silent video");
      scriptSettings = {
        type: "text",
        input: "Hello, this is a silent example",
      };
    }

    console.log("Script settings configured:", scriptSettings);

    const config = {
      method: "post",
      url: "https://api.d-id.com/talks",
      headers: {
        "x-api-key-external": JSON.stringify({
          elevenlabs: elevenlabsApiKey, // Use the passed in ElevenLabs API key
        }),
        "Content-Type": "application/json",
        Authorization: `Basic ${apiKey}`,
      },
      data: {
        webhook: webhookUrl,
        script: scriptSettings,
        source_url: imageUrl,
        config: {
          stitch: true,
          driver_expressions: {
            expressions: [
              {
                expression: emotion,
                start_frame: 0,
                intensity: movement == "lively" ? 1 : 0.5,
              },
            ],
          },
        },
      },
    };

    console.log(
      "Axios request config prepared:",
      JSON.stringify(config, null, 2)
    );

    const response = await axios.request(config);

    console.log(
      "Response received from D-ID API:",
      response.status,
      response.statusText
    );

    if (response.status === 429) {
      console.warn("API rate limit exceeded. Please try again later.");
      return {
        error: "Rate limit exceeded. Please try again later.",
      };
    }

    if (response.status >= 400) {
      console.error("API request failed with status:", response.status);
      console.error("Error response data:", response.data);
      return {
        error: `Failed with status ${response.status}: ${response.statusText}`,
      };
    }

    const id = response.data?.id;
    const status = response.data?.status;
    if (!id) {
      console.error("No ID found in API response data:", response.data);
      return {
        error: "Failed to retrieve ID from the response. Please try again.",
      };
    }

    console.log("Video generation successful. Video ID:", id);
    return { id, status };
  } catch (error: unknown) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    let errorDetails: Record<string, any> = {};

    // Handle known types of error
    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack || null,
      };
    } else {
      // For unknown errors
      errorDetails = {
        message: "Unknown error occurred",
        raw: JSON.stringify(error), // Serialize the raw error
      };
    }

    let errorMessage: string = "";

    if (axios.isAxiosError(error)) {
      console.error("Error during video generation:", error.message);

      if (error.response) {
        const responseError = {
          status: error.response.status,
          data: JSON.stringify(error.response.data, null, 2),
        };
        console.error("Error response from API:", responseError);
        errorDetails["responseError"] = responseError;

        if (error.response.status === 429) {
          errorMessage = "Rate limit exceeded. Please try again later.";
        } else if (error.response.status === 402) {
          errorMessage =
            "Your account is out of credits. Please add more credits to generate video.";
        } else if (
          typeof error.response.data === "object" &&
          "kind" in error.response.data &&
          error.response.data.kind == "TextToSpeechProviderError"
        ) {
          errorMessage =
            "Text to speech provider error. Please check the elevenlabs key, input text or voice ID.";
        } else if (
          typeof error.response.data === "object" &&
          "kind" in error.response.data &&
          error.response.data.kind == "ValidationError"
        ) {
          /**
           * TODO: Send Error Report
           * Message: Issue with validation of the request
           * Data: JSON.stringify(error.response.data, null, 2)
           */
          errorMessage =
            "Something went wrong, while requesting your generate video.";
        }
      } else if (error.request) {
        console.error(
          "No response received from API. Error request data:",
          error.request
        );
      } else {
        console.error("Unexpected error during API call:", error.message);
      }
    } else if (error instanceof Error) {
      console.error("Unexpected error occurred:", error.message);
    } else {
      console.error("An unknown error occurred.");
    }
    await addErrorReport("generateDIDVideo", errorDetails);

    return {
      error:
        errorMessage ||
        "An error occurred while generating the video. Make sure you have entered valid API keys in your profile and try again. If you are running on localhost, make sure you use ngrok to expose your local server to the internet.",
    };
  }
}
