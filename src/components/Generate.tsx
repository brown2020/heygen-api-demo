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

type Props = {};

export default function Generate({}: Props) {
  const router = useRouter();
  const profile = useProfileStore((state) => state.profile);
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      const selectedId = profile.selectedTalkingPhoto;
      if (!selectedId) {
        console.log("No selectedTalkingPhoto found. Redirecting to /avatars.");
        router.push("/avatars");
        return;
      }

      try {
        console.log("Fetching details for selectedTalkingPhoto:", selectedId);
        const docRef = doc(db, "talkingPhotos", selectedId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Document found:", data);
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
  }, [profile, router]);

  const handleGenerate = async () => {
    if (!profile.selectedTalkingPhoto) {
      setError("No selected talking photo.");
      return;
    }

    const voiceId = itemDetails?.voiceId;
    if (!voiceId) {
      setError("Voice ID is missing for the selected talking photo.");
      return;
    }

    console.log("Starting video generation...");
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateTalkingPhotoVideo(
        profile.heygen_api_key || "",
        profile.selectedTalkingPhoto || "noTalkingPhotoId",
        voiceId,
        script,
        ""
      );

      if (result && result.video_id) {
        console.log("Video generation initiated. Video ID:", result.video_id);
        const statusResponse = await retrieveVideo(
          profile.heygen_api_key || "",
          result.video_id,
          profile.selectedTalkingPhoto || "noTalkingPhotoId"
        );

        if (statusResponse && statusResponse.status === "completed") {
          console.log(
            "Video generation completed. Video URL:",
            statusResponse.video_url
          );
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
      console.log("Video generation process completed.");
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
          <AvatarCard id={profile.selectedTalkingPhoto} />
        </div>

        <div className="flex flex-col gap-4 w-full">
          <TextareaAutosize
            minRows={3}
            placeholder="Script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="border rounded p-2 resize-none"
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
          <video controls src={videoUrl} className="w-full rounded"></video>
        </div>
      )}

      {/* Render the PreviousVideos component */}
      <PreviousVideos talkingPhotoId={profile.selectedTalkingPhoto} />
    </div>
  );
}
