"use server";

import { HeygenAvatarResponse } from "@/types/heygen";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

export async function getHeygenAvatars(
  apiKey: string
): Promise<HeygenAvatarResponse | null> {
  auth.protect();
  try {
    const headers = {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    };

    // Parallel fetch for avatars and talking photos
    // v2/avatars might only return avatars now
    // v2/talking_photos is likely the endpoint for talking photos
    const [avatarsRes, talkingPhotosRes] = await Promise.allSettled([
      axios.get("https://api.heygen.com/v2/avatars", { headers }),
      axios.get("https://api.heygen.com/v1/talking_photos", { headers }),
    ]);

    const avatars =
      avatarsRes.status === "fulfilled" && avatarsRes.value.data.data
        ? avatarsRes.value.data.data.avatars || []
        : [];

    let talkingPhotos = [];

    // Check if talking_photos came from v2/avatars (legacy behavior)
    if (
      avatarsRes.status === "fulfilled" &&
      avatarsRes.value.data.data?.talking_photos
    ) {
      talkingPhotos = avatarsRes.value.data.data.talking_photos;
    }

    // If not, or if we want to prioritize the specific endpoint
    if (
      talkingPhotosRes.status === "fulfilled" &&
      talkingPhotosRes.value.data.data
    ) {
        // Use the specific endpoint data if available
        // The structure is likely data.data.talking_photos or data.data (array)
        if (talkingPhotosRes.value.data.data.talking_photos) {
             talkingPhotos = talkingPhotosRes.value.data.data.talking_photos;
        } else if (Array.isArray(talkingPhotosRes.value.data.data)) {
             talkingPhotos = talkingPhotosRes.value.data.data;
        }
    }
    
    if (avatarsRes.status === "rejected") {
        console.error("Error fetching avatars:", avatarsRes.reason);
    }
    if (talkingPhotosRes.status === "rejected") {
        console.error("Error fetching talking photos:", talkingPhotosRes.reason);
    }

    return {
      error: null,
      data: {
        avatars,
        talking_photos: talkingPhotos,
      },
    };
  } catch (error) {
    console.error("Error fetching Heygen avatars:", error);
    return null;
  }
}
