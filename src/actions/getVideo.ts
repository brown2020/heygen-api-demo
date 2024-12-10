"use server";
import { adminDb } from "@/firebase/firebaseAdmin";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { auth } from "@clerk/nextjs/server";
import { getDIDVideo } from "./getDIDVideo";
import { syncVideo } from "./syncVideo";

export async function getVideo(d_id_api_key: string, video_id: string) {
  const { userId } = await auth.protect();

  // Get video data from firestore
  const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(video_id);
  const video = await videoRef.get();
  const videoData = video.data();

  // Check if video exists
  if (!videoData || !video.exists || video.data() == undefined) {
    return { error: "Video not found" };
  }

  // If video url already generated then send response
  if (videoData.video_url) {
    return { status: true, video_url: videoData.video_url };
  }

  // Check Video ownership
  if (videoData.owner !== userId) {
    return { error: "Unauthorized" };
  }

  // Video should have D-ID video id
  if (!videoData.did_id) {
    return { error: "D-ID video ID not found" };
  }

  // If video url not generated then call getDIDVideo
  const response = await getDIDVideo(d_id_api_key, videoData.did_id);

  if (response == null) {
    return { error: "Error getting video" };
  }

  if ("error" in response) {
    // Update video detail if video does not have added error
    return { error: response.error };
  }

  // Then sync video detail
  if ("id" in response) {
    if (response.status == "done") {
      const syncResponse = await syncVideo(
        video_id,
        videoData.did_id,
        response.status,
        response.result_url
      );
      // Then send response
      return { status: true, video_url: syncResponse.video_url };
    } else if (response.status == "error") {
      await syncVideo(
        video_id,
        videoData.did_id,
        response.status,
        response.result_url,
        response.errorMessage,
        response.errorDetails
      );
      // Then send response
      return { error: response.errorMessage };
    }
  } else {
    return { error: "Error getting video" };
  }

  // return {status: true, video_url: videoData.video_url};
}
