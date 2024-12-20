"use server";

import { HeyGenService } from "@/libs/HeyGenService";
import { ApiAvatarGroupResponse, HeyGenFailResponse } from "@/types/heygen";
import axios from "axios";
import { addErrorReport } from "./addErrorReport";
import { handleErrorGeneral } from "@/utils/server-utils/handleErrorGeneral";

interface HeyGenAvatarGroupSuccessResponse {
  status: true;
  data: ApiAvatarGroupResponse;
}

export async function getHeygenAvatarGroups(apiKey: string, include_public: "true" | "false"): Promise<HeyGenAvatarGroupSuccessResponse | HeyGenFailResponse> {
  try {
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: HeyGenService.endpoints.avatar_group_list(include_public),
      headers: {
        "x-api-key": apiKey,
      },
    };

    const response = await axios.request<ApiAvatarGroupResponse>(config);
    if (response.data.error) {
      console.error("Error from API:", response.data.error);
      const errorMessage = typeof response.data.error === "string" ? response.data.error : response.data.error.message;
      await addErrorReport("getHeyGenAvatarGroups", { errorMessage });

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
    return handleErrorGeneral('Error fetching Heygen avatar groups:', 'getHeyGenAvatarGroups', error, { apiKey, include_public }, [401]);
  }
}
