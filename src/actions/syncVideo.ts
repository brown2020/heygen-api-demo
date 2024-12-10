"use server";

import { DIDVideoStatus } from "@/types/heygen";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { adminDb } from "@/firebase/firebaseAdmin";
import { addVideoToStorage } from "./addVideoToStorage";


export async function syncVideo(video_id: string, did_video_id: string, status: DIDVideoStatus, result_url: string, errorMessage?: string, error?: Record<string, unknown>) {

    // Get video data from Firestore
    // D_ID video id should match with video data
    // Upload video to bucket

    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(video_id);
    const video = await videoRef.get();

    if (!video.exists || video.data() == undefined) { return { "error": "Video not found" }; }

    const videoData = video.data();

    // D_ID video id should match with video data
    if (videoData == undefined || videoData.did_id !== did_video_id) { return { "error": "Video ID mismatch" }; }

    // Download video from result_url and upload that video to firebase storage
    // Stream the video from the URL directly to Firebase Storage
    console.log("Downloading video from D-ID API result URL:", result_url);

    if (status !== 'done') {
        if (status === 'error') {
            await videoRef.update({ d_id_status: status, error: error, errorMessage: errorMessage });
        }
        return { "error": "Video processing not completed" };
    }

    const addVideoResponse = await addVideoToStorage(video_id, result_url, status);
    if (addVideoResponse.status) return { status: true, video_url: addVideoResponse.video_url };
    else return { "error": "Error adding video to storage" };
}