import { useEffect, useMemo, useState } from "react";
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
  const [favoriteOverride, setFavoriteOverride] = useState<boolean | null>(null);
  const [draft, setDraft] = useState(() => ({
    talkingPhotoName: talkingPhoto?.talking_photo_name || "",
    project: talkingPhoto?.project || "",
    voiceId: talkingPhoto?.voiceId || "",
  }));
  const [fetchedTalkingPhoto, setFetchedTalkingPhoto] =
    useState<TalkingPhoto | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const { selectedTalkingPhoto } = useProfileStore((state) => state.profile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const isSelected = selectedTalkingPhoto === id;

  const router = useRouter();
  const pathname = usePathname();
  const isOnGeneratePage = pathname === "/generate";

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "talkingPhotos", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setFetchedTalkingPhoto(docSnap.data() as TalkingPhoto);
      }
    };

    if (!talkingPhoto) fetchData();
  }, [id, talkingPhoto]);

  const source = talkingPhoto ?? fetchedTalkingPhoto;
  const favorite = favoriteOverride ?? (source?.favorite ?? false);

  const displayed = useMemo(() => {
    if (isDirty) return draft;
    return {
      talkingPhotoName: source?.talking_photo_name || "",
      project: source?.project || "",
      voiceId: source?.voiceId || "",
    };
  }, [draft, isDirty, source?.project, source?.talking_photo_name, source?.voiceId]);

  const previewImageUrl = source?.preview_image_url || "";

  const toggleFavorite = async () => {
    const newFavoriteStatus = !favorite;
    setFavoriteOverride(newFavoriteStatus);

    const docRef = doc(db, "talkingPhotos", id);
    await setDoc(docRef, { favorite: newFavoriteStatus }, { merge: true });
  };

  const updateDraftField =
    (field: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isDirty) {
        setDraft({
          talkingPhotoName: source?.talking_photo_name || "",
          project: source?.project || "",
          voiceId: source?.voiceId || "",
        });
      }
      setIsDirty(true);
      setDraft((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const saveDetails = async () => {
    const docRef = doc(db, "talkingPhotos", id);
    await setDoc(
      docRef,
      {
        talking_photo_name: displayed.talkingPhotoName,
        project: displayed.project,
        voiceId: displayed.voiceId,
      },
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
          {displayed.talkingPhotoName || "Untitled Talking Photo"}
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
            alt={displayed.talkingPhotoName}
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
          value={displayed.talkingPhotoName}
          onChange={updateDraftField("talkingPhotoName")}
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
          value={displayed.project}
          onChange={updateDraftField("project")}
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
          value={displayed.voiceId}
          onChange={updateDraftField("voiceId")}
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
