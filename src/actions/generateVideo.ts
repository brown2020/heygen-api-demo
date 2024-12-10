"use server";

import { Emotion, Movement } from "@/types/heygen";
import { auth } from "@clerk/nextjs/server";
import { generateDIDVideo } from "./generateDIDVideo";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { admin, adminDb } from "@/firebase/firebaseAdmin";
import { getWebhookUrl, randomString, videoImageProxyUrl } from "@/libs/utils";
import { getFileUrl } from "./getFileUrl";
import { addErrorReport } from "./addErrorReport";

export async function generateVideo(
  video_id: string | null,
  apiKey: string | null,
  baseUrl: string,
  thumbnail_url: string,
  inputText?: string,
  voiceId?: string,
  audioUrl?: string,
  elevenlabsApiKey?: string,
  emotion: Emotion = "neutral",
  movement: Movement = "neutral"
) {
  await auth.protect();
  // const { userId } = auth();

  // TODO: If video id provided
  // TODO: check exist
  // TODO: d_id_status should be draft or blank
  // TODO: owner of video should be current user

  const id = video_id ? video_id : `new-video-${Date.now()}`;

  // Generate video thubnail
  const filename = `thumbnail-${randomString(10)}.png`;
  const filePath = `video-image/${id}/${filename}`;
  console.log("filePath", filePath);

  // Add that thumbnail to firebase storage
  const bucket = admin.storage().bucket();
  const file = bucket.file(filePath);
  const matches = thumbnail_url.match(/^data:(.+);base64,(.+)$/);
  try {
    if (!matches) {
      throw new Error("Invalid data URL format");
    }

    const mimeType = matches[1]; // e.g., 'image/png'
    const base64Data = matches[2];

    // Create a temporary file
    const buffer = Buffer.from(base64Data, "base64");

    // Save the file directly to Firebase Storage
    await file.save(buffer, {
      metadata: {
        contentType: mimeType, // Set the MIME type of the file
      },
    });

    // Create public url for that thumbnail
    const thumbnailUrl = await getFileUrl(filePath);

    // add that thumbnail id to video object
    const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);
    await videoRef.set(
      {
        thumbnail_url: thumbnailUrl,
      },
      { merge: true }
    );

    // Create proxy link
    const secret_token = randomString(32);
    const imageUrl = videoImageProxyUrl(baseUrl, `${id}.png`);
    const webhookUrl = getWebhookUrl(baseUrl, id, secret_token);

    const response = await generateDIDVideo(
      apiKey,
      imageUrl,
      webhookUrl,
      inputText,
      voiceId,
      audioUrl,
      elevenlabsApiKey,
      emotion,
      movement
    );

    if (response) {
      if ("error" in response && response.error) {
        return {
          status: false,
          message: response.error || "Error generating video",
          id: id,
        };
      } else if ("id" in response) {
        const videoRef = adminDb.collection(VIDEO_COLLECTION).doc(id);

        await videoRef.set(
          {
            did_id: response.id,
            d_id_status: response.status,
            secret_token,
          },
          { merge: true }
        );
        return {
          status: true,
          id: id,
        };
      }
      return { status: false, message: "Error generating video", id };
    }
  } catch (error) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    let errorDetails: Record<string, any> = {};

    // Handle known types of error
    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack || null,
      };
    } else {
      // For unknown errors
      errorDetails = {
        message: "Unknown error occurred",
        raw: JSON.stringify(error), // Serialize the raw error
      };
    }

    await addErrorReport("generateDIDVideo", errorDetails);
  }

  return { status: false, message: "Error generating video", id };
}
