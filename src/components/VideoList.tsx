'use client'

import { useEffect, useState } from "react"
import { db } from "@/firebase/firebaseClient"
import { collection, deleteDoc, doc, DocumentData, onSnapshot, query, where } from 'firebase/firestore';
import PlayVideoIcon from '@/assets/images/play-video-1.png'
import Image from "next/image";
import { useAuthStore } from "@/zustand/useAuthStore";
import { AVATAR_TYPE_PERSONAL, VIDEO_COLLECTION } from "@/libs/constants";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Loader } from "./Loader";

export default function VideosPage() {

    const [fetching, setFetching] = useState<boolean>(true);
    const [videoList, setVideoList] = useState<DocumentData[]>([]);

    const uid = useAuthStore((state) => state.uid);
    const router = useRouter();

    const [isModalOpen, setModalOpen] = useState<boolean>(false);
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

    console.log("uid", uid);

    useEffect(() => {
        if(!uid) return;
        setFetching(true);
        const videoCollection = query(
            collection(db, VIDEO_COLLECTION),
            where('type', '==', AVATAR_TYPE_PERSONAL),
            where('owner', '==', uid),
        );

        const unsubscribeVideoCollection = onSnapshot(
            videoCollection,
            (snapshot) => {
                const videoList = snapshot.docs.map(
                    (doc) => doc.data()
                )
                setFetching(false);
                setVideoList(videoList)
                console.log("videoList", videoList);

            }
        )

        return () => {
            setFetching(false)
            unsubscribeVideoCollection();
        }

    }, [uid])

    function videoDeleteHandler(id: string) {
        deleteDoc(doc(db, VIDEO_COLLECTION, id));
        setModalOpen(false);
    }

    function handleDeleteClick(event: React.MouseEvent, id: string) {
        event.stopPropagation();
        setSelectedVideoId(id);
        setModalOpen(true);
    }

    return (
        <>
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={() => selectedVideoId && videoDeleteHandler(selectedVideoId)}
            />
            {
                fetching ? <Loader /> :
                    <div className="p-4 h-full">
                        {
                            videoList.length > 0 ?
                                (
                                    <>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-600">My Videos</h3>
                                        <div className="grid sm:grid-cols-9 xs:grid-cols-6 md:grid-cols-12 gap-x-2 gap-y-3">
                                            {
                                                videoList.map((video, index) => {
                                                    return (
                                                        <div onClick={() => router.push(video.d_id_status ? `/videos/${video.id}/show` : `/videos/${video.id}/edit`)} key={index} className="col-span-3 cursor-pointer group/video relative border-1 p-4 hover:bg-black border-gray-300 hover:drop-shadow-2xl rounded-xl overflow-hidden hover:-translate-y-2 transition-all duration-300">
                                                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/0 transition-all duration-300 hover:via-gray-900/1"></div>
                                                            <div className="h-36"></div>
                                                            {
                                                                video.thumbnail_url ?
                                                                    <Image src={video.thumbnail_url} alt="Audio play image" width={200} height={100} className="absolute inset-0 w-full h-full  object-cover" />
                                                                    :
                                                                    <Image src={PlayVideoIcon} alt="Audio play image" width={60} height={60} className="flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover/video:w-20 group-hover/video:h-20 transition-all duration-300 object-contain justify-center items-center" />
                                                            }

                                                            <div className="z-10 relative text-white">
                                                                <h1 className="font-bold text-xl text-shadow-lg">{video.title}</h1>
                                                                <div>
                                                                    {
                                                                        video.d_id_status == 'done' ?
                                                                            <span className="bg-green-700 text-white px-2 py-1 rounded-full">Generated</span>
                                                                            : <></>
                                                                    }
                                                                    {
                                                                        video.d_id_status == 'error' ?
                                                                            <span className="bg-red-700 text-white px-2 py-1 rounded-full">Error</span>
                                                                            : <></>
                                                                    }
                                                                    {
                                                                        video.d_id_status == 'created' ?
                                                                            <span className="bg-yellow-600 text-white px-2 py-1 rounded-full">Processing...</span>
                                                                            : <></>
                                                                    }
                                                                </div>
                                                            </div>
                                                            {video.owner === uid && (
                                                                <div className="absolute z-30 bottom-2 right-2 w-full flex justify-end rounded">
                                                                    <button
                                                                        onClick={(event) => handleDeleteClick(event, video.id)}
                                                                        className="border p-2 rounded-full hover:bg-red-900 hover:bg-opacity-65"
                                                                    >
                                                                        <Trash2 className="text-white cursor-pointer w-[22px] h-[22px]" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })
                                            }
                                        </div>
                                    </>
                                ) :
                                <div className="flex justify-center items-center h-full">
                                    <p className="text-lg font-semibold text-gray-600">Videos are not available</p>
                                </div>
                        }
                    </div>
            }
        </>
    )
}

function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Delete Video</h3>
                <p className="mb-4">Are you sure you want to delete this video ?</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}