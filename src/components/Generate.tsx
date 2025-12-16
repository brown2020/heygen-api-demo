"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import useProfileStore from "@/zustand/useProfileStore";
import { generateTalkingPhotoVideo } from "@/actions/generateTalkingPhotoVideo";
import { retrieveVideo } from "@/actions/retrieveVideo";
import AvatarCard from "@/components/AvatarCard";
import { PulseLoader } from "react-spinners";
import PreviousVideos from "@/components/PreviousVideos";
import TextareaAutosize from "react-textarea-autosize";

import { TalkingPhoto } from "@/types/heygen";

export default function Generate() {
  const router = useRouter();
  const profile = useProfileStore((state) => state.profile);
  const [itemDetails, setItemDetails] = useState<TalkingPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      const selectedId = profile.selectedTalkingPhoto;
      if (!selectedId) {
        router.push("/avatars");
        return;
      }

      try {
        const docRef = doc(db, "talkingPhotos", selectedId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as TalkingPhoto; // Cast data to the correct type
          setItemDetails(data);
        } else {
          console.error("No such document found in Firestore!");
          router.push("/avatars");
        }
      } catch (error) {
        console.error("Error fetching document from Firestore:", error);
        router.push("/avatars");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [profile.selectedTalkingPhoto, router]);

  const handleGenerate = async () => {
    if (!profile.selectedTalkingPhoto) {
      setError("No selected talking photo.");
      return;
    }

    // Use a default voice ID if none is set.
    // Using a common HeyGen voice ID (e.g., fluent English speaker) as fallback
    // Also handling case where voice ID matches known invalid one "8awO799gQXhcAUkg9d9l"
    let voiceId = itemDetails?.voiceId;
    if (!voiceId || voiceId === "8awO799gQXhcAUkg9d9l") {
      voiceId = "1bd001e7e50f421d891986aad5158bc8";
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateTalkingPhotoVideo(
        profile.heygen_api_key || "",
        profile.selectedTalkingPhoto || "noTalkingPhotoId",
        voiceId,
        script || undefined, // Use the script if provided
        audioUrl || undefined // Use the audioUrl if provided
      );

      if (result && result.video_id) {
        const statusResponse = await retrieveVideo(
          profile.heygen_api_key || "",
          result.video_id,
          profile.selectedTalkingPhoto || "noTalkingPhotoId"
        );

        if (statusResponse && statusResponse.status === "completed") {
          setVideoUrl(statusResponse.video_url!);
        } else if (statusResponse && statusResponse.status === "failed") {
          console.error("Video generation failed:", statusResponse.error);
          setError(statusResponse.error || "Video generation failed.");
        }
      } else {
        console.error("Failed to generate video:", result?.error);
        setError(result?.error || "Failed to generate video.");
      }
    } catch (error) {
      console.error("Error during video generation:", error);
      setError("An error occurred while generating the video.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading || !itemDetails) {
    return <div>Loading...</div>;
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
          <TextareaAutosize
            minRows={3}
            placeholder="Script (optional)"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="border rounded-sm p-2 resize-none"
          />
          <input
            type="text"
            placeholder="Audio URL (optional)"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            className="border rounded-sm p-2"
          />
          <button
            onClick={handleGenerate}
            className="bg-blue-500 text-white px-4 py-2 h-10 rounded-md flex items-center justify-center"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <PulseLoader size={10} color={"#ffffff"} />
            ) : (
              "Generate Video"
            )}
          </button>
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </div>
      </div>

      {videoUrl && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4">Generated Video</h3>
          <video controls src={videoUrl} className="w-full rounded-sm"></video>
        </div>
      )}

      {/* Render the PreviousVideos component */}
      <PreviousVideos talkingPhotoId={profile.selectedTalkingPhoto} />
    </div>
  );
}
