"use server";

import { HeyGenService } from "@/libs/HeyGenService";
import { ApiAvatarGroupResponse, HeyGenFailResponse } from "@/types/heygen";
import axios from "axios";
import { addErrorReport } from "./addErrorReport";

interface HeyGenAvatarGroupSuccessResponse {
  status: true;
  data: ApiAvatarGroupResponse;
}

export async function getHeygenAvatarGroups(apiKey : string): Promise<HeyGenAvatarGroupSuccessResponse | HeyGenFailResponse> {
  try {
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: HeyGenService.endpoints.avatar_group_list,
      headers: {
        "x-api-key": apiKey,
      },
    };

    const response = await axios.request<ApiAvatarGroupResponse>(config);
    if (response.data.error) {
      console.error("Error from API:", response.data.error);
      const errorMessage = typeof response.data.error === "string" ? response.data.error : response.data.error.message;
      await addErrorReport("getHeyGenAvatarGroups", {errorMessage});

      return {
        status: false,
        error: errorMessage,
      };
    }

    return {
      status: true,
      data: response.data
    };
  } catch (error) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    let errorDetails: Record<string, any> = {};

    // Handle known types of error
    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack || null,
        cause : error.cause || null
      };
    } else {
      // For unknown errors
      errorDetails = {
        message: "Error fetching Heygen avatar groups:",
        raw: JSON.stringify(error), // Serialize the raw error
      };
    }
    await addErrorReport("getHeyGenAvatars", errorDetails);
    console.error("Error fetching Heygen avatar groups:", error);
    return {
      status: false,
      error: "Error fetching Heygen avatar groups",
    };
  }
}
