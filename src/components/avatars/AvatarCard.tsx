import {  useEffect, Fragment, useMemo } from "react";
// import { useState, useEffect, Fragment } from "react";
// import { useRouter, usePathname } from "next/navigation";
// import { useRouter } from "next/navigation";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { Pencil } from "lucide-react";
import { Avatar, AvatarGroup, AvatarType, TalkingPhoto } from "@/types/heygen";
import { DOCUMENT_COLLECTION } from "@/libs/constants";

interface AvatarCardProps {
  id: string;
  type: AvatarType;
  avatar: AvatarGroup;
  open?: () => void
}

export default function AvatarCard({ id, avatar, open, type }: AvatarCardProps) {
  // const handleInputChange =
  //   (setter: React.Dispatch<React.SetStateAction<string>>) =>
  //     (e: React.ChangeEvent<HTMLInputElement>) => {
  //       setter(e.target.value);
  //       // setIsDirty(true);
  //     };

  // const saveDetails = async () => {
  //   const docRef = doc(db, DOCUMENT_COLLECTION, id);
  //   await setDoc(
  //     docRef,
  //     { talking_photo_name: talkingPhotoName, project, voiceId },
  //     { merge: true }
  //   );
  //   // setIsDirty(false);
  // };

  // const selectTalkingPhoto = async () => {
  //   if (!isSelected) {
  //     updateProfile({ selectedTalkingPhoto: id });
  //   } else {
  //     router.push("/generate"); // Navigate to /generate if already selected
  //   }
  // };

  const avatarPhoto = useMemo(() => {
    return avatar ? (avatar.preview_image_url ?? "") : "";
  }, [avatar]);

  return (
    <article className="group/avatar relative border-transparent border-2 hover:border-gray-300 hover:drop-shadow-2xl transition-all hover:-translate-y-2 ease-in-out duration-300 isolate flex flex-col justify-end overflow-hidden rounded-2xl px-8 pb-8 pt-40 lg:pt-40 xl:pt-44 2xl:pt-52 mx-auto w-full">
      {avatar?.preview_image_url ? (
        <Image
          src={avatarPhoto}
          alt="test"
          width={512}
          height={512}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <></>
      )}
      <div onClick={() => {if (open) open();}} className="cursor-pointer absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/0"></div>
      <h3 className="z-10 mt-3 text-xl font-bold text-white transition duration-300">
      {avatar.name}
      </h3>
      <button
        // onClick={toggleFavorite}
        className="transition duration-300 absolute top-3 left-3 p-2 rounded-full"
      >
        {false ? (
          <svg
            className={`${
              false
                ? "text-red-600"
                : "text-gray-200"
            }`}
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
          >
            <path
              className="shadow-xl"
              fill="currentColor"
              d="M12 20.325q-.35 0-.712-.125t-.638-.4l-1.725-1.575q-2.65-2.425-4.788-4.812T2 8.15Q2 5.8 3.575 4.225T7.5 2.65q1.325 0 2.5.562t2 1.538q.825-.975 2-1.537t2.5-.563q2.35 0 3.925 1.575T22 8.15q0 2.875-2.125 5.275T15.05 18.25l-1.7 1.55q-.275.275-.637.4t-.713.125"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 48 48"
          >
            <defs>
              <mask id="ipTLike0">
                <path
                  fill="#555"
                  stroke="#fff"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="4"
                  d="M15 8C8.925 8 4 12.925 4 19c0 11 13 21 20 23.326C31 40 44 30 44 19c0-6.075-4.925-11-11-11c-3.72 0-7.01 1.847-9 4.674A10.99 10.99 0 0 0 15 8"
                />
              </mask>
            </defs>
            <path fill="currentColor" d="M0 0h48v48H0z" mask="url(#ipTLike0)" />
          </svg>
        )}
      </button>
      {false ? (
        <button
          onClick={() => {
            if (open) open();
          }}
          className="transition duration-300 absolute top-3 right-3 bg-gray-300 text-gray-600 p-2 rounded-full border border-gray-400 shadow"
        >
          <Pencil size={20} />
        </button>
      ) : (
        <Fragment></Fragment>
      )}
    </article>
  );
}
