"use client";

import { getVideo } from "@/actions/getVideo";
import { db } from "@/firebase/firebaseClient";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { DIDVideoStatus, VideoDetail as VideoDetailType } from "@/types/heygen";
import { useAuthStore } from "@/zustand/useAuthStore";
import useProfileStore from "@/zustand/useProfileStore";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { X } from "lucide-react";
// import { notFound, useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function VideoDetail({
  id,
  closeVideoModel,
}: {
  id?: string;
  closeVideoModel?: () => void;
}) {
  // const params = useParams();
  const uid = useAuthStore((state) => state.uid);
  const profile = useProfileStore((state) => state.profile);
  // const [videoID, setVideoID] = useState<string | null>(id);
  const videoID = id;
  const [videoData, setVideoData] = useState<VideoDetailType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(true);
  const videoStatus: DIDVideoStatus | null = null;

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
      <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-70 z-[999]">
        <div className="bg-white rounded-3xl p-5 w-[90%] max-w-[900px] max-h-[90vh] h-auto overflow-auto border shadow-pop-up-shadow">
          {videoData ? (
            <div className="h-full flex flex-col gap-5">
              <div className="flex justify-between w-full items-center">
                <h2 className=" xs:text-2xl font-bold flex-grow truncate">
                  {videoData.title ?? "Untitled Video"}
                </h2>
                <div
                  className="cursor-pointer hover:bg-red-00 p-1 rounded"
                  onClick={() => closeVideoModel && closeVideoModel()}
                >
                  <X className="cursor-pointer" />
                </div>
              </div>
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
                <div className="relative w-full aspect-video">
                  <video
                    controls
                    src={videoData.video_url}
                    className="sm:absolute max-sm:rounded-2xl top-0 left-0 w-full h-full object-contain"
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
      </div>
  );
}
