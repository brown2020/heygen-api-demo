"use server";

import axios from "axios";
import { adminBucket, adminDb } from "@/firebase/firebaseAdmin";
import { auth } from "@clerk/nextjs/server";

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
  auth.protect();
  try {
    let attempts = 0;
    while (attempts < 600) {
      attempts++;
      console.log(`Checking video status... Attempt: ${attempts}`);
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
        const data = response.data.data;
        const status = data.status;
        console.log(`Current video status: ${status}`);

        if (status === "completed") {
          console.log("Video completed, downloading from URL:", data.video_url);

          // Download the video from the provided video URL
          const videoResponse = await axios.get(data.video_url, {
            responseType: "arraybuffer", // Get the video as a buffer
          });

          // Upload to Firebase Storage
          const file = adminBucket.file(
            `videos/${talkingPhotoId}/${videoId}.mp4`
          );
          await file.save(videoResponse.data, {
            metadata: {
              contentType: "video/mp4",
            },
          });
          console.log("Video uploaded to Firebase Storage.");

          // Generate a signed URL with a very long expiration (100 years)
          const [videoUrl] = await file.getSignedUrl({
            action: "read",
            expires: "01-01-2124", // Set the expiration date 100 years in the future
          });
          console.log("Generated signed URL with long expiration:", videoUrl);

          // Save the signed URL to Firestore
          const docRef = adminDb
            .collection("talkingPhotos")
            .doc(talkingPhotoId)
            .collection("videos")
            .doc(videoId);

          await docRef.set({
            video_url: videoUrl,
            thumbnail_url: data.thumbnail_url || null,
            created_at: new Date(),
          });
          console.log("Video URL saved to Firestore.");

          return {
            status: status,
            video_url: videoUrl,
            thumbnail_url: data.thumbnail_url,
          };
        } else if (status === "failed") {
          console.error("Video rendering failed:", data.error);
          return {
            status: status,
            error: data.error || "An error occurred during video rendering.",
          };
        }

        // Wait for the poll interval before the next check
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } else {
        console.error("Error fetching video status:", response.data.message);
        return null;
      }
    }
    console.error("Video retrieval timed out after max attempts.");
    return null;
  } catch (error) {
    console.error("Error fetching video status:", error);
    return null;
  }
}
