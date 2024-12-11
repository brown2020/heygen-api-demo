"use client";

import { db } from "@/firebase/firebaseClient";
import { AVATAR_TYPE_TEMPLATE, DOCUMENT_COLLECTION, VIDEO_COLLECTION } from "@/libs/constants";
import { CanvasObject, CustomFabricImage, TalkingPhoto, Emotion, Frame, Movement } from "@/types/heygen";
import { useAuthStore } from "@/zustand/useAuthStore";
import { collection, doc, getDoc, onSnapshot, or, query, setDoc, where } from "firebase/firestore";
import { Captions, icons, Meh, Plus, Repeat2, Scaling, Smile, UserRound, Video } from "lucide-react";
import { ComponentType, Fragment, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { checkCanvasObjectImageDomain, cleanObject, getApiBaseUrl, imageProxyUrl } from "@/libs/utils";
import { Controller, useForm, useWatch } from "react-hook-form";
import SurprisedIcon from "@/assets/icons/suprised-emoji.svg";
// import { generateVideo } from "@/actions/generateVideo";
import * as Yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
// import { useRouter } from "next/router";
import useProfileStore from "@/zustand/useProfileStore";
import CustomAudioOption2 from "../CustomAudioOption2";
import { useAudio } from "@/hooks/useAudio";
import { Voice } from "elevenlabs/api";
import * as fabric from 'fabric';
import { Background_Images } from "./utils";
import AvatarGallery from "./AvatarGallery";
import TextBox from "./TextBox";
import { addDraftVideo } from "@/actions/addDraftVideo";
import { generateVideo } from "@/actions/generateVideo";

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
        code: 'fit',
        label: 'Fit',
        icon: Scaling
    },
    {
        code: 'landscape',
        label: 'Landscape (16:9)',
        icon: Scaling
    },
    {
        code: 'portrait',
        label: 'Portrait (9:16)',
        icon: Scaling
    },
    {
        code: 'square',
        label: 'Square (1:1)',
        icon: Scaling
    },
]
const emotions: { code: Emotion, label: string, icon: IconType }[] = [
    {
        'code': "neutral",
        'label': 'Neutral',
        'icon': Meh
    },
    {
        'code': 'happy',
        'label': 'Happy',
        'icon': Smile
    },
    {
        'code': 'surprise',
        'label': 'Surprise',
        'icon': <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path d="M12 17a2 2 0 1 1 0-4a2 2 0 0 1 0 4" /><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10" /><path fill="currentColor" d="M8.5 9a.5.5 0 1 1 0-1a.5.5 0 0 1 0 1m7 0a.5.5 0 1 1 0-1a.5.5 0 0 1 0 1" /></g></svg>
    },
    {
        'code': 'serious',
        'label': 'Serious',
        'icon': SurprisedIcon,
        // 'icon': <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 9H8m8 0h-2m4 6H6m-4-3c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2S2 6.477 2 12" /></svg>
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
    talking_photo_id: Yup.string().required("Required."),
    voice_id: Yup.string().required("Required."),
    emotion: Yup.string().required("Required.").oneOf(emotions.map((emotion) => emotion.code)),
    movement: Yup.string().required("Required.").oneOf(movements.map((movement) => movement.code)),
    frame: Yup.string().required("Required.").oneOf(frames.map((frame) => frame.code)),
});

export default function CreateVideo({ video_id }: { video_id: string | null }) {
    const uid = useAuthStore((state) => state.uid);
    // const profile = useProfileStore((state) => state.profile);
    const router = useRouter();
    const profile = useProfileStore((state) => state.profile);
    // const routerSecond = useRouterSecond();
    const [personalTalkingPhotos, setPersonalTalkingPhotos] = useState<TalkingPhoto[]>([]);
    const [selectedAvatar, setSelectedAvatar] = useState<TalkingPhoto | null>(null);
    const [processing, setProcessing] = useState(false);
    const [fetchingImage, setFetchingImage] = useState(false);
    const { findVoice } = useAudio();

    const [activeStep, setActiveStep] = useState('select-avatar')
    const videoIdRef = useRef<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const canvasContainerRef = useRef<HTMLDivElement | null>(null);
    const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
    const [canvasElements, setCanvasElements] = useState<fabric.Object[]>([]);
    const [loadFirstTime, setLoadFirstTime] = useState(false);
    const [replaceAvatarModel, setReplaceAvatarModel] = useState(false);
    const [fabricBackgroundImage, setFabricBackgroundImage] = useState<fabric.Image | null>(null);
    const [landscape, setLandscape] = useState('square');
    const totalProcessesRef = useRef(0);
    const completedProcessesRef = useRef(0);
    // If video id is exist then fetch video details
    // If exist then set selected avatar
    // update canvas variable


    const selectAvatarForm = useForm<{
        talking_photo_id: string;
        voice_id: string;
        emotion: Emotion;
        movement: Movement;
        frame: Frame;
    }>({
        mode: 'all',
        resolver: yupResolver(schema),
        defaultValues: {
            emotion: 'neutral',
            movement: 'neutral',
            frame: 'fit'
        },
    });

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        }
    })
    useEffect(() => {
        videoIdRef.current = video_id;
    }, [video_id])

    useEffect(() => {
        const personalTalkingPhotosCollection = query(
            collection(db, DOCUMENT_COLLECTION),
            or(
                where('owner', '==', uid),
                where('type', '==', AVATAR_TYPE_TEMPLATE)
            ),
        );
        const unsubscribeTalkingPhotos = onSnapshot(
            personalTalkingPhotosCollection,
            (snapshot) => {
                const talkingPhotosList = snapshot.docs.map(
                    (doc) => doc.data() as TalkingPhoto
                );
                setPersonalTalkingPhotos(talkingPhotosList);
            }
        );

        return () => {
            unsubscribeTalkingPhotos();
        };
    }, [uid]);

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

    const handleChangeAvatar = useCallback(async (avatar: TalkingPhoto) => {
        console.log("Avatar Changed", avatar);

        setProcessing(true);
        setSelectedAvatar(avatar);
        setReplaceAvatarModel(false);
        let _audio = null;
        if (avatar.voiceId) {
            const audio = await findVoice(avatar.voiceId);
            if (audio.status && audio.voice) {
                _audio = audio.voice
            }
        }
        setAudioDetail(_audio);
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
                        handleChangeAvatar(avatar);
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


    const canvasMainImage = useCallback(() => {
        if (canvas) {
            const object = canvas.getObjects('image').find((obj) => obj.type == 'image');
            return object ? object : null;
        }
        return null;
    }, [canvas])

    const changeAvatarImageOnFrame = useCallback(async () => {
        if (fetchingImage) return;

        // If video id is exist then it should already have canvas detail
        if (video_id && !loadFirstTime) return;

        // If selected avatar is same then remove it

        if (!selectedAvatar) {
            console.log("No avatar selected");
        }

        if (canvas && selectedAvatar) {
            const imageURL = imageProxyUrl(getApiBaseUrl(), `${selectedAvatar.talking_photo_id}.png`);
            toast.promise(
                new Promise<{ status: boolean, data: string }>(async (resolve, reject) => {
                    try {
                        // Show processing while uploading image
                        setFetchingImage(true);

                        // remove existing image while uploading new image
                        const mainImage = canvasMainImage();
                        if (mainImage) {
                            canvas.remove(mainImage); canvas.renderAll();
                        }

                        const img: CustomFabricImage = await fabric.FabricImage.fromURL(imageURL, { crossOrigin: 'anonymous' });
                        setFetchingImage(false);

                        // Set current image in specific dimensions

                        if (canvasContainerRef.current !== null) {
                            // Get screen dimensions
                            const { width: screenWidth, height: screenHeight } = getContainerHeightWidth();

                            // Get original image dimensions
                            const imageWidth = img.width;
                            const imageHeight = img.height;

                            // Calculate scaling factor to fit the image within the screen size
                            const scaleFactor = Math.min(screenWidth / imageWidth, screenHeight / imageHeight);

                            // If the image is larger than the screen, scale it down
                            const scaledWidth = imageWidth * scaleFactor;
                            const scaledHeight = imageHeight * scaleFactor;

                            // Set the new dimensions for the canvas
                            canvas.setWidth(scaledWidth);
                            canvas.setHeight(scaledHeight);
                            canvas?.renderAll();

                            // Add the image to the canvas with the scaled dimensions
                            img.set({
                                scaleX: scaleFactor,
                                scaleY: scaleFactor,
                                borderColor: 'red',
                                zIndex: 0,
                            });
                            img.is_avatar = true;
                            canvas.add(img);
                            setCanvasElements([...canvasElements, img]);
                        }
                        resolve({ status: true, data: 'Successfully fetched image' });
                    } catch (error) {
                        console.log("Error on fetching image", error);

                        setFetchingImage(false);
                        reject({ status: false, data: error });
                    }
                }),
                {
                    loading: 'Fetching original image...',
                    success: () => {
                        return `Successfully fetched image`;
                    },
                    error: (err) => {
                        return `Error : ${err.data}`;
                    },
                }
            )


        }
    }, [canvas, selectedAvatar, fetchingImage, canvasElements, canvasMainImage, loadFirstTime, video_id])

    const getContainerHeightWidth = () => {
        const container = canvasContainerRef.current;

        return container ? {
            width: (container.offsetWidth),
            height: (container.offsetHeight),
        } : {
            width: 0,
            height: 0,
        };
    }

    const setCanvasDimensions = useCallback((
        widthOrHeight: number,
        aspectRatio: { width: number, height: number } | null,
        img: fabric.Object
    ) => {
        const container = canvasContainerRef.current;

        if (canvas && container) {

            if (aspectRatio == null) {
                // Get screen dimensions
                const { width: screenWidth, height: screenHeight } = getContainerHeightWidth();

                // Get original image dimensions
                const imageWidth = img.width;
                const imageHeight = img.height;

                // Calculate scaling factor to fit the image within the screen size
                const scaleFactor = Math.min(screenWidth / imageWidth, screenHeight / imageHeight);

                // If the image is larger than the screen, scale it down
                const scaledWidth = imageWidth * scaleFactor;
                const scaledHeight = imageHeight * scaleFactor;

                // Set the new dimensions for the canvas
                canvas.setWidth(scaledWidth);
                canvas.setHeight(scaledHeight);

                // Add the image to the canvas with the scaled dimensions
                img.set({
                    scaleX: scaleFactor,
                    scaleY: scaleFactor,
                    left: 0,
                    top: 0,
                });
                img.setCoords();
                canvas?.renderAll();
            } else {
                let canvasWidth, canvasHeight;

                // Calculate width and height based on the aspect ratio
                if (widthOrHeight === aspectRatio.width) {
                    canvasHeight = (widthOrHeight * aspectRatio.height) / aspectRatio.width;
                    canvasWidth = widthOrHeight;
                } else {
                    canvasWidth = (widthOrHeight * aspectRatio.width) / aspectRatio.height;
                    canvasHeight = widthOrHeight;
                }

                // Get the container's width and height
                const containerWidth = container.offsetWidth;
                const containerHeight = container.offsetHeight;

                // Check if the calculated dimensions exceed the container's size
                if (canvasWidth > containerWidth) {
                    const scale = containerWidth / canvasWidth;
                    canvasWidth = containerWidth;
                    canvasHeight = canvasHeight * scale; // Scale height based on width adjustment
                }

                if (canvasHeight > containerHeight) {
                    const scale = containerHeight / canvasHeight;
                    canvasHeight = containerHeight;
                    canvasWidth = canvasWidth * scale; // Scale width based on height adjustment
                }

                // Set the calculated width and height for the canvas
                canvas.setWidth(canvasWidth - 4);
                canvas.setHeight(canvasHeight - 4);

                // Scale the image uniformly to fit within the canvas
                const imageAspectRatio = img.width / img.height;
                const canvasAspectRatio = canvasWidth / canvasHeight;

                let scaleFactor;
                if (imageAspectRatio > canvasAspectRatio) {
                    // Image is wider than the canvas
                    scaleFactor = canvasWidth / img.width;
                } else {
                    // Image is taller than the canvas
                    scaleFactor = canvasHeight / img.height;
                }

                img.set({
                    scaleX: scaleFactor,
                    scaleY: scaleFactor,
                    left: (canvasWidth - img.width * scaleFactor) / 2, // Center horizontally
                    top: (canvasHeight - img.height * scaleFactor) / 2, // Center vertically
                });

                img.setCoords();

                canvas.renderAll();

                console.log("Canvas dimensions", fabricBackgroundImage);
            }

        }
    }, [canvas, fabricBackgroundImage]);

    const setBackgroundImageDimension = useCallback((fabricImage: fabric.Image) => {
        const canvasWidth = canvas ? canvas.width : 0;
        const canvasHeight = canvas ? canvas.height : 0;

        const scaleX = canvasWidth / fabricImage.width;
        const scaleY = canvasHeight / fabricImage.height;
        const scale = Math.max(scaleX, scaleY);

        fabricImage.scale(scale);
        fabricImage.set({
            left: (canvasWidth - fabricImage.getScaledWidth()) / 2,
            top: (canvasHeight - fabricImage.getScaledHeight()) / 2,
        });
    }, [canvas]);

    const updateCanvasAsPerVariable = useCallback((frame: Frame) => {
        const mainImage = canvasMainImage();
        setLandscape(frame);
        if (mainImage && canvasContainerRef.current) {
            const { width } = getContainerHeightWidth();
            if (frame == 'fit') {
                setCanvasDimensions(width, null, mainImage);
            } else if (frame == 'landscape') {
                setCanvasDimensions(width, { width: 16, height: 9 }, mainImage);
            } else if (frame == 'portrait') {
                setCanvasDimensions(width, { width: 9, height: 16 }, mainImage);
            } else if (frame == 'square') {
                setCanvasDimensions(width, { width: 1, height: 1 }, mainImage);
            }
            if (fabricBackgroundImage) {
                setBackgroundImageDimension(fabricBackgroundImage);
                if (canvas) {
                    canvas.renderAll();
                }
            }
        }
    }, [canvas, canvasMainImage, setCanvasDimensions, fabricBackgroundImage, setBackgroundImageDimension])

    const updatedFields = useWatch({ control: selectAvatarForm.control, name: ['frame'] })
    useEffect(() => {
        updateCanvasAsPerVariable(updatedFields[0])
    }, [updatedFields, updateCanvasAsPerVariable])

    const handleKeyDown = (event: KeyboardEvent) => {
        if (canvas !== null) {
            if (event.ctrlKey && event.key === 'a') {
                event.preventDefault();
                const iTextObjects = canvas.getObjects().filter((obj: fabric.Object) => obj && obj.type === 'i-text');
                if (iTextObjects.length > 0) {
                    canvas.discardActiveObject();
                    const selection = new fabric.ActiveSelection(iTextObjects, {
                        canvas: canvas,
                    });
                    canvas.setActiveObject(selection);
                    canvas.renderAll();
                } else {
                    console.error("No i-text objects found");
                }
            }
            if (event.key === 'Delete') {
                const selectedObject = canvas.getActiveObject();
                if (selectedObject) {
                    const objects = (selectedObject as fabric.ActiveSelection)._objects;
                    if (objects && objects.length > 0) {
                        (selectedObject as fabric.ActiveSelection).forEachObject(obj => {
                            canvas.remove(obj);
                        });
                    } else {
                        canvas.remove(selectedObject);
                    }
                }
                canvas.discardActiveObject();
                canvas.renderAll();
            } else {
                console.log("No active selection to delete");
            }
        }
    };

    const writeScriptForm = useForm<{ script: string; }>({ mode: 'all' });

    useEffect(() => {
        selectAvatarForm.setValue('talking_photo_id', selectedAvatar ? selectedAvatar.talking_photo_id : '')
        selectAvatarForm.setValue('voice_id', selectedAvatar && selectedAvatar.voiceId ? selectedAvatar.voiceId : '')
        let _canvas: fabric.Canvas | null = null;
        if (!canvas && canvasRef.current) {
            _canvas = new fabric.Canvas(canvasRef.current, {
                width: canvasRef.current.width,
            });
            setCanvas(_canvas);
        }
    }, [selectedAvatar, selectAvatarForm, canvas])

    const handleObjectChange = useCallback(async () => {
        try {
            totalProcessesRef.current += 1;
            // Simulate async operation (e.g., save, fetch, or process data)

            if (!canvas || !selectedAvatar) {
                return;
            }
            const width = canvas.getWidth();
            const height = canvas.getHeight();
            const canvas_json = canvas.toJSON();
            // If video id not exit then add video as draft
            console.log("videoId", videoIdRef.current);

            if (videoIdRef.current != null) {
                // Save video detail to firebase collection
                const videoDetail = {
                    id: videoIdRef.current,
                    canvas_json,
                    canvas_detail: {
                        width: width,
                        height: height,
                        aspectRatio: width / height,
                    }
                }
                const docRef = doc(collection(db, VIDEO_COLLECTION), videoIdRef.current);
                await setDoc(docRef, cleanObject(videoDetail), { merge: true });
            } else {
                const response = await addDraftVideo(
                    canvas_json,
                    {
                        width: width,
                        height: height,
                        aspectRatio: width / height,
                    },
                    selectedAvatar.talking_photo_id
                );
                console.log("response", response);

                if (response.status) {
                    videoIdRef.current = response.id;
                    // router.replace(`/videos/${videoIdRef.current}/edit`, undefined, {});
                }
            }
            completedProcessesRef.current += 1;
        } catch (error) {
            console.error('Error processing canvas change:', error);
        }
    }, [canvas, selectedAvatar]);

    useEffect(() => {
        // Canvas should the rendered
        // And if video id is exist then load canvas for first time, only after that register event
        if (canvas && (video_id ? loadFirstTime : true)) {
            // Attach the event listeners
            canvas.on('object:added', handleObjectChange);
            canvas.on('object:modified', handleObjectChange);
            canvas.on('object:removed', handleObjectChange);

            // Cleanup: Remove event listeners when the component unmounts or canvas is reset
            return () => {
                canvas.off('object:added', handleObjectChange);
                canvas.off('object:modified', handleObjectChange);
                canvas.off('object:removed', handleObjectChange);
            };
        }
    }, [canvas, loadFirstTime, video_id, handleObjectChange]);

    useEffect(() => {
        if (uid && personalTalkingPhotos.length > 0 && canvas && canvasContainerRef.current) {
            if (!loadFirstTime && videoCanvasDetail && video_id) {
                console.log("Load canvas for first time");
                loadCanvasForFirstTime()
            } else {
                console.log("Load canvas for other time else");
                changeAvatarImageOnFrame()
            }
        }
    }, [selectedAvatar, canvas, videoCanvasDetail, video_id, uid, personalTalkingPhotos, canvasContainerRef]);

    const loadCanvasForFirstTime = async () => {
        if (!loadFirstTime && videoCanvasDetail && video_id && uid && personalTalkingPhotos.length > 0 && canvas && canvasContainerRef.current) {
            const jsonData = {
                objects: videoCanvasDetail.canvas_json,
                canvasSize: videoCanvasDetail.canvas_detail,
            };
            const originalWidth = jsonData.canvasSize.width;
            const originalHeight = jsonData.canvasSize.height;
            const aspectRatio = jsonData.canvasSize.aspectRatio;

            // Get the container's maximum dimensions
            const containerWidth = canvasContainerRef.current.clientWidth;
            const containerHeight = canvasContainerRef.current.clientHeight;

            // Calculate new dimensions while maintaining aspect ratio
            let targetWidth = containerWidth;
            let targetHeight = targetWidth / aspectRatio;

            // Check if height exceeds container height
            if (targetHeight > containerHeight) {
                targetHeight = containerHeight;
                targetWidth = targetHeight * aspectRatio;
            }

            // Resize the canvas to fit within container constraints
            canvas.setWidth(targetWidth);
            canvas.setHeight(targetHeight);

            // Calculate scale factors for the objects
            const scaleX = targetWidth / originalWidth;
            const scaleY = targetHeight / originalHeight;

            // Load the canvas objects and scale them
            await canvas.loadFromJSON(jsonData.objects);
            const objects = canvas.getObjects();


            objects.forEach((obj) => {
                obj.scaleX *= scaleX;
                obj.scaleY *= scaleY;
                obj.left *= scaleX;
                obj.top *= scaleY;
                obj.setCoords(); // Update object's bounding box
            });
            canvas.renderAll();
            setLoadFirstTime(true)
        }
    }


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
        if (selectedAvatar && videoIdRef.current) {

            // Check thumbnail url is generates if not then display message
            if (!canvas) {
                toast.error('Selected avatar is not able to generate video.');
                return;
            }

            toast.promise(
                // new Promise<{ status: boolean, data: string }>(async (resolve, reject) => {
                new Promise<{ status: boolean, data: string }>(async (resolve, reject) => {
                    setProcessing(true);
                    try {
                        const width = canvas.getWidth();
                        const height = canvas.getHeight();

                        // Minimum required resolution (1024px)
                        const minSize = 1024;

                        // Calculate the multiplier based on width and height
                        const widthMultiplier = width < minSize ? minSize / width : 1;
                        const heightMultiplier = height < minSize ? minSize / height : 1;

                        // Get the larger multiplier to ensure the image is at least 1024px in width or height
                        const multiplier = Math.min(widthMultiplier, heightMultiplier);

                        const thumbnailUrl = canvas.toDataURL({
                            multiplier,
                        });

                        const baseUrl = getApiBaseUrl() ?? window.location.origin;
                        const response = await generateVideo(
                            videoIdRef.current,
                            profile.did_api_key ?? null,
                            baseUrl,
                            thumbnailUrl,
                            writeScriptForm.getValues('script'),
                            selectedAvatar.voiceId,
                            undefined,
                            profile.elevenlabs_api_key,
                            selectAvatarForm.getValues('emotion'),
                            selectAvatarForm.getValues('movement'),
                        )

                        /**
                         * TODO: If status is false and id is provided then redirect it to video detail page
                         */

                        if (response.status && response.id != undefined) {
                            resolve({ status: true, data: response.id });
                        } else {
                            reject({ status: false, data: response.message });
                        }
                    } catch (error) {
                        console.log("Error", error);
                        /**
                         * TODO: Handle error
                         */
                    }
                }),
                {
                    loading: 'Requesting to generate your video...',
                    success: (result) => {
                        router.push(`/videos/${result.data}/show`);
                        // setProcessing(false);
                        return `Successfully requested, Processing your video.`;
                    },
                    error: (err) => {
                        setProcessing(false);
                        return `Error : ${err.data}`;
                    },
                }
            );
        }
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

    const setBackgroundImage = useCallback((image: fabric.FabricImage) => {
        setFabricBackgroundImage(image);
        if (canvas) {
            canvas.backgroundImage = image;
            canvas.renderAll();
        }
    }, [canvas])

    const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files;
        if (file) {
            toast.promise(
                new Promise<void>(async (resolve, reject) => {
                    try {
                        // Show processing toast while uploading image
                        setFetchingImage(true);

                        const reader = new FileReader();
                        reader.onload = function (e) {
                            const image = new window.Image();
                            image.src = e.target?.result as string;
                            image.onload = function () {
                                const fabricImage = new fabric.Image(image, {
                                    left: 0,
                                    top: 0,
                                    zIndex: 0,
                                });

                                setBackgroundImageDimension(fabricImage);
                                setBackgroundImage(fabricImage);
                                setFetchingImage(false);
                                resolve();
                            };
                        };
                        reader.readAsDataURL(file[0]);
                    } catch (error) {
                        console.log("Error on image upload", error);
                        setFetchingImage(false);
                        reject();
                    }
                }),
                {
                    loading: 'Uploading and processing image...',
                    success: () => 'Image successfully uploaded and scaled!',
                    error: (err) => `Error: ${err}`,
                }
            );
        }
    }, [setBackgroundImage, setBackgroundImageDimension]);

    const handleSetBackground = useCallback(
        (src: string) => {
            const image = new window.Image();
            image.src = src;
            image.onload = function () {
                const fabricImage = new fabric.Image(image, {
                    left: 0,
                    top: 0,
                });

                setBackgroundImageDimension(fabricImage);
                setBackgroundImage(fabricImage);
            };
        },
        [setBackgroundImage, setBackgroundImageDimension]
    );

    const handleText = useCallback((textType: string) => {
        if (canvas) {
            let textContent = 'Heading';
            let fontSize = 24;
            let fontWeight = 'bold';

            if (textType === 'headline') {
                textContent = 'Header';
                fontSize = 42;
                fontWeight = '500';
            } else if (textType === 'subTitle') {
                textContent = 'Sub Header';
                fontSize = 32;
                fontWeight = '500';
            } else if (textType === 'body') {
                textContent = 'Body text';
                fontSize = 22;
                fontWeight = 'normal';
            }

            const text = new fabric.IText(textContent, {
                left: 100,
                top: 100,
                fill: 'black',
                fontSize,
                fontWeight,
                zIndex: 9999,
                selectable: true,
            });

            text.width = 300;
            text.textAlign = 'center';
            canvas.add(text);
            canvas.setActiveObject(text);
            canvas.renderAll();
        }
    }, [canvas]);

    const [audioDetail, setAudioDetail] = useState<Voice | null>(null);

    const stepOneCompeted = useMemo(() => {
        return selectedAvatar != null && audioDetail != null && selectedAvatar.voiceId == audioDetail.voice_id
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
                    <AvatarGallery selectedAvatar={selectedAvatar} personalTalkingPhotos={personalTalkingPhotos} handleChangeAvatar={handleChangeAvatar} />
                </div>
                {selectedAvatar ?
                    <div className="grow bg-gray-50 rounded-lg p-4 h-full flex flex-col justify-between">
                        <div className="flex grow overflow-x-auto">
                            {replaceAvatarModel ? <div className="w-1/4 flex flex-col h-full max-h-full overflow-auto relative ">
                                <AvatarGallery selectedAvatar={selectedAvatar} personalTalkingPhotos={personalTalkingPhotos} handleChangeAvatar={handleChangeAvatar} />
                            </div>
                                : <div className="px-4 flex flex-col w-1/4">
                                    <p className="text-2xl font-bold">{selectedAvatar.talking_photo_name}</p>
                                    <div className="flex flex-col gap-4 mt-5 pe-4 grow overflow-y-auto">
                                        <div className="relative">
                                            {fetchingImage ? <div className="bg-gray-300 animate-pulse w-full h-96 rounded-lg"></div> : <div className="relative w-full h-96">
                                                <Image
                                                    className="rounded-md cursor-pointer object-cover"
                                                    src={selectedAvatar.preview_image_url}
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
                                                <input
                                                    type="file"
                                                    onChange={handleImageUpload}
                                                    id="file-upload"
                                                    className="hidden"
                                                />
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
                                                            <Image
                                                                className="rounded-md cursor-pointer object-cover"
                                                                src={data.image}
                                                                onClick={(e: React.MouseEvent<HTMLImageElement>) => handleSetBackground((e.target as HTMLImageElement).src)}
                                                                alt="background"
                                                                layout="fill"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="label">Add a text box</label>
                                            <TextBox handleText={handleText} canvas={canvas} />
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
