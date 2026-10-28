"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/firebase/firebaseClient";
import useProfileStore from "@/zustand/useProfileStore";
import { generateTalkingPhotoVideo } from "@/actions/generateTalkingPhotoVideo";
import { retrieveVideo } from "@/actions/retrieveVideo";
import { useAuthStore } from "@/zustand/useAuthStore";
import { isWithinPollDeadline, VIDEO_POLL_INTERVAL_MS } from "@/libs/video-poll";
import AvatarCard from "@/components/AvatarCard";
import { PulseLoader } from "react-spinners";
import PreviousVideos from "@/components/PreviousVideos";
import TextareaAutosize from "react-textarea-autosize";
import { resolveVoiceId } from "@/libs/heygen-response";

import { TalkingPhoto } from "@/types/heygen";

export default function Generate() {
  const profile = useProfileStore((state) => state.profile);
  const uid = useAuthStore((state) => state.uid);
  const [itemDetails, setItemDetails] = useState<TalkingPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [missingSelection, setMissingSelection] = useState(false);
  const [script, setScript] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const selectedId = profile.selectedTalkingPhoto;

    if (!selectedId) {
      queueMicrotask(() => {
        if (!cancelled) {
          setMissingSelection(true);
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    if (!isFirebaseConfigured) {
      queueMicrotask(() => {
        if (!cancelled) {
          setError("Firebase is not configured.");
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    if (!uid) {
      queueMicrotask(() => {
        if (!cancelled) {
          setError("Sign in before generating a video.");
          setLoading(false);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    getDoc(doc(db, "users", uid, "talkingPhotos", selectedId))
      .then((docSnap) => {
        if (cancelled) return;
        if (docSnap.exists()) {
          queueMicrotask(() => {
            if (!cancelled) {
              setItemDetails(docSnap.data() as TalkingPhoto);
              setMissingSelection(false);
              setLoading(false);
            }
          });
        } else {
          queueMicrotask(() => {
            if (!cancelled) {
              setMissingSelection(true);
              setLoading(false);
            }
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching document from Firestore:", err);
        if (!cancelled) {
          queueMicrotask(() => {
            if (!cancelled) {
              setMissingSelection(true);
              setLoading(false);
            }
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [profile.selectedTalkingPhoto, uid]);

  const handleGenerate = async () => {
    if (!profile.selectedTalkingPhoto) {
      setError("No selected talking photo.");
      return;
    }

    const voiceId = resolveVoiceId(itemDetails?.voiceId);

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateTalkingPhotoVideo(
        profile.selectedTalkingPhoto,
        voiceId,
        script || undefined,
        audioUrl || undefined
      );

      if (result && result.video_id) {
        const started = Date.now();
        let statusResponse = await retrieveVideo(
          result.video_id,
          profile.selectedTalkingPhoto
        );
        while (
          statusResponse &&
          statusResponse.status !== "completed" &&
          statusResponse.status !== "failed" &&
          isWithinPollDeadline(Date.now() - started)
        ) {
          await new Promise((resolve) => setTimeout(resolve, VIDEO_POLL_INTERVAL_MS));
          statusResponse = await retrieveVideo(
            result.video_id,
            profile.selectedTalkingPhoto
          );
        }

        if (statusResponse && statusResponse.status === "completed") {
          setVideoUrl(statusResponse.video_url ?? null);
        } else if (statusResponse && statusResponse.status === "failed") {
          setError(statusResponse.error || "Video generation failed.");
        } else {
          setError("Video is still processing. Open this page again in a few minutes.");
        }
      } else {
        setError(result?.error || "Failed to generate video.");
      }
    } catch {
      setError("An error occurred while generating the video.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <div role="status">Loading...</div>;
  }

  if (missingSelection || !itemDetails || !profile.selectedTalkingPhoto) {
    return (
      <div className="flex flex-col gap-4 max-w-lg">
        <h2 className="text-2xl font-bold">Generate</h2>
        <p className="text-gray-700">
          Select a talking photo on the Avatars page before generating a video.
        </p>
        <Link
          href="/avatars"
          className="bg-blue-700 text-white px-4 py-2 rounded-md w-fit hover:bg-blue-800"
        >
          Go to Avatars
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Generate</h2>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="mr-auto mb-4">
          <AvatarCard
            id={profile.selectedTalkingPhoto}
            talkingPhoto={itemDetails}
          />
        </div>

        <div className="flex flex-col gap-4 w-full">
          <label htmlFor="generate-script" className="text-sm font-medium">
            Script (optional)
          </label>
          <TextareaAutosize
            id="generate-script"
            minRows={3}
            placeholder="Example: Welcome to our product demo."
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="border rounded-sm p-2 resize-none"
          />
          <label htmlFor="generate-audio-url" className="text-sm font-medium">
            Audio URL (optional)
          </label>
          <input
            id="generate-audio-url"
            type="text"
            placeholder="https://example.com/audio.mp3"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            className="border rounded-sm p-2"
          />
          <button
            type="button"
            onClick={handleGenerate}
            className="bg-blue-700 text-white px-4 py-2 h-10 rounded-md flex items-center justify-center"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <PulseLoader size={10} color={"#ffffff"} />
            ) : (
              "Generate Video"
            )}
          </button>
          {error && (
            <div className="text-red-500 mt-2" role="alert">
              {error}
            </div>
          )}
        </div>
      </div>

      {videoUrl && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4">Generated Video</h3>
          <video controls src={videoUrl} className="w-full rounded-sm"></video>
        </div>
      )}

      <PreviousVideos
        talkingPhotoId={profile.selectedTalkingPhoto}
        refreshToken={videoUrl}
      />
    </div>
  );
}
