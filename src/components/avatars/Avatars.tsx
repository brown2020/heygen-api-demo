"use client";

import { Fragment, useState } from "react";
import AvatarCard from "./AvatarCard";
import { AvatarGroup } from "@/types/heygen";
// import { ClipLoader } from "react-spinners";
// import { collection, onSnapshot, setDoc, doc, query, where } from "firebase/firestore";
import { MoveLeft, MoveRight, Plus } from "lucide-react";
import toast from "react-hot-toast";
import AvatarForm from "./AvatarForm";
import { useAvatars } from "@/hooks/useAvatars";
import { Modal } from "@nextui-org/modal";
import CreateAvatarCard from "./CreateAvatarCard";

export default function Avatars() {
  const [showAvatarCardModel, setShowAvatarCardModel] = useState(false);
  const { publicAvatarGroups, personalAvatarGroups, isFetchingAvatarGroups, changeSelectedGroup, selectedAvatarGroup, selectedAvatarLooks, isFetchingAvatarLooks, fetchAvatarGroupsFromHeygen, fetchNextPage, currentPageNumber, fetchPreviousPage, totalPages } = useAvatars();
  const [showCreateAvatarModal, setShowCreateAvatarModal] = useState(false);

  const showNotification = (message: string) => {
    toast.success(message, {
      style: {
        border: '1px solid #4CAF50',
        padding: '16px',
        color: '#4CAF50',
        backgroundColor: '#f0fff4',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
      iconTheme: {
        primary: '#4CAF50',
        secondary: '#f0fff4',
      },
      duration: 5000,
    });
  };

  const openForm = (avatar: AvatarGroup | null) => {
    changeSelectedGroup(avatar);
    setShowAvatarCardModel(true);
  }

  const createNewTalkingPhoto = async () => {
  };

  const handleClose = (val: { status: boolean }) => {
    if (val.status) {
      if (selectedAvatarGroup == null) {
        showNotification('Avatar Created Successfully');
      } else {
        showNotification('Avatar Updated Successfully');
      }
    }
    changeSelectedGroup(null)
    setShowAvatarCardModel(false);
  };
  return (
    <div className="relative p-2">
      <div className="sticky xs:h-0 max-xs:w-full top-0 bg-transparent z-10 right-0 float-end">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 max-xs:justify-between w-full">
            <button
              onClick={() => { fetchAvatarGroupsFromHeygen() }}
              className="bg-gray-200 text-gray-700 max-xs:text-sm px-3 py-2 rounded-md"
            >
              Fetch Avatars
            </button>
            {/* <button
              onClick={() => setShowFavorites(!showFavorites)}
              className="bg-gray-200 text-gray-700 max-xs:text-sm px-3 py-2 rounded-md"
            >
              {showFavorites ? "Show All" : "Show Favorites"}
            </button> */}
            {/* <button
              onClick={createNewTalkingPhoto}
              className="bg-green-500 text-white px-3 py-2 rounded-md hover:opacity-50"
            >
              Create New Talking Photo
            </button> */}
          </div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-4 w-full">
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-600">My Avatars</h3>
          <ul className="grid min-[450px]:grid-cols-2 grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <article onClick={() => { createNewTalkingPhoto(); setShowCreateAvatarModal(!showCreateAvatarModal) }} className="group/avatar cursor-pointer relative border-2 border-gray-300 hover:drop-shadow-2xl transition-all hover:-translate-y-2 ease-in-out duration-300 isolate flex flex-col justify-end overflow-hidden rounded-2xl px-8 pb-8 pt-40 lg:pt-40 xl:pt-44 2xl:pt-52 mx-auto w-full">
              <div className="absolute w-full h-full right-0 top-0 px-4 flex justify-center items-center">
                <div>
                  <div className="border mx-auto w-fit rounded-full cursor-pointer p-2 bg-gray-300">
                    <Plus size={24} className="text-gray-600" />
                  </div>
                  <p className="w-full mt-2 font-semibold text-center text-gray-600">Create Avatar</p>
                </div>
              </div>
            </article>
            {personalAvatarGroups.map((avatar, index) => (
              <AvatarCard open={() => { openForm(avatar) }} avatar={avatar} type="talking_photo" key={index} id={avatar.id} />
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-600">Demo Avatars</h3>
          {isFetchingAvatarGroups && <p>Loading...</p>}
          <ul className="grid min-[450px]:grid-cols-2 grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {publicAvatarGroups.map((avatar, index) => (
              <AvatarCard open={() => { openForm(avatar) }} avatar={avatar} type="talking_photo" key={index} id={avatar.id} />
            ))}
          </ul>
        </div>
        <Modal isOpen={showAvatarCardModel} size="5xl" onClose={() => { handleClose({ status: false }) }} scrollBehavior="inside">
          {selectedAvatarGroup !== null ? <AvatarForm submit={handleClose} avatarDetail={selectedAvatarGroup} isFetchingAvatarLooks={isFetchingAvatarLooks} avatarLooks={selectedAvatarLooks} /> : <Fragment />}
        </Modal>
        {
          publicAvatarGroups.length > 0 &&
          <div className="flex items-center gap-8 justify-center mt-5">
            <button onClick={fetchPreviousPage} disabled={currentPageNumber === 1} className="rounded-md border border-slate-300 p-2.5 text-center text-sm transition-all shadow-sm hover:shadow-lg text-slate-600 hover:text-white hover:bg-slate-800 hover:border-slate-800 focus:text-white focus:bg-slate-800 focus:border-slate-800 active:border-slate-800 active:text-white active:bg-slate-800 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none" type="button">
              <MoveLeft className="w-4 h-4" />
            </button>

            <p className="text-slate-600">
              Page <strong className="text-slate-800">{currentPageNumber}</strong> of&nbsp;<strong className="text-slate-800">{totalPages}</strong>
            </p>

            <button onClick={fetchNextPage} disabled={totalPages <= currentPageNumber} className="rounded-md border border-slate-300 p-2.5 text-center text-sm transition-all shadow-sm hover:shadow-lg text-slate-600 hover:text-white hover:bg-slate-800 hover:border-slate-800 focus:text-white focus:bg-slate-800 focus:border-slate-800 active:border-slate-800 active:text-white active:bg-slate-800 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none" type="button">
              <MoveRight className="w-4 h-4" />
            </button>
          </div>
        }

        <CreateAvatarCard create={showCreateAvatarModal} handleClose={() => {
          console.log("Close ift  asd asdisUploading", showCreateAvatarModal);
          setShowCreateAvatarModal(!showCreateAvatarModal)
        }} />
      </div>
    </div>
  )
}
