import {  useEffect, Fragment } from "react";
// import { useState, useEffect, Fragment } from "react";
// import { useRouter, usePathname } from "next/navigation";
// import { useRouter } from "next/navigation";
import Image from "next/image";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";
import { Pencil } from "lucide-react";
import { TalkingPhoto } from "@/types/heygen";
import { useAuthStore } from "@/zustand/useAuthStore";
import toast from "react-hot-toast";
import { AVATAR_TYPE_PERSONAL, DOCUMENT_COLLECTION } from "@/libs/constants";

interface AvatarCardProps {
  id: string;
  avatar?: TalkingPhoto;
  edit?: () => void

}

export default function AvatarCard({ id, avatar, edit }: AvatarCardProps) {
  // const [favorite, setFavorite] = useState(false);
  // const [talkingPhotoName, setTalkingPhotoName] = useState("");
  // const [project, setProject] = useState("");
  // const [voiceId, setVoiceId] = useState("");
  // const [previewImageUrl, setPreviewImageUrl] = useState("");
  // const [isDirty, setIsDirty] = useState(false);

  // const { selectedTalkingPhoto } = useProfileStore((state) => state.profile);
  // const updateProfile = useProfileStore((state) => state.updateProfile);
  // const isSelected = selectedTalkingPhoto === id;

  const uid = useAuthStore((state) => state.uid);
  // const router = useRouter();
  // const pathname = usePathname();
  // const isOnGeneratePage = pathname === "/generate";

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, DOCUMENT_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // const data = docSnap.data();
        // setFavorite(data.favorite || false);
        // setTalkingPhotoName(data.talking_photo_name || "");
        // setProject(data.project || "");
        // setVoiceId(data.voiceId || "");
        // setPreviewImageUrl(data.preview_image_url || "");
      }
    };

    fetchData();
  }, [id]);

  const toggleFavorite = async () => {
    // const newFavoriteStatus = !favorite;
    // setFavorite(newFavoriteStatus);
    // setIsDirty(true);

    // const docRef = doc(db, "talkingPhotos", id);
    // await setDoc(docRef, { favorite: newFavoriteStatus }, { merge: true });
    toast.promise(
      new Promise(async (resolve, reject) => {
        const favorite_of = avatar?.favorite_of || [];

        if (favorite_of.includes(uid)) {
          favorite_of.splice(favorite_of.indexOf(uid), 1);
        } else {
          favorite_of.push(uid);
        }

        const docRef = doc(db, DOCUMENT_COLLECTION, id);

        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          await setDoc(docRef, { favorite_of }, { merge: true });
          resolve(true);
        } else {
          reject(false);
        }
      }),
      {
        loading: "Processing...",
        success: () => {
          return `Success.`;
        },
        error: () => {
          return `Failed`;
        },
      }
    )
  };

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

  return (
    <article className="group/avatar relative border-transparent border-2 hover:border-gray-300 hover:drop-shadow-2xl transition-all hover:-translate-y-2 ease-in-out duration-300 isolate flex flex-col justify-end overflow-hidden rounded-2xl px-8 pb-8 pt-40 lg:pt-40 xl:pt-44 2xl:pt-52 mx-auto w-full">
      {avatar?.preview_image_url ? (
        <Image
          src={avatar?.preview_image_url}
          alt={avatar?.talking_photo_name}
          width={512}
          height={512}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <></>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/0"></div>
      <h3 className="z-10 mt-3 text-xl font-bold text-white transition duration-300">
      {avatar?.talking_photo_name}
      </h3>
      <button
        onClick={toggleFavorite}
        className="transition duration-300 absolute top-3 left-3 p-2 rounded-full"
      >
        {avatar?.favorite_of?.includes(uid) ? (
          <svg
            className={`${
              avatar?.favorite_of?.includes(uid)
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
      {avatar?.type == AVATAR_TYPE_PERSONAL ? (
        <button
          onClick={() => {
            if (edit) edit();
          }}
          className="transition duration-300 absolute top-3 right-3 bg-gray-300 text-gray-600 p-2 rounded-full border border-gray-400 shadow"
        >
          <Pencil size={20} />
        </button>
      ) : (
        <Fragment></Fragment>
      )}
    </article>
    // <div
    //   className={`relative border p-4 rounded-md shadow cursor-pointer ${
    //     isSelected ? "border-blue-500" : "border-gray-300"
    //   }`}
    // >
    //   <div className="flex justify-between items-center">
    //     <h3 className="font-bold mb-2">
    //       {talkingPhotoName || "Untitled Talking Photo"}
    //     </h3>
    //     <HeartIcon
    //       className="cursor-pointer"
    //       onClick={(e) => {
    //         e.stopPropagation();
    //         toggleFavorite();
    //       }}
    //       strokeWidth={favorite ? 0 : 1}
    //       fill={favorite ? "red" : "none"}
    //       color={favorite ? "red" : "currentColor"}
    //       size={24}
    //     />
    //   </div>
    //   <div>
    //     {previewImageUrl ? (
    //       <Image
    //         src={previewImageUrl}
    //         alt={talkingPhotoName}
    //         width={512}
    //         height={512}
    //         className="w-48 h-auto rounded transition-transform transform hover:scale-105"
    //       />
    //     ) : (
    //       <div className="w-48 h-48 bg-gray-200 flex items-center justify-center rounded">
    //         <span>No Image</span>
    //       </div>
    //     )}
    //   </div>
    //   <div className="mt-2">
    //     <label
    //       className="text-xs px-1 text-gray-600"
    //       htmlFor="talkingPhotoName"
    //     >
    //       Talking Photo Name
    //     </label>
    //     <input
    //       id="talkingPhotoName"
    //       type="text"
    //       value={talkingPhotoName}
    //       onChange={handleInputChange(setTalkingPhotoName)}
    //       placeholder="Talking Photo Name"
    //       className="border rounded p-1 w-full"
    //     />
    //     <label
    //       className="text-xs px-1 text-gray-600 mt-2 block"
    //       htmlFor="project"
    //     >
    //       Project
    //     </label>
    //     <input
    //       id="project"
    //       type="text"
    //       value={project}
    //       onChange={handleInputChange(setProject)}
    //       placeholder="Project"
    //       className="border rounded p-1 w-full"
    //     />
    //     <label
    //       className="text-xs px-1 text-gray-600 mt-2 block"
    //       htmlFor="voiceId"
    //     >
    //       Voice ID
    //     </label>
    //     <input
    //       id="voiceId"
    //       type="text"
    //       value={voiceId}
    //       onChange={handleInputChange(setVoiceId)}
    //       placeholder="Voice ID"
    //       className="border rounded p-1 w-full"
    //     />
    //     <div className="flex justify-between items-center mt-2">
    //       <div className="flex space-x-2">
    //         <button
    //           onClick={(e) => {
    //             e.stopPropagation();
    //             saveDetails();
    //           }}
    //           className={`bg-blue-500 text-white px-3 py-2 rounded-md ${
    //             isDirty ? "hover:opacity-50" : "opacity-50 cursor-not-allowed"
    //           }`}
    //           disabled={!isDirty}
    //         >
    //           Save
    //         </button>
    //         {!isOnGeneratePage && (
    //           <button
    //             onClick={(e) => {
    //               e.stopPropagation();
    //               selectTalkingPhoto();
    //             }}
    //             className={`bg-green-500 text-white px-3 py-2 rounded-md ${
    //               isSelected ? "hover:opacity-50" : ""
    //             }`}
    //           >
    //             {isSelected ? "Go to Generate" : "Select"}
    //           </button>
    //         )}
    //       </div>
    //     </div>
    //   </div>
    // </div>
  );
}
