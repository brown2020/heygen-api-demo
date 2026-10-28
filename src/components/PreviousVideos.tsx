"use client";

import { useEffect, useState } from "react";
import { listTalkingPhotoVideos, type ListedVideo } from "@/actions/listVideos";

interface PreviousVideosProps {
  talkingPhotoId: string;
  refreshToken?: string | null;
}

export default function PreviousVideos({
  talkingPhotoId,
  refreshToken,
}: PreviousVideosProps) {
  const [videos, setVideos] = useState<ListedVideo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!talkingPhotoId) return;
    let cancelled = false;

    listTalkingPhotoVideos(talkingPhotoId)
      .then((listed) => {
        if (!cancelled) {
          setVideos(listed);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load previous videos.");
      });

    return () => {
      cancelled = true;
    };
  }, [talkingPhotoId, refreshToken]);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-4">Previous Videos</h3>
      {error && (
        <p className="text-red-500" role="alert">
          {error}
        </p>
      )}
      {videos.length === 0 ? (
        <p className="text-gray-500">No previous videos yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="border p-4 rounded-md shadow-sm">
              <video controls src={video.videoUrl} className="w-full rounded-sm"></video>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
