"use server";

import { HeygenAvatarResponse } from "@/types/heygen";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

export async function getHeygenAvatars(
  apiKey: string
): Promise<HeygenAvatarResponse | null> {
  auth.protect();
  try {
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "https://api.heygen.com/v2/avatars",
      headers: {
        "x-api-key": apiKey,
      },
    };

    const response = await axios.request<HeygenAvatarResponse>(config);
    if (response.data.error) {
      console.error("Error from API:", response.data.error);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching Heygen avatars:", error);
    return null;
  }
}
