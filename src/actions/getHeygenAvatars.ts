"use server";

import type { HeygenAvatarResponse, TalkingPhoto } from "@/types/heygen";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

function extractTalkingPhotos(payload: unknown): TalkingPhoto[] {
  const data = (payload as any)?.data;
  const inner = data?.data;
  if (inner?.talking_photos && Array.isArray(inner.talking_photos)) {
    return inner.talking_photos as TalkingPhoto[];
  }
  if (Array.isArray(inner)) return inner as TalkingPhoto[];
  if (Array.isArray(data)) return data as TalkingPhoto[];
  return [];
}

async function fetchTalkingPhotos(headers: Record<string, string>) {
  // HeyGen has changed/varied these endpoints over time. We treat 404 as "not supported"
  // and fall back without spamming errors.
  const candidateUrls = [
    "https://api.heygen.com/v2/talking_photos",
    "https://api.heygen.com/v1/talking_photos",
    "https://api.heygen.com/v1/talking_photo.list",
  ];

  for (const url of candidateUrls) {
    const res = await axios.get(url, {
      headers,
      validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
    });
    if (res.status === 404) continue;
    return extractTalkingPhotos(res.data);
  }

  return [] as TalkingPhoto[];
}

export async function getHeygenAvatars(
  apiKey: string
): Promise<HeygenAvatarResponse | null> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  try {
    const headers = {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    };

    // Fetch avatars and talking photos. Talking photos endpoint varies; we fall back gracefully.
    const [avatarsRes, talkingPhotos] = await Promise.all([
      axios.get("https://api.heygen.com/v2/avatars", { headers }),
      fetchTalkingPhotos(headers),
    ]);

    const avatars =
      avatarsRes.data?.data?.avatars || [];

    // Some responses may still include talking_photos under v2/avatars; merge + de-dupe.
    const legacyTalkingPhotos = Array.isArray(avatarsRes.data?.data?.talking_photos)
      ? (avatarsRes.data.data.talking_photos as TalkingPhoto[])
      : [];
    const mergedTalkingPhotos = [...talkingPhotos, ...legacyTalkingPhotos].filter(
      (p, idx, arr) => arr.findIndex((x) => x.talking_photo_id === p.talking_photo_id) === idx
    );

    return {
      error: null,
      data: {
        avatars,
        talking_photos: mergedTalkingPhotos,
      },
    };
  } catch (error) {
    console.error("Error fetching Heygen avatars:", error);
    return null;
  }
}
