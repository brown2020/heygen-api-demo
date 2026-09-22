"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/firebase/firebaseClient";
import { HeartIcon } from "lucide-react";
import useProfileStore from "@/zustand/useProfileStore";
import { TalkingPhoto } from "@/types/heygen";
import AvatarCardFields from "@/components/AvatarCardFields";

interface AvatarCardProps {
  id: string;
  talkingPhoto?: TalkingPhoto;
}

type Draft = {
  talkingPhotoName: string;
  project: string;
  voiceId: string;
};

function draftFromSource(source: TalkingPhoto | null | undefined): Draft {
  return {
    talkingPhotoName: source?.talking_photo_name || "",
    project: source?.project || "",
    voiceId: source?.voiceId || "",
  };
}

export default function AvatarCard({ id, talkingPhoto }: AvatarCardProps) {
  const [favoriteOverride, setFavoriteOverride] = useState<boolean | null>(
    null
  );
  const [draft, setDraft] = useState(() => draftFromSource(talkingPhoto));
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
    if (talkingPhoto || !isFirebaseConfigured) return;
    let cancelled = false;

    getDoc(doc(db, "talkingPhotos", id))
      .then((docSnap) => {
        if (cancelled || !docSnap.exists()) return;
        queueMicrotask(() => {
          if (!cancelled) {
            setFetchedTalkingPhoto(docSnap.data() as TalkingPhoto);
          }
        });
      })
      .catch((err) => {
        console.error("AvatarCard fetch failed:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [id, talkingPhoto]);

  const source = talkingPhoto ?? fetchedTalkingPhoto;
  const favorite = favoriteOverride ?? source?.favorite ?? false;
  const displayed = useMemo(
    () => (isDirty ? draft : draftFromSource(source)),
    [draft, isDirty, source]
  );
  const previewImageUrl = source?.preview_image_url || "";

  const toggleFavorite = async () => {
    if (!isFirebaseConfigured) return;
    const next = !favorite;
    setFavoriteOverride(next);
    await setDoc(doc(db, "talkingPhotos", id), { favorite: next }, { merge: true });
  };

  const updateDraftField =
    (field: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isDirty) setDraft(draftFromSource(source));
      setIsDirty(true);
      setDraft((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const saveDetails = async () => {
    if (!isFirebaseConfigured) return;
    await setDoc(
      doc(db, "talkingPhotos", id),
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
      return;
    }
    router.push("/generate");
  };

  return (
    <div
      className={`relative border p-4 rounded-md shadow ${
        isSelected ? "border-blue-500" : "border-gray-300"
      }`}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-bold mb-2">
          {displayed.talkingPhotoName || "Untitled Talking Photo"}
        </h3>
        <button
          type="button"
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
        >
          <HeartIcon
            strokeWidth={favorite ? 0 : 1}
            fill={favorite ? "red" : "none"}
            color={favorite ? "red" : "currentColor"}
            size={24}
            aria-hidden
          />
        </button>
      </div>
      <div>
        {previewImageUrl ? (
          <Image
            src={previewImageUrl}
            alt={displayed.talkingPhotoName || "Talking photo preview"}
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
      <AvatarCardFields
        id={id}
        displayed={displayed}
        isDirty={isDirty}
        isOnGeneratePage={isOnGeneratePage}
        isSelected={isSelected}
        onFieldChange={updateDraftField}
        onSave={saveDetails}
        onSelect={selectTalkingPhoto}
      />
    </div>
  );
}
