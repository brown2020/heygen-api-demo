"use server";

import { auth } from "@clerk/nextjs/server";
import { assertSafeStorageId } from "@/libs/storage-id";
import { SIGNED_URL_TTL_MS } from "@/libs/video-poll";
import { getAdminServices } from "@/firebase/firebaseAdmin";

export type ListedVideo = {
  id: string;
  videoUrl: string;
};

export async function listTalkingPhotoVideos(talkingPhotoId: string): Promise<ListedVideo[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const safePhotoId = assertSafeStorageId(talkingPhotoId, "Talking photo id");
  const { bucket, db } = getAdminServices();
  const snap = await db
    .collection("users")
    .doc(userId)
    .collection("talkingPhotos")
    .doc(safePhotoId)
    .collection("videos")
    .get();

  const videos: ListedVideo[] = [];
  for (const doc of snap.docs) {
    const storagePath = doc.get("storage_path");
    if (
      typeof storagePath !== "string" ||
      !storagePath.startsWith(`videos/${userId}/`) ||
      storagePath.includes("..")
    ) {
      continue;
    }
    const [videoUrl] = await bucket.file(storagePath).getSignedUrl({
      action: "read",
      expires: Date.now() + SIGNED_URL_TTL_MS,
    });
    videos.push({ id: doc.id, videoUrl });
  }
  return videos;
}
