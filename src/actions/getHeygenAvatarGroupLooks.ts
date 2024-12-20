"use server";

import { HeyGenService } from "@/libs/HeyGenService";
import { HeyGenFailResponse, ApiAvatarGroupDetailResponse } from "@/types/heygen";
import axios from "axios";
import { addErrorReport } from "./addErrorReport";
import { handleErrorGeneral } from "@/utils/server-utils/handleErrorGeneral";

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
    return handleErrorGeneral("Error fetching Heygen avatar groups looks", "getHeygenAvatarGroupLooks", error, {avatarGroupId});
  }
}
