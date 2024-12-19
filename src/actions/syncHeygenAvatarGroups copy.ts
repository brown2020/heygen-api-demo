"use server";

import { HeyGenService } from "@/libs/HeyGenService";
import { Avatar, HeygenAvatarResponse, HeyGenFailResponse, TalkingPhoto } from "@/types/heygen";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { addErrorReport } from "./addErrorReport";
import { getHeygenAvatarGroups } from "./getHeygenAvatarGroups";

interface SuccessResponse {
  status: true;
  avatars: Avatar[];
  talking_photos: TalkingPhoto[];
}

export async function syncHeygenAvatarGroups(apiKey : string): Promise<SuccessResponse | HeyGenFailResponse> {
  auth.protect();
  try {
    // - Fetch all groups
    const avatarGroups = await getHeygenAvatarGroups(apiKey);
    if (!avatarGroups.status) return avatarGroups;
    
    // Create separate list of public and personal avatar groups
    const publicGroups = avatarGroups.data.data.avatar_group_list.filter(group => group.group_type.toLowerCase().includes("public"));
    
    const personalGroups = avatarGroups.data.data.avatar_group_list.filter(group => !group.group_type.toLowerCase().includes("public"));

    // - Check for new public avatar
    // - If exist add to group
    //   - if new group then list all looks for that group
    //   - if new look then add that look to group
    // - Check for new private avatar
    // - If exist add to group
    //   - if new group then list all looks for that group
    //   - if new look then add that look to group

    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: HeyGenService.endpoints.avatar_list,
      headers: {
        "x-api-key": apiKey,
      },
    };

    const response = await axios.request<HeygenAvatarResponse>(config);
    if (response.data.error) {
      console.error("Error from API:", response.data.error);
      const errorMessage = typeof response.data.error === "string" ? response.data.error : response.data.error.message;
      return {
        status: false,
        error: errorMessage,
      };
    }

    return {
      status: true,
      ...response.data.data
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
        message: "Error fetching Heygen avatars:",
        raw: JSON.stringify(error), // Serialize the raw error
      };
    }
    await addErrorReport("getHeyGenAvatars", errorDetails);
    console.error("Error fetching Heygen avatars:", error);
    return {
      status: false,
      error: "Error fetching Heygen avatars",
    };
  }
}
