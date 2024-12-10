import { admin, adminDb } from "@/firebase/firebaseAdmin";
import { VIDEO_COLLECTION } from "@/libs/constants";
import axios from "axios";

export async function addVideoToStorage(video_id: string, result_url: string, status: string) {
    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(video_id);

    const response = await axios({
        url: result_url,
        method: 'GET',
        responseType: 'stream'
    });

    const bucket = admin.storage().bucket();
    const videoPath = `videos/${video_id}.mp4`;
    const file = bucket.file(videoPath);
    const stream = file.createWriteStream({
        metadata: {
            contentType: 'video/mp4'
        }
    });

    response.data.pipe(stream);

    await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
    });

    // Update video data in Firestore
    const [url] = await file.getSignedUrl({
        action: "read",
        expires: "03-17-2125",
    });
    await videoRef.update({
        d_id_status: status,
        d_id_result_url: result_url,
        video_path: videoPath,
        video_url: url,
    });

    return {status: true, video_url: url};
}