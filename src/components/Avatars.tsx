"use client";

import { useEffect, useState } from "react";
import { getHeygenAvatars } from "@/actions/getHeygenAvatars";
import useProfileStore from "@/zustand/useProfileStore";
import AvatarCard from "./AvatarCard";
import { TalkingPhoto } from "@/types/heygen";
import { ClipLoader } from "react-spinners";
import { db, isFirebaseConfigured } from "@/firebase/firebaseClient";
import { collection, onSnapshot, setDoc, doc } from "firebase/firestore";

export default function Avatars() {
  const [talkingPhotos, setTalkingPhotos] = useState<TalkingPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const profile = useProfileStore((state) => state.profile);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const talkingPhotosCollection = collection(db, "talkingPhotos");
    const unsubscribeTalkingPhotos = onSnapshot(
      talkingPhotosCollection,
      (snapshot) => {
        const talkingPhotosList = snapshot.docs.map(
          (d) => d.data() as TalkingPhoto
        );
        setTalkingPhotos(talkingPhotosList);
      }
    );

    return () => {
      unsubscribeTalkingPhotos();
    };
  }, []);

  const fetchTalkingPhotos = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!profile.heygen_api_key) {
        setError("API key is missing");
        return;
      }

      if (!isFirebaseConfigured) {
        setError("Firebase is not configured.");
        return;
      }

      const result = await getHeygenAvatars(profile.heygen_api_key);
      if (result && result.data) {
        const photos = result.data.talking_photos;
        const talkingPhotosCollection = collection(db, "talkingPhotos");

        await Promise.all(
          photos.map((photo) => {
            const docRef = doc(talkingPhotosCollection, photo.talking_photo_id);
            return setDoc(docRef, photo, { merge: true });
          })
        );
      } else {
        setError("Failed to fetch talking photos");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch talking photos");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTalkingPhotos = showFavorites
    ? talkingPhotos.filter((p) => p.favorite)
    : talkingPhotos;

  return (
    <div>
      <div className="sticky top-0 bg-white z-10 shadow-md">
        <div className="flex justify-between items-center p-4">
          <button
            type="button"
            onClick={() => setShowFavorites(!showFavorites)}
            className="bg-gray-200 text-gray-700 px-3 py-2 rounded-md"
          >
            {showFavorites ? "Show All" : "Show Favorites"}
          </button>
          <button
            type="button"
            onClick={fetchTalkingPhotos}
            className="bg-blue-700 text-white px-3 py-2 rounded-md hover:bg-blue-800 flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <ClipLoader size={20} color={"#ffffff"} />
            ) : (
              "Fetch Talking Photos"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-500 mt-4" role="alert">
          {error}
        </div>
      )}

      {filteredTalkingPhotos.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          {showFavorites
            ? "No favorite talking photos yet."
            : 'No talking photos available. Click "Fetch Talking Photos" to load them.'}
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredTalkingPhotos.map((photo) => (
            <li key={photo.talking_photo_id}>
              <AvatarCard
                id={photo.talking_photo_id}
                talkingPhoto={photo}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
