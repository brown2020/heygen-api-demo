"use server";

import { HeyGenService } from "@/libs/HeyGenService";
import { HeyGenFailResponse, ApiAvatarGroupDetailResponse } from "@/types/heygen";
import axios, { AxiosError } from "axios";
import { addErrorReport } from "./addErrorReport";

interface HeyGenAvatarGroupSuccessResponse {
  status: true;
  data: ApiAvatarGroupDetailResponse;
}

export async function getHeygenAvatarGroupLooks(apiKey : string, avatarGroupId: string): Promise<HeyGenAvatarGroupSuccessResponse | HeyGenFailResponse> {
  try {
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: HeyGenService.endpoints.avatar_group_looks_list(avatarGroupId),
      headers: {
        "x-api-key": apiKey,
      },
    };

    const response = await axios.request<ApiAvatarGroupDetailResponse>(config);
    if (response.data.error) {
      console.log("|||||||||||||||||||||||||||||response.data.error", response.data.error);
      
      console.error("Error from API:", response.data.error);
      const errorMessage = typeof response.data.error === "string" ? response.data.error : response.data.error.message;
      await addErrorReport("getHeygenAvatarGroupLooks", {errorMessage});

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
    let errorDetails: Record<string, any> = {avatarGroupId};
    let responseCode: number = typeof error == "object" && error && "status" in error && typeof error.status == 'number' ? error.status : 0;
    // Handle known types of error
    if (error instanceof Error) {
      errorDetails = {
        ...errorDetails,
        name: error.name,
        message: error.message,
        stack: error.stack || null,
        cause : error.cause || null
      };
    } else if(error instanceof AxiosError) {
      responseCode = error.status || 0;
      errorDetails = {
        ...errorDetails,
        name: error.name,
        message: error.message,
        stack: error.stack || null,
        cause : error.cause || null,
        response: error.response?.data,
      };
    } else {
      // For unknown errors
      errorDetails = {
        ...errorDetails,
        message: "Error fetching Heygen avatar groups looks:",
        raw: JSON.stringify(error), // Serialize the raw error
      };
    }
    await addErrorReport("getHeygenAvatarGroupLooks", errorDetails);
    console.error("Error fetching Heygen avatar groups looks:", errorDetails, error, responseCode);
    return {
      status: false,
      error: "Error fetching Heygen avatar groups looks",
      apiStatusCode: responseCode
    };
  }
}
