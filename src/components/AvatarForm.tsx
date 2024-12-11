'use client';
import { getFileUrl } from "@/actions/getFileUrl";
import { db, storage } from "@/firebase/firebaseClient";
import { AVATAR_TYPE_PERSONAL, DEFAULT_AUDIO, DOCUMENT_COLLECTION } from "@/libs/constants";
// import { AvatarValues, Tack } from "@/types/did";
import { TalkingPhoto, AvatarValues } from "@/types/heygen";
import { resizeImage } from "@/utils/resizeImage";
import { useAuthStore } from "@/zustand/useAuthStore";
import { ErrorMessage } from "@hookform/error-message";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";
import { Image as ImageIcon } from "lucide-react"
import Image from "next/image";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Select, { components, ControlProps } from 'react-select';
import CustomAudioOption from "./CustomAudioOption";
import { useAudio } from "@/hooks/useAudio";
import { Voice } from "elevenlabs/api";
import CustomAudioOption2 from "./CustomAudioOption2";

export default function AvatarForm({ submit, create, avatarDetail }: {
    create: boolean,
    submit: (val: { status: boolean, data: AvatarValues | null }) => void,
    avatarDetail: TalkingPhoto | null
}) {
    const { handleSubmit, control, formState, reset, watch, setValue, getValues } = useForm<AvatarValues>({ mode: 'all' });
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const { audioList: options, isFetching: fetchingAudio } = useAudio();
    const [audioOptions, setAudioOptions] = useState<Voice[]>(options);
    const onSubmit = handleSubmit((data) => {
        setProcessing(true);
        try {
            createNewTalkingPhoto().then(() => {
                setProcessing(false);
                submit({ status: true, data: data });
            });
        } catch (e) {
            /**
             * TODO: Handle error
             */
            console.log(e);
            setProcessing(false);
        }
    });
    const [processing, setProcessing] = useState<boolean>(false);
    const [avatarId, setAvatarId] = useState<string>('');
    const uid = useAuthStore((state) => state.uid);
    const [selectedGender, setSelectedGender] = useState<{ value: string, label: string }>({ value: 'all', label: 'All Voice' });
    const [selectedCountry, setSelectedCountry] = useState<{ value: string, label: string }>({ value: "all", label: "All Country" });

    useEffect(() => {
        setAudioOptions(options);
    }, [options])

    const genderOptions = [
        { value: 'all', label: 'All Voice' },
        { value: 'male', label: 'Male Voice' },
        { value: 'female', label: 'Female Voice' },
    ]

    const countryOptions = [
        { value: "all", label: "All Country" },
        ...new Map(
            options.map((audio) => [
                audio.labels?.accent.toLowerCase(),
                {
                    value: audio.labels?.accent.toLowerCase() || '',
                    label: audio.labels?.accent || '',
                },
            ]),
        ).values(),
    ];

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);

        const file = e.dataTransfer.files[0];
        setLoading(true);
        setProcessing(true);
        const id = avatarId;

        try {
            // Resize the image before uploading
            const resizedImage = await resizeImage(file);
            const filePath = `images/${uid}/${id}/${file.name}`;
            const storageRef = ref(storage, filePath);

            await uploadBytes(storageRef, resizedImage);
            const url = await getFileUrl(filePath);
            setValue('preview_image_url', url);
        } catch (error) {
            console.error('Error uploading file:', error);
        } finally {
            setLoading(false);
            setProcessing(false);
        }
    };

    useEffect(() => {
        if (create) {
            const _avatarId = `new-${Date.now()}`;
            reset({
                voiceId: DEFAULT_AUDIO,
                name: '',
                preview_image_url: '',
                talking_photo_id: _avatarId
            })
            setAvatarId(_avatarId)
        } else if (avatarDetail !== null) {
            reset({
                voiceId: avatarDetail.voiceId,
                name: avatarDetail.talking_photo_name,
                preview_image_url: avatarDetail.preview_image_url,
                talking_photo_id: avatarDetail.talking_photo_id
            })
            setAvatarId(avatarDetail.talking_photo_id)
        }
    }, [create, avatarDetail, reset])

    const voiceId = watch('voiceId');
    const previewImageUrl = watch('preview_image_url');
    const voiceDetail = useMemo(() => {
        return options.find((audio) => audio.voice_id === voiceId);
    }, [voiceId, options]);
    const voiceValue = useMemo(() => {
        return audioOptions.find((option) => option.voice_id === voiceId);
    }, [voiceId, audioOptions]);

    const createNewTalkingPhoto = async () => {
        const formValues = getValues();
        const newPhotoId = formValues.talking_photo_id;
        // Define the new talking photo object
        const newPhoto: TalkingPhoto = {
            talking_photo_id: formValues.talking_photo_id,
            talking_photo_name: formValues.name,
            preview_image_url: formValues.preview_image_url, // Placeholder URL or default image
            favorite_of: [],
            type: AVATAR_TYPE_PERSONAL,
            voiceId: formValues.voiceId,
            owner: uid
        };

        // Save the new talking photo to Firestore
        const docRef = doc(db, DOCUMENT_COLLECTION, newPhotoId);

        // Ensure the document is created only if it doesn't exist already
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            await setDoc(docRef, newPhoto, { merge: true });
        } else {
            await setDoc(docRef, newPhoto);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            const id = avatarId;

            // Resize the image before uploading
            const resizedImage = await resizeImage(file);
            const filePath = `images/${uid}/${id}/${file.name}`;
            const storageRef = ref(storage, filePath);

            await uploadBytes(storageRef, resizedImage);
            const url = await getFileUrl(filePath)

            setValue('preview_image_url', url);
        }
    };

    const cancelEdit = () => {
        submit({ status: false, data: null });
    }

    const deleteAvatar = async () => {
        try {
            const docRef = doc(db, DOCUMENT_COLLECTION, avatarId);
            await deleteDoc(docRef);
            submit({ status: true, data: null });
        } catch (e) {
            console.log(e);
        }
    }
    const customFilterOption = (option: { data: Voice }, input: string) => {

        if (input === '') return true;
        else {
            if (option.data.name?.toLowerCase().includes(input.toLowerCase())) {
                return true;
            } else if (option.data.labels?.accent?.toLowerCase().includes(input.toLowerCase())) {
                return true;
            } else if (option.data.fine_tuning?.language?.toLowerCase().includes(input.toLowerCase())) {
                return true;
            }
        }
        return false;
    };

    const applyFilters = (gender: string, country: string) => {
        let filteredOptions = options;

        if (gender !== 'all') {
            filteredOptions = filteredOptions.filter(
                (audio) => audio.labels?.gender?.toLowerCase() === gender.toLowerCase()
            );
        }

        if (country !== 'all') {
            filteredOptions = filteredOptions.filter(
                (audio) => audio.labels?.accent?.toLowerCase() === country.toLowerCase()
            );
        }

        setAudioOptions(filteredOptions);
    };

    const customGenderFilterOption = (e: { value: string; label: string }) => {
        const gender = e.value;
        setSelectedGender(e);
        applyFilters(gender, selectedCountry.value);
    };

    const customCountryFilterOption = (e: { value: string; label: string }) => {
        const country = e.value;
        setSelectedCountry(e);
        applyFilters(selectedGender.value, country);
    };

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    return <div className="h-screen w-full p-4">
        <div className="h-full w-full flex justify-center flex-col items-center">
            <div className="w-[700px] max-sm:w-full my-[3px] max-sm:mx-5 mx-auto bg-white transform px-4 pb-4 pt-5 sm:p-4 sm:pb-4 rounded-lg shadow-xl transition-all sm:my-8">
                <div className="flex xs:gap-5 max-xs:flex-col h-full w-full">
                    <div className="h-full relative max-xs:w-full w-2/4">
                        <div className="relative h-full min-h-56 w-full bg-white rounded-md border border-dashed border-gray-400">
                            <div className={`${!previewImageUrl && 'hidden'}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {/* {previewImageUrl} */}
                                {previewImageUrl && <Image
                                    src={previewImageUrl}
                                    alt="Avatar Image"
                                    width={512}
                                    height={512}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />}
                                <button onClick={() => { if (fileInputRef.current) fileInputRef.current.click() }} className="absolute bg-white text-gray-500 p-2 rounded-full bottom-3 right-3 shadow-lg">
                                    <ImageIcon size={20} />
                                </button>
                            </div>
                            <label onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`flex text-center p-2 h-full ${previewImageUrl && 'hidden'}`} htmlFor="avatar_image">
                                <input ref={fileInputRef} onChange={handleImageUpload} type="file" id="avatar_image" name="avatar_image" className="hidden" />
                                <div className="self-center">
                                    <ImageIcon size={45} className="text-gray-500 m-auto" />
                                    <p className="text-xs">Drop your image here, or Browse</p>
                                </div>
                            </label>
                        </div>
                        {loading &&
                            <div className="backdrop-blur-sm absolute border top-0 h-full w-full rounded-md border-dashed border-gray-400 z-20 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full animate-spin border-2 border-white border-dashed border-t-transparent"></div>
                            </div>
                        }
                        {dragging &&
                            <div className="bg-black opacity-40 absolute border top-0 h-full w-full rounded-md border-dashed border-gray-400 z-20 flex items-center justify-center">
                            </div>
                        }
                    </div>
                    <div className="h-full w-full">
                        <form onSubmit={onSubmit} className="w-full h-full">
                            <div className="bg-white w-full h-full">
                                <div>
                                    <h3 className="text-xl max-xs:hidden font-semibold leading-6 text-gray-900" id="modal-title">{create ? 'Create' : 'Edit'} Avatar</h3>
                                    <div className="w-full xs:mt-4 max-xs:mt-2 xs:mb-5 max-xs:mb-2">
                                        <label className="block xs:mb-2 font-medium max-xs:mb-1 text-sm text-slate-600">
                                            Avatar Name
                                        </label>
                                        <Controller
                                            control={control}
                                            name="name"
                                            rules={{
                                                required: { message: 'Required.', value: true },
                                                minLength: { value: 3, message: "Too short name." },
                                                maxLength: { value: 50, message: "Too long name." }
                                            }}
                                            render={() => (
                                                <input className="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md px-3 py-2 transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow" placeholder="Type name..." />
                                            )}
                                        />
                                        <p className="text-red-500 text-sm"><ErrorMessage errors={formState.errors} name="name" /></p>
                                    </div>
                                    <div className="flex flex-col gap-2 max-xs:gap-1">
                                        <label className="block text-sm font-medium text-slate-600">
                                            Audio
                                        </label>
                                        <div className="flex gap-4">
                                            <div className="flex-1 xs:mb-2">
                                                <Select
                                                    value={selectedGender}
                                                    onChange={(e) => customGenderFilterOption(e as { value: string; label: string })}
                                                    options={genderOptions}
                                                    placeholder="Select Gender"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <Select
                                                    value={selectedCountry}
                                                    onChange={(e) => customCountryFilterOption(e as { value: string; label: string })}
                                                    options={countryOptions}
                                                    placeholder="Select Language"
                                                />
                                            </div>
                                        </div>
                                        <Controller
                                            control={control}
                                            name="voiceId"
                                            render={({ field }) => (
                                                !fetchingAudio ?
                                                    <Select
                                                        value={voiceValue}
                                                        onChange={(e) => { setValue('voiceId', (e as Voice)?.voice_id); field.onBlur(); }}
                                                        options={audioOptions}
                                                        filterOption={customFilterOption}
                                                        components={{
                                                            Option: CustomAudioOption, Control: ({ children, ...props }: ControlProps<Voice, false>) => {
                                                                return (
                                                                    <components.Control {...props}>
                                                                        {voiceValue ? <CustomAudioOption2 data={voiceValue} /> : <></>}
                                                                        {children}
                                                                    </components.Control>
                                                                );
                                                            }
                                                        }}
                                                    /> : <span>Fetching...</span>
                                            )}
                                        />

                                        {
                                            voiceDetail ?
                                                <audio controls key={voiceDetail.voice_id} className="xs:mt-2 max-xs:w-full bg-gray-100 rounded-full shadow-lg">
                                                    <source src={voiceDetail.preview_url} type="audio/mpeg" />
                                                    Your browser does not support the audio element.
                                                </audio> : <Fragment />
                                        }
                                    </div>
                                </div>
                                <div className="bg-gray-50 flex justify-between w-full gap-2 mt-5">
                                    {!create &&
                                        <button disabled={processing} onClick={deleteAvatar} type="button" className="disabled:cursor-not-allowed disabled:opacity-50 bg-red-600 w-full justify-center rounded-md  py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300 text-white hover:bg-red-400">
                                            Delete
                                        </button>
                                    }
                                    <button disabled={processing} onClick={cancelEdit} type="button" className="disabled:cursor-not-allowed disabled:opacity-50 w-full justify-center rounded-md bg-white py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={processing} className="disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-md bg-sky-600 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500">
                                        {create ? 'Add' : 'Update'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
}