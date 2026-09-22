"use server";

import axios from "axios";
import { adminBucket, adminDb } from "@/firebase/firebaseAdmin";
import { auth } from "@clerk/nextjs/server";
import { after } from "next/server";
import { mapHeygenVideoStatus } from "@/libs/heygen-response";

interface RetrieveVideoResponse {
  status: "processing" | "completed" | "failed" | "pending";
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
}

export async function retrieveVideo(
  apiKey: string,
  videoId: string,
  talkingPhotoId: string,
  pollInterval: number = 1000
): Promise<RetrieveVideoResponse | null> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const isDebug = process.env.NODE_ENV !== "production";
  let attempts = 0;
  while (attempts < 600) {
    attempts++;
    if (isDebug) {
      const attempt = attempts;
      after(() => {
        console.log(`Checking video status... Attempt: ${attempt}`);
      });
    }

    try {
      const response = await axios.get(
        `https://api.heygen.com/v1/video_status.get`,
        {
          headers: {
            "x-api-key": apiKey,
          },
          params: {
            video_id: videoId,
          },
        }
      );

      if (response.status === 200 && response.data.code === 100) {
        const mapped = mapHeygenVideoStatus(response.data);
        if (isDebug) {
          after(() => {
            console.log(`Current video status: ${mapped.status}`);
          });
        }

        if (mapped.status === "completed") {
          const videoUrlRemote = mapped.video_url;
          if (!videoUrlRemote) {
            return {
              status: "failed",
              error: "Completed video missing download URL.",
            };
          }
          if (isDebug) {
            after(() => {
              console.log("Video completed, downloading from URL:", videoUrlRemote);
            });
          }

          const videoResponse = await axios.get(videoUrlRemote, {
            responseType: "arraybuffer",
          });

          const file = adminBucket.file(
            `videos/${talkingPhotoId}/${videoId}.mp4`
          );
          await file.save(videoResponse.data, {
            metadata: {
              contentType: "video/mp4",
            },
          });
          if (isDebug) {
            after(() => {
              console.log("Video uploaded to Firebase Storage.");
            });
          }

          const [videoUrl] = await file.getSignedUrl({
            action: "read",
            expires: "01-01-2124",
          });
          if (isDebug) {
            after(() => {
              console.log("Generated signed URL with long expiration:", videoUrl);
            });
          }

          const docRef = adminDb
            .collection("talkingPhotos")
            .doc(talkingPhotoId)
            .collection("videos")
            .doc(videoId);

          await docRef.set({
            video_url: videoUrl,
            thumbnail_url: mapped.thumbnail_url || null,
            created_at: new Date(),
          });
          if (isDebug) {
            after(() => {
              console.log("Video URL saved to Firestore.");
            });
          }

          return {
            status: "completed",
            video_url: videoUrl,
            thumbnail_url: mapped.thumbnail_url,
          };
        } else if (mapped.status === "failed") {
          console.error("Video rendering failed:", mapped.error);
          return {
            status: "failed",
            error: mapped.error || "An error occurred during video rendering.",
          };
        }
      } else {
        console.error("Error fetching video status:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching video status (will retry):", error);
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  console.error("Video retrieval timed out after max attempts.");
  return null;
}
