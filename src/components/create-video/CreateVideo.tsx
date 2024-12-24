"use client";

import { db } from "@/firebase/firebaseClient";
import { VIDEO_COLLECTION } from "@/libs/constants";
import { CanvasObject, TalkingPhoto, Emotion, Frame, Movement, AvatarLook } from "@/types/heygen";
import { useAuthStore } from "@/zustand/useAuthStore";
import { collection, doc, getDoc, } from "firebase/firestore";
import { Captions, icons, Plus, Repeat2, Scaling, UserRound, Video } from "lucide-react";
import { ComponentType, Fragment, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { checkCanvasObjectImageDomain } from "@/libs/utils";
import { Controller, useForm } from "react-hook-form";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import CustomAudioOption2 from "../CustomAudioOption2";
import { useAudio } from "@/hooks/useAudio";
import { Voice } from "elevenlabs/api";
import * as fabric from 'fabric';
import { Background_Images } from "./utils";
import AvatarGallery from "./AvatarGallery";
import { useAvatars } from "@/hooks/useAvatars";

type IconType = keyof typeof icons | ReactElement | ComponentType<React.SVGProps<SVGSVGElement>>;

const steps = [
    {
        icon: UserRound,
        title: "Select Avatar",
        code: 'select-avatar'
    },
    {
        icon: Captions,
        title: "Write Script",
        code: 'write-script'
    },
]

const movements: { code: Movement, label: string, icon: IconType }[] = [
    {
        code: 'neutral',
        label: 'Neutral',
        icon: Video
    },
    {
        code: 'lively',
        label: 'Lively',
        icon: Video
    }
]
const frames: { code: Frame, label: string, icon: IconType }[] = [
    {
        code: 'landscape',
        label: 'Landscape (16:9)',
        icon: Scaling
    },
    {
        code: 'portrait',
        label: 'Portrait (9:16)',
        icon: Scaling
    }
]
const emotions: { code: Emotion, label: string }[] = [
    {
        'code': "Excited",
        'label': 'Excited'
    },
    {
        'code': 'Friendly',
        'label': 'Friendly',
    },
    {
        'code': 'Serious',
        'label': 'Serious',
    },
    {
        'code': 'Soothing',
        'label': 'Soothing',
    },
    {
        'code': 'Broadcaster',
        'label': 'Broadcaster',
    }
];

const colors = [
    { color: "#fecaca", tailwind_class: 'red-200' },
    { color: "#e7e5e4", tailwind_class: 'stone-200' },
    { color: "#fed7aa", tailwind_class: 'orange-200' },
    { color: "#fde68a", tailwind_class: 'amber-200' },
    { color: "#fef08a", tailwind_class: 'yellow-200' },
    { color: "#86efac", tailwind_class: 'green-200' },
];

const schema = Yup.object().shape({
    avatar_group_id: Yup.string().required("Required."),
    avatar_look_id: Yup.string().required("Required."),
    voice_id: Yup.string().required("Required."),
    emotion: Yup.string().required("Required.").oneOf(emotions.map((emotion) => emotion.code)),
    movement: Yup.string().required("Required.").oneOf(movements.map((movement) => movement.code)),
    frame: Yup.string().required("Required.").oneOf(frames.map((frame) => frame.code)),
});

export default function CreateVideo(
    { video_id }: { video_id: string | null }
) {
    const uid = useAuthStore((state) => state.uid);
    const { personalAvatarGroups, publicAvatarGroups, changeSelectedGroup, selectedAvatarGroup, selectedAvatarLooks } = useAvatars();
    const [personalTalkingPhotos,] = useState<TalkingPhoto[]>([]);
    const [selectedAvatar, setSelectedAvatar] = useState<AvatarLook | null>(null);
    const [processing, setProcessing] = useState(false);
    const [fetchingImage,] = useState(false);
    const { findVoice } = useAudio();

    const [activeStep, setActiveStep] = useState('select-avatar')
    const videoIdRef = useRef<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasContainerRef = useRef<HTMLDivElement | null>(null);
    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
    const [loadFirstTime, ] = useState(false);
    const [replaceAvatarModel, setReplaceAvatarModel] = useState(false);
    const [landscape, ] = useState('square');
    const totalProcessesRef = useRef(0);
    const completedProcessesRef = useRef(0);
    
    // If video id is exist then fetch video details
    // If exist then set selected avatar
    // update canvas variable

    const avatarsList = useMemo(() => {
        return personalAvatarGroups.concat(publicAvatarGroups);
    }, [personalAvatarGroups, publicAvatarGroups]);


    const selectAvatarForm = useForm<{
        avatar_group_id: string;
        avatar_look_id: string;
        voice_id: string;
        emotion: Emotion;
        movement: Movement;
        frame: Frame;
    }>({
        mode: 'all',
        resolver: yupResolver(schema),
        defaultValues: {
            emotion: 'Excited',
            movement: 'neutral',
            frame: 'fit'
        },
    });

    useEffect(() => {
        videoIdRef.current = video_id;
    }, [video_id])

    // useEffect(() => {
    //     const personalTalkingPhotosCollection = query(
    //         collection(db, DOCUMENT_COLLECTION),
    //         or(
    //             where('owner', '==', uid),
    //             where('type', '==', AVATAR_TYPE_TEMPLATE)
    //         ),
    //     );
    //     const unsubscribeTalkingPhotos = onSnapshot(
    //         personalTalkingPhotosCollection,
    //         (snapshot) => {
    //             const talkingPhotosList = snapshot.docs.map(
    //                 (doc) => doc.data() as TalkingPhoto
    //             );
    //             setPersonalTalkingPhotos(talkingPhotosList);
    //         }
    //     );

    //     return () => {
    //         unsubscribeTalkingPhotos();
    //     };
    // }, [uid]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            const message = "Are you sure you want to leave? Changes may not be saved.";
            event.preventDefault();
            event.returnValue = message;
            return message;
        };
    
        if (totalProcessesRef.current > completedProcessesRef.current) {
            window.addEventListener('beforeunload', handleBeforeUnload);
        } else {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const [videoCanvasDetail, setVideoCanvasDetail] = useState<{
        canvas_json: CanvasObject;
        canvas_detail: {
            height: number;
            width: number;
            aspectRatio: number;
        }
    } | null>(null);

    const handleChangeAvatar = useCallback(async (avatar: AvatarLook) => {
        console.log("Avatar Changed", avatar);

        setProcessing(true);
        setSelectedAvatar(avatar);
        setReplaceAvatarModel(false);
        setProcessing(false);
    }, [findVoice])

    useEffect(() => {
        // If video id is exist then fetch video details
        // Check personal talking photo should exist
        if (video_id && uid && personalTalkingPhotos.length > 0) {
            const docRef = doc(collection(db, VIDEO_COLLECTION), video_id);
            setProcessing(true);

            getDoc(docRef).then((snapshot) => {
                setProcessing(false);

                if (!snapshot.exists()) {
                    toast.error('Video not found');
                    // TODO: Send back to video list
                } else {
                    // Set avatar selected
                    const videoDetail = snapshot.data();
                    const avatar_id = videoDetail.avatar_id;
                    const avatar = personalTalkingPhotos.find((avatar) => avatar.talking_photo_id == avatar_id);
                    if (!avatar) {
                        toast.error('Selected avatar not found');
                        // TODO: Send back to video list
                    } else {
                        // handleChangeAvatar(avatar);
                        if (
                            typeof videoDetail == 'object' && "canvas_json" in videoDetail &&
                            typeof videoDetail.canvas_json == 'object' && "objects" in videoDetail.canvas_json &&
                            Array.isArray(videoDetail.canvas_json.objects)
                        ) {
                            videoDetail.canvas_json.objects = checkCanvasObjectImageDomain(videoDetail.canvas_json.objects)
                            setVideoCanvasDetail({
                                canvas_json: videoDetail.canvas_json,
                                canvas_detail: {
                                    height: videoDetail.canvas_detail?.height,
                                    width: videoDetail.canvas_detail?.width,
                                    aspectRatio: videoDetail.canvas_detail?.aspectRatio,
                                }
                            });
                        }

                    }

                }
            });

        }
    }, [video_id, uid, personalTalkingPhotos, handleChangeAvatar])



    const writeScriptForm = useForm<{ script: string; }>({ mode: 'all' });

    useEffect(() => {
        // selectAvatarForm.setValue('talking_photo_id', selectedAvatar ? selectedAvatar.talking_photo_id : '')
        // selectAvatarForm.setValue('voice_id', selectedAvatar && selectedAvatar.voiceId ? selectedAvatar.voiceId : '')
        let _canvas: fabric.Canvas | null = null;
        if (!canvas && canvasRef.current) {
            _canvas = new fabric.Canvas(canvasRef.current, {
                width: canvasRef.current.width,
            });
            setCanvas(_canvas);
        }
    }, [selectedAvatar, selectAvatarForm, canvas])


    useEffect(() => {
        if (uid && personalTalkingPhotos.length > 0 && canvas && canvasContainerRef.current) {
            if (!loadFirstTime && videoCanvasDetail && video_id) {
                console.log("Load canvas for first time");
                // loadCanvasForFirstTime()
            } else {
                console.log("Load canvas for other time else");
                // changeAvatarImageOnFrame()
            }
        }
    }, [selectedAvatar, canvas, videoCanvasDetail, video_id, uid, personalTalkingPhotos, canvasContainerRef]);


    useEffect(() => {
        selectAvatarForm.handleSubmit(() => { })
    }, [selectAvatarForm])

    const onSubmit = writeScriptForm.handleSubmit(async () => {
        if (!audioDetail) {
            toast.error('Please select audio');
            return;
        } else if (writeScriptForm.getValues('script').length <= 3) {
            toast.error('Please write script');
            return;
        }
        // if (selectedAvatar && videoIdRef.current) {

        //     // Check thumbnail url is generates if not then display message
        //     if (!canvas) {
        //         toast.error('Selected avatar is not able to generate video.');
        //         return;
        //     }

        //     toast.promise(
        //         // new Promise<{ status: boolean, data: string }>(async (resolve, reject) => {
        //         new Promise<{ status: boolean, data: string }>(async (resolve, reject) => {
        //             setProcessing(true);
        //             try {
        //                 const width = canvas.getWidth();
        //                 const height = canvas.getHeight();

        //                 // Minimum required resolution (1024px)
        //                 const minSize = 1024;

        //                 // Calculate the multiplier based on width and height
        //                 const widthMultiplier = width < minSize ? minSize / width : 1;
        //                 const heightMultiplier = height < minSize ? minSize / height : 1;

        //                 // Get the larger multiplier to ensure the image is at least 1024px in width or height
        //                 const multiplier = Math.min(widthMultiplier, heightMultiplier);

        //                 const thumbnailUrl = canvas.toDataURL({
        //                     multiplier,
        //                 });

        //                 const baseUrl = getApiBaseUrl() ?? window.location.origin;
        //                 const response = await generateVideo(
        //                     videoIdRef.current,
        //                     profile.did_api_key ?? null,
        //                     baseUrl,
        //                     thumbnailUrl,
        //                     writeScriptForm.getValues('script'),
        //                     selectedAvatar.voiceId,
        //                     undefined,
        //                     profile.elevenlabs_api_key,
        //                     selectAvatarForm.getValues('emotion'),
        //                     selectAvatarForm.getValues('movement'),
        //                 )

        //                 /**
        //                  * TODO: If status is false and id is provided then redirect it to video detail page
        //                  */

        //                 if (response.status && response.id != undefined) {
        //                     resolve({ status: true, data: response.id });
        //                 } else {
        //                     reject({ status: false, data: response.message });
        //                 }
        //             } catch (error) {
        //                 console.log("Error", error);
        //                 /**
        //                  * TODO: Handle error
        //                  */
        //             }
        //         }),
        //         {
        //             loading: 'Requesting to generate your video...',
        //             success: (result) => {
        //                 router.push(`/videos/${result.data}/show`);
        //                 // setProcessing(false);
        //                 return `Successfully requested, Processing your video.`;
        //             },
        //             error: (err) => {
        //                 setProcessing(false);
        //                 return `Error : ${err.data}`;
        //             },
        //         }
        //     );
        // }
    });

    const setBackgroundColor = useCallback((color: string) => {
        if (canvas) {
            if (canvas.backgroundImage) {
                canvas.backgroundImage = undefined;
            }
            canvas.backgroundColor = color;
            canvas.renderAll();
        }
    }, [canvas])


    const [audioDetail,] = useState<Voice | null>(null);

    const stepOneCompeted = useMemo(() => {
        return selectedAvatar != null && audioDetail != null
    }, [selectedAvatar, audioDetail])

    return <div className="px-4 max-h-full h-full flex flex-col video-create">
        <ol className="flex items-center w-full gap-4">
            {
                steps.map((step, index) => <li key={index} className="flex-1 ">
                    <button disabled={processing} onClick={() => { setActiveStep(step.code); }} className={`disabled:cursor-not-allowed flex items-center font-medium px-4 py-5 w-full create-video-step ${activeStep == step.code && 'active'}`}>
                        <span className="w-8 h-8 bg-gray-600  rounded-full flex justify-center items-center mr-3 text-sm text-white lg:w-10 lg:h-10">
                            <step.icon />
                        </span>
                        <h4 className="text-base  text-gray-600">{step.title}</h4>
                    </button>
                </li>)
            }
        </ol>

        <div className="py-4 px-1 grow overflow-hidden">
            <div className={`flex w-full max-h-full h-full gap-4 overflow-auto ${activeStep == 'select-avatar' ? '' : 'hidden'}`}>
                <div className={`${selectedAvatar ? 'w-1/4 hidden' : 'w-full'} flex flex-col h-full max-h-full overflow-auto relative`}>
                    <AvatarGallery handleChangeAvatarGroup={changeSelectedGroup} selectedAvatarGroup={selectedAvatarGroup} avatarLooks={selectedAvatarLooks} selectedAvatar={selectedAvatar} personalTalkingPhotos={avatarsList} handleChangeAvatar={handleChangeAvatar} />
                </div>
                {selectedAvatar ?
                    <div className="grow bg-gray-50 rounded-lg p-4 h-full flex flex-col justify-between">
                        <div className="flex grow overflow-x-auto">
                            {replaceAvatarModel ? <div className="w-1/4 flex flex-col h-full max-h-full overflow-auto relative ">
                                <AvatarGallery handleChangeAvatarGroup={changeSelectedGroup} selectedAvatarGroup={selectedAvatarGroup} avatarLooks={selectedAvatarLooks} selectedAvatar={selectedAvatar} personalTalkingPhotos={avatarsList} handleChangeAvatar={handleChangeAvatar} />
                            </div>
                                : <div className="px-4 flex flex-col w-1/4">
                                    <p className="text-2xl font-bold">{selectedAvatar.name}</p>
                                    <div className="flex flex-col gap-4 mt-5 pe-4 grow overflow-y-auto">
                                        <div className="relative">
                                            {fetchingImage ? <div className="bg-gray-300 animate-pulse w-full h-96 rounded-lg"></div> : <div className="relative w-full h-96">
                                                <Image
                                                    className="rounded-md cursor-pointer object-cover"
                                                    src={selectedAvatar.image_url}
                                                    alt="avatar"
                                                    layout="fill"
                                                />
                                                <div>
                                                    <button onClick={() => { setReplaceAvatarModel(true) }} className="flex hover:bg-gray-200 gap-2 absolute items-center bottom-0 right-0 bg-white p-2 rounded-md mr-2 mb-2">
                                                        <Repeat2 size={22} />
                                                        <label className="cursor-pointer font-medium text-sm ">Replace</label>
                                                    </button>
                                                </div>
                                            </div>
                                            }
                                        </div>
                                        <div>
                                            <label className="label">Audio</label>
                                            {
                                                audioDetail ?
                                                    <div className="flex flex-col w-full gap-4">
                                                        <CustomAudioOption2 data={audioDetail} />
                                                        <div>
                                                            <audio className="w-full" controls key={audioDetail.voice_id}>
                                                                <source src={audioDetail.preview_url} type="audio/mpeg" />
                                                                Your browser does not support the audio element.
                                                            </audio>
                                                        </div>
                                                    </div>
                                                    : <Fragment />
                                            }
                                        </div>
                                        <Controller
                                            control={selectAvatarForm.control}
                                            name="emotion"
                                            render={({ field }) => (
                                                <div>
                                                    <label className="label">Emotions</label>

                                                    <ul className="items-center w-full text-sm font-medium grid grid-cols-2 gap-1">
                                                        {
                                                            emotions.map((emotion, index) => <li key={index} onClick={() => { selectAvatarForm.setValue('emotion', emotion.code) }} className={`p-2 rounded-md cursor-pointer w-full ${field.value == emotion.code ? 'bg-slate-600 text-white' : 'bg-white border text-gray-900'}`}>
                                                                <div className="flex items-center">
                                                                    <label className="w-full ms-2 text-sm font-medium cursor-pointer">{emotion.label}</label>
                                                                </div>
                                                            </li>)
                                                        }

                                                    </ul>

                                                </div>
                                            )}
                                        />
                                        <Controller
                                            control={selectAvatarForm.control}
                                            name="movement"
                                            rules={{
                                                required: { message: 'Required.', value: true },
                                            }}
                                            render={({ field }) => (
                                                <div>
                                                    <label className="label">Movements</label>

                                                    <ul className="items-center w-full text-sm font-medium border-gray-200 grid grid-cols-2 gap-1 ">
                                                        {
                                                            movements.map((movements, index) => <li key={index} onClick={() => { selectAvatarForm.setValue('movement', movements.code) }} className={`p-2 rounded-md cursor-pointer ${field.value == movements.code ? 'bg-slate-600 text-white' : 'bg-white border text-gray-900'}`}>
                                                                <div className="flex items-center">
                                                                    <label className="w-full ms-2 text-sm font-medium cursor-pointer">{movements.label}</label>
                                                                </div>
                                                            </li>)
                                                        }

                                                    </ul>

                                                </div>
                                            )}
                                        />

                                        <Controller
                                            control={selectAvatarForm.control}
                                            name="frame"
                                            rules={{
                                                required: { message: 'Required.', value: true },
                                            }}
                                            render={({ field }) => (
                                                <div>
                                                    <label className="label">Frame</label>

                                                    <ul className="items-center w-full text-sm font-medium border-gray-200 grid grid-cols-1 gap-1 ">
                                                        {
                                                            frames.map((frame, index) => <li key={index} onClick={() => { selectAvatarForm.setValue('frame', frame.code) }} className={`p-2 rounded-md cursor-pointer ${field.value == frame.code ? 'bg-slate-600 text-white' : 'bg-white border text-gray-900'}`}>
                                                                <div className="flex items-center">
                                                                    <label className="w-full ms-2 text-sm font-medium cursor-pointer">{frame.label}</label>
                                                                </div>
                                                            </li>)
                                                        }

                                                    </ul>

                                                </div>
                                            )}
                                        />

                                        <div>
                                            <label className="label">Background Color</label>

                                            <ul className="items-center w-full text-sm font-medium border-gray-200 grid grid-cols-5 gap-1 ">
                                                {
                                                    colors.map((color, index) => <li key={index} onClick={() => { setBackgroundColor(color.color) }} className={`p-2 rounded-md cursor-pointer`} style={{ background: color.color }}>
                                                        <div className="flex items-center h-3">
                                                        </div>
                                                    </li>)
                                                }

                                            </ul>

                                        </div>

                                        <div className="flex flex-col items-start space-y-2">
                                            <label className="label">My Background</label>
                                            <div className="relative">
                                                {/* <input
                                                    type="file"
                                                    onChange={handleImageUpload}
                                                    id="file-upload"
                                                    className="hidden"
                                                /> */}
                                                <label
                                                    htmlFor="file-upload"
                                                    className="flex items-center space-x-2 px-6 py-6 bg-neutral-200 rounded-md cursor-pointer hover:bg-neutral-300"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <Plus size={30} className="" />
                                                        <p className="">Upload</p>
                                                    </div>

                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="label">Background Image</label>
                                            <div className="grid grid-cols-2 gap-2 w-full text-sm font-medium border-gray-200 h-96 overflow-auto scrolls">
                                                {Background_Images.map((data, index) => (
                                                    <div key={index} className="p-2">
                                                        <div className={`relative w-full h-48 
                                                            ${landscape == 'square' && '!h-48'}
                                                            ${landscape == 'portrait' && '!h-64'}
                                                            ${landscape == 'landscape' && '!h-28'}
                                                        `}>
                                                            {/* <Image
                                                                className="rounded-md cursor-pointer object-cover"
                                                                src={data.image}
                                                                onClick={(e: React.MouseEvent<HTMLImageElement>) => handleSetBackground((e.target as HTMLImageElement).src)}
                                                                alt="background"
                                                                layout="fill"
                                                            /> */}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>}
                            <div className="self-center grow justify-center flex h-full" ref={canvasContainerRef}>
                                <canvas className="border-2 border-gray-500 w-full h-full rounded-lg" ref={canvasRef} id="fabricCanvas" />
                            </div>
                        </div>
                        <div>
                            <button disabled={!stepOneCompeted} onClick={() => { setActiveStep('write-script'); }} className="disabled:cursor-not-allowed float-end bg-gray-500 text-white px-4 py-2 h-10 rounded-md flex items-center justify-center mt-4">
                                Next
                            </button>
                        </div>
                    </div> : <Fragment />
                }
            </div>

            {
                activeStep == 'write-script' ? <div className="grow bg-gray-50 rounded-lg px-4 pt-6 pb-4 h-full flex flex-col">
                    <form onSubmit={onSubmit}>
                        <div><h3 className="text-2xl font-bold mb-2">Write Script</h3></div>
                        <div className="grow">
                            <Controller
                                control={writeScriptForm.control}
                                name="script"
                                rules={{
                                    required: { message: 'Required.', value: true },
                                }}
                                render={({ field }) => (
                                    <textarea {...field} id="message" rows={10} className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Write Script..."></textarea>
                                )}
                            />
                        </div>
                        <div>
                            <button disabled={processing} type="submit" className="disabled:cursor-not-allowed float-end bg-gray-500 text-white px-4 py-2 h-10 rounded-md flex items-center justify-center mt-4">
                                {processing ? 'Processing...' : 'Generate Video'}
                            </button>
                        </div>

                    </form>
                </div> : <Fragment />
            }

        </div>
    </div>
}
