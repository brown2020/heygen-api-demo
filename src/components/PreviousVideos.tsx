"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";

interface PreviousVideosProps {
  talkingPhotoId: string;
}

export default function PreviousVideos({
  talkingPhotoId,
}: PreviousVideosProps) {
  const [videos, setVideos] = useState<any[]>([]);

  useEffect(() => {
    if (!talkingPhotoId) return;

    // Correctly reference the subcollection under talkingPhotos
    const videosCollectionRef = collection(
      db,
      `talkingPhotos/${talkingPhotoId}/videos`
    );
    const videosQuery = query(videosCollectionRef);

    const unsubscribe = onSnapshot(videosQuery, (snapshot) => {
      const videosList = snapshot.docs.map((doc) => doc.data());
      setVideos(videosList);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [talkingPhotoId]);

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-4">Previous Videos</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video, index) => (
          <div key={index} className="border p-4 rounded-md shadow">
            <video
              controls
              src={video.video_url}
              className="w-full rounded"
            ></video>
          </div>
        ))}
      </div>
    </div>
  );
}
