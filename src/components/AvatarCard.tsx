import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { HeartIcon } from "lucide-react";
import useProfileStore from "@/zustand/useProfileStore";
import { TalkingPhoto } from "@/types/heygen";

interface AvatarCardProps {
  id: string;
  talkingPhoto?: TalkingPhoto;
}

export default function AvatarCard({ id, talkingPhoto }: AvatarCardProps) {
  const [favorite, setFavorite] = useState(talkingPhoto?.favorite || false);
  const [talkingPhotoName, setTalkingPhotoName] = useState(
    talkingPhoto?.talking_photo_name || ""
  );
  const [project, setProject] = useState(talkingPhoto?.project || "");
  const [voiceId, setVoiceId] = useState(talkingPhoto?.voiceId || "");
  const [previewImageUrl, setPreviewImageUrl] = useState(
    talkingPhoto?.preview_image_url || ""
  );
  const [isDirty, setIsDirty] = useState(false);

  const { selectedTalkingPhoto } = useProfileStore((state) => state.profile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const isSelected = selectedTalkingPhoto === id;

  const router = useRouter();
  const pathname = usePathname();
  const isOnGeneratePage = pathname === "/generate";

  useEffect(() => {
    if (talkingPhoto) {
      setFavorite(talkingPhoto.favorite || false);
      setTalkingPhotoName(talkingPhoto.talking_photo_name || "");
      setProject(talkingPhoto.project || "");
      setVoiceId(talkingPhoto.voiceId || "");
      setPreviewImageUrl(talkingPhoto.preview_image_url || "");
      return;
    }

    const fetchData = async () => {
      const docRef = doc(db, "talkingPhotos", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFavorite(data.favorite || false);
        setTalkingPhotoName(data.talking_photo_name || "");
        setProject(data.project || "");
        setVoiceId(data.voiceId || "");
        setPreviewImageUrl(data.preview_image_url || "");
      }
    };

    fetchData();
  }, [id, talkingPhoto]);

  const toggleFavorite = async () => {
    const newFavoriteStatus = !favorite;
    setFavorite(newFavoriteStatus);
    setIsDirty(true);

    const docRef = doc(db, "talkingPhotos", id);
    await setDoc(docRef, { favorite: newFavoriteStatus }, { merge: true });
  };

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setIsDirty(true);
    };

  const saveDetails = async () => {
    const docRef = doc(db, "talkingPhotos", id);
    await setDoc(
      docRef,
      { talking_photo_name: talkingPhotoName, project, voiceId },
      { merge: true }
    );
    setIsDirty(false);
  };

  const selectTalkingPhoto = async () => {
    if (!isSelected) {
      updateProfile({ selectedTalkingPhoto: id });
    } else {
      router.push("/generate"); // Navigate to /generate if already selected
    }
  };

  return (
    <div
      className={`relative border p-4 rounded-md shadow cursor-pointer ${
        isSelected ? "border-blue-500" : "border-gray-300"
      }`}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-bold mb-2">
          {talkingPhotoName || "Untitled Talking Photo"}
        </h3>
        <HeartIcon
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
          strokeWidth={favorite ? 0 : 1}
          fill={favorite ? "red" : "none"}
          color={favorite ? "red" : "currentColor"}
          size={24}
        />
      </div>
      <div>
        {previewImageUrl ? (
          <Image
            src={previewImageUrl}
            alt={talkingPhotoName}
            width={512}
            height={512}
            className="w-48 h-auto rounded-sm transition-transform transform hover:scale-105"
          />
        ) : (
          <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded-sm">
            <span>No Image</span>
          </div>
        )}
      </div>
      <div className="mt-2">
        <label
          className="text-xs px-1 text-gray-600"
          htmlFor="talkingPhotoName"
        >
          Talking Photo Name
        </label>
        <input
          id="talkingPhotoName"
          type="text"
          value={talkingPhotoName}
          onChange={handleInputChange(setTalkingPhotoName)}
          placeholder="Talking Photo Name"
          className="border rounded-sm p-1 w-full"
        />
        <label
          className="text-xs px-1 text-gray-600 mt-2 block"
          htmlFor="project"
        >
          Project
        </label>
        <input
          id="project"
          type="text"
          value={project}
          onChange={handleInputChange(setProject)}
          placeholder="Project"
          className="border rounded-sm p-1 w-full"
        />
        <label
          className="text-xs px-1 text-gray-600 mt-2 block"
          htmlFor="voiceId"
        >
          Voice ID
        </label>
        <input
          id="voiceId"
          type="text"
          value={voiceId}
          onChange={handleInputChange(setVoiceId)}
          placeholder="Voice ID"
          className="border rounded-sm p-1 w-full"
        />
        <div className="flex justify-between items-center mt-2">
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                saveDetails();
              }}
              className={`bg-blue-500 text-white px-3 py-2 rounded-md ${
                isDirty ? "hover:opacity-50" : "opacity-50 cursor-not-allowed"
              }`}
              disabled={!isDirty}
            >
              Save
            </button>
            {!isOnGeneratePage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectTalkingPhoto();
                }}
                className={`bg-green-500 text-white px-3 py-2 rounded-md ${
                  isSelected ? "hover:opacity-50" : ""
                }`}
              >
                {isSelected ? "Go to Generate" : "Select"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
