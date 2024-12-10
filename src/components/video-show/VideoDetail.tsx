"use client";
import { getVideo } from "@/actions/getVideo";
import { db } from "@/firebase/firebaseClient";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { DIDVideoStatus, VideoDetail as VideoDetailType } from "@/types/heygen";
import { useAuthStore } from "@/zustand/useAuthStore";
import useProfileStore from "@/zustand/useProfileStore";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { notFound, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function VideoDetail() {
  const params = useParams();
  const uid = useAuthStore((state) => state.uid);
  const profile = useProfileStore((state) => state.profile);
  const [videoID, setVideoID] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<VideoDetailType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(true);
  const videoStatus: DIDVideoStatus | null = null;

  useEffect(() => {
    if (params?.id) {
      setVideoID(params.id.toString());
    } else {
      setVideoID(null); // Handle cases where params.id is undefined
    }
  }, [params]);

  const loadVideo = useCallback(
    async (video: VideoDetailType) => {
      setVideoData(video);
      if (
        video.d_id_status === "done" &&
        videoStatus !== null &&
        videoStatus !== video.d_id_status
      ) {
        toast.success("Video generated successfully", { duration: 7000 });
      }

      if (
        !video.video_url &&
        profile.did_api_key &&
        video.d_id_status !== "error"
      ) {
        setGenerating(true);
        const response = await getVideo(profile.did_api_key, video.id);
        if (response && "error" in response && response.error) {
          setGenerating(false);
          toast.error(response.error, { duration: 7000 });
        }
      } else {
        setGenerating(false);
      }
    },
    [profile.did_api_key, videoStatus]
  );

  useEffect(() => {
    if (videoID === null || !uid) return;

    const docRef = doc(collection(db, VIDEO_COLLECTION), videoID);
    setLoading(true);

    const unsubscribe = onSnapshot(docRef, {
      next: (snapshot) => {
        setLoading(false);

        if (!snapshot.exists()) {
          notFound(); // Handle not found
        } else {
          loadVideo(snapshot.data() as VideoDetailType); // Load video details
        }
      },
      error: (error) => {
        console.log("Error", error);
        setLoading(false);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [videoID, uid, loadVideo]);

  return (
    <div className="p-4 bg-white h-screen overflow-hidden">
      {videoData ? (
        <div className="h-full">
          <h2 className="text-2xl font-bold">
            {videoData.title ?? "Untitled Video"}
          </h2>
          {generating ? (
            <div className="flex items-center justify-center h-full">
              <h2 className="text-2xl font-bold animate-pulse">
                Generating video...
              </h2>
            </div>
          ) : null}
          {videoData.d_id_status === "error" ? (
            <div className="flex items-center justify-center h-full">
              <h2 className="text-2xl font-bold">{videoData.errorMessage}</h2>
            </div>
          ) : null}
          {videoData.d_id_status === "done" && videoData.video_url ? (
            <div className="flex-grow h-full flex items-center justify-center">
              <video
                controls
                src={videoData.video_url}
                className="h-4/5"
              ></video>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="h-full">
          {loading ? (
            <h2 className="text-2xl font-bold animate-pulse">
              {"Fetching video..."}
            </h2>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-lg font-semibold text-gray-600">
                Video is not available
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
