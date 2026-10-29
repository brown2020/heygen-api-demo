"use server";

import axios from "axios";
import { axiosErrorSummary } from "@/libs/axios-error";
import { mapHeygenVideoStatus } from "@/libs/heygen-response";
import { assertSafeHeygenAssetUrl, MAX_VIDEO_DOWNLOAD_BYTES } from "@/libs/safe-url";
import { assertSafeStorageId } from "@/libs/storage-id";
import { SIGNED_URL_TTL_MS } from "@/libs/video-poll";
import { getAdminServices } from "@/firebase/firebaseAdmin";
import { getUserHeygenApiKey } from "@/server/heygen-user";
import { requireUser } from "@/server/verify-id-token";

interface RetrieveVideoResponse {
  status: "processing" | "completed" | "failed" | "pending";
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
}

function safeThumbnail(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return assertSafeHeygenAssetUrl(value).toString();
  } catch {
    return null;
  }
}

export async function retrieveVideo(
  videoId: string,
  talkingPhotoId: string
): Promise<RetrieveVideoResponse | null> {
  const { uid: userId } = await requireUser();

  let safeVideoId: string;
  let safePhotoId: string;
  try {
    safeVideoId = assertSafeStorageId(videoId, "Video id");
    safePhotoId = assertSafeStorageId(talkingPhotoId, "Talking photo id");
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Invalid id",
    };
  }

  let apiKey: string;
  let bucket;
  let db;
  try {
    apiKey = await getUserHeygenApiKey(userId);
    ({ bucket, db } = getAdminServices());
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Server is not configured",
    };
  }

  try {
    const response = await axios.get("https://api.heygen.com/v1/video_status.get", {
      headers: { "x-api-key": apiKey },
      params: { video_id: safeVideoId },
      timeout: 20_000,
      maxRedirects: 0,
    });

    if (response.status !== 200 || response.data?.code !== 100) {
      return { status: "processing" };
    }

    const mapped = mapHeygenVideoStatus(response.data);
    if (mapped.status === "failed") {
      return {
        status: "failed",
        error: mapped.error || "An error occurred during video rendering.",
      };
    }
    if (mapped.status !== "completed") {
      return { status: mapped.status === "pending" ? "pending" : "processing" };
    }

    if (!mapped.video_url) {
      return { status: "failed", error: "Completed video missing download URL." };
    }

    const downloadUrl = assertSafeHeygenAssetUrl(mapped.video_url);
    const videoResponse = await axios.get<ArrayBuffer>(downloadUrl.toString(), {
      responseType: "arraybuffer",
      maxRedirects: 0,
      maxContentLength: MAX_VIDEO_DOWNLOAD_BYTES,
      maxBodyLength: MAX_VIDEO_DOWNLOAD_BYTES,
      timeout: 30_000,
    });

    const storagePath = `videos/${userId}/${safePhotoId}/${safeVideoId}.mp4`;
    const file = bucket.file(storagePath);
    await file.save(Buffer.from(videoResponse.data), {
      metadata: { contentType: "video/mp4" },
    });

    const [videoUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + SIGNED_URL_TTL_MS,
    });

    await db
      .collection("users")
      .doc(userId)
      .collection("talkingPhotos")
      .doc(safePhotoId)
      .collection("videos")
      .doc(safeVideoId)
      .set({
        storage_path: storagePath,
        thumbnail_url: safeThumbnail(mapped.thumbnail_url),
        created_at: new Date(),
      });

    return {
      status: "completed",
      video_url: videoUrl,
      thumbnail_url: mapped.thumbnail_url,
    };
  } catch (error) {
    console.error("Error fetching video status:", axiosErrorSummary(error));
    if (error instanceof Error && /video url|maxContentLength|maxBodyLength/i.test(error.message)) {
      return { status: "failed", error: error.message };
    }
    return { status: "processing" };
  }
}
