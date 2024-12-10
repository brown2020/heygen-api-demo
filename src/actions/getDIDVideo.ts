"use server";

import { DIDVideoStatus } from "@/types/heygen";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

interface GetVideoSuccessResponse {
  id: string;
  status: DIDVideoStatus;
  result_url: string;
  errorDetails?: Record<string, unknown>;
  errorMessage?: string;
}
interface GetVideoFailResponse {
  error: string;
}

export async function getDIDVideo(
  apiKey: string | null,
  video_id: string
): Promise<GetVideoSuccessResponse | GetVideoFailResponse | null> {
  await auth.protect();

  if (!apiKey && process.env.D_ID_API_KEY !== undefined) {
    apiKey = process.env.D_ID_API_KEY;
  }

  try {
    console.log(
      "Preparing Axios request to D-ID API for video ID:",
      `https://api.d-id.com/talks/${video_id}`
    );

    const config = {
      method: "get",
      url: `https://api.d-id.com/talks/${video_id}`,
      headers: {
        Authorization: `Basic ${apiKey}`,
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
    const result_url = response.data?.result_url;

    if (!id) {
      console.error("No ID found in API response data:", response.data);
      return {
        error: "Failed to retrieve ID from the response. Please try again.",
      };
    } else if (status == "error") {
      const errorDetails = response.data?.error;
      const errorMessage = response.data?.error?.description;

      if (
        typeof errorDetails === "object" &&
        "kind" in errorDetails &&
        errorDetails.kind === "FaceError"
      ) {
        return {
          id,
          status,
          result_url,
          errorMessage: `Issue with your source image, please try again with a different image. Error: ${errorMessage}`,
          errorDetails: errorDetails,
        };
      }
    }

    console.log("Video generation successful. Video ID:", response.data);
    return { id, status, result_url };
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Error during video generation:", error.message);

      if (error.response) {
        console.error("Error response from API:", {
          status: error.response.status,
          data: JSON.stringify(error.response.data, null, 2),
        });

        if (error.response.status === 429) {
          return {
            error: "Rate limit exceeded. Please try again later.",
          };
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

    return {
      error:
        "An error occurred while generating the video. Make sure you have entered valid API keys in your profile and try again. If you are running on localhost, make sure you use ngrok to expose your local server to the internet.",
    };
  }
}
