"use client";
import { getFileUrl } from "@/actions/getFileUrl";
import { resizeImage } from "@/utils/resizeImage";
import { useAuthStore } from "@/zustand/useAuthStore";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { storage } from "@/firebase/firebaseClient";
import { ref, uploadBytes } from "firebase/storage";
import { CloudUpload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { HeyGenService } from "@/libs/HeyGenService";
import { useHeyGen } from "@/hooks/useHeyGen";

interface CreateAvatarCardProps {
    handleClose: () => void;
    create?: boolean;
}

export default function CreateAvatarCard({ handleClose, create = true }: CreateAvatarCardProps) {
    const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const uid = useAuthStore((state) => state.uid);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [UploadPreview, setUploadPreview] = useState("");
    const { isUploading, uploadTalkingPhoto } = useHeyGen();

    const MAX_FILE_SIZE_MB = 2;
    const VALID_IMAGE_TYPES = ["image/png", "image/jpg", "image/jpeg", "image/webp"];

    const validateFile = (file: File) => {
        if (!VALID_IMAGE_TYPES.includes(file.type)) {
            return `Invalid file type: ${file.type}. Accepted types are PNG, JPG, JPEG, or WebP.`;
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            return `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds ${MAX_FILE_SIZE_MB}MB limit.`;
        }
        return null;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            await handleChangeImage(e.target.files);
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            await handleChangeImage(e.dataTransfer.files);
        }
        setIsLoading(false);
    };

    const handleChangeImage = async (files: FileList) => {
        setIsLoading(true);
        const _file = files[0];
        const validationError = validateFile(_file);

        if (validationError) {
            toast.error(validationError);
            setIsLoading(false);
            return;
        }

        if (_file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                setUploadPreview(e.target?.result as string)
            };
            reader.readAsDataURL(_file);
            setFile(_file);
        }

        setIsLoading(false);
    }

    const renderStepContent = () => {
        if (file == null) {
            return (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex justify-center items-center h-48 border border-dashed border-gray-500 rounded-lg ${isDragging && 'bg-gray-200'}`}
                >
                    {
                        isLoading ? (
                            <div className="text-center space-y-2">
                                <div className="rounded-xl w-fit mx-auto p-2 border-gray-300 flex justify-center items-center animate-pulse">
                                    <CloudUpload size={34} className="text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-xs">Uploading...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-2">
                                <div className="border-2 rounded-xl w-fit mx-auto p-2 border-gray-300 flex justify-center items-center">
                                    <CloudUpload size={24} className="text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-xs">Drag and drop your photos here</p>
                                    <p className="text-xs text-gray-600">Upload PNG, JPG, or WebP file up to {MAX_FILE_SIZE_MB} MB</p>
                                </div>

                                <div className="h-full flex flex-col items-center space-y-3">
                                    <input type="file" id="files" className="hidden" onChange={handleFileChange} />
                                    <label
                                        htmlFor="files"
                                        className="font-medium px-5 py-2 text-sm text-gray-600 rounded-xl border border-gray-300 cursor-pointer hover:bg-gray-100 transition"
                                    >
                                        Select Photo
                                    </label>
                                </div>
                            </div>
                        )
                    }

                </div>
            );
        } else {
            return <div className="text-center">
                <h3 className="text-lg font-semibold">Uploaded Photo</h3>
                {
                    UploadPreview &&
                    <img src={UploadPreview} alt="Avatar Preview" className="max-w-full max-h-[40vh] mx-auto mt-4" />
                }
                <p className="text-sm mt-2 text-gray-600">If this looks good, proceed to the next step.</p>
            </div>
        }
    };

    const handleUploadImage = useCallback(async () => {
        if (!file || !UploadPreview) {
            toast.error("No file selected.");
            return;
        }

        const response = await uploadTalkingPhoto(UploadPreview);
        console.log(response);
        

    }, [file, UploadPreview])

    const handleCloseModal = useCallback(() => {
        if(isUploading) return;

        setFile(null);
        setUploadPreview("");
        handleClose();
    }, [isUploading])

    return (
        <Modal isOpen={create} size="sm" scrollBehavior="inside" onClose={() => handleCloseModal()}>
            <ModalContent>
                <ModalHeader className="flex flex-col gap-2">
                    <h2 className="text-xl md:text-xl font-semibold">
                        {file == null
                            ? "Upload Photos of Your Avatar"
                            : "Review Uploads"}
                    </h2>
                    <div className="text-xs text-gray-600 font-light">
                        {file == null
                            ? "Upload photos to create multiple looks for your avatar."
                            : "Review the uploaded photos and finalize your avatar look."}
                    </div>
                </ModalHeader>

                <ModalBody>{renderStepContent()}</ModalBody>

                <ModalFooter className="flex justify-between gap-4 mt-4 md:mt-6">

                    {file == null ? <button
                        className="font-medium py-2 px-7 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
                        onClick={() => handleCloseModal()}
                    >
                        Close
                    </button> : (
                        <>
                            <button
                                disabled={isUploading}
                                className={`font-medium py-2 px-7 disabled:cursor-not-allowed rounded-xl bg-gray-300 hover:bg-gray-400 transition`}
                                onClick={() => setFile(null)}
                            >
                               Change
                            </button>
                            <button
                                disabled={isUploading}
                                onClick={() => {handleUploadImage()}}
                                className={`font-medium py-2 px-7 rounded-xl disabled:cursor-not-allowed bg-orange-700 hover:bg-orange-600 text-white transition`}
                            >
                                Upload
                            </button>
                        </>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
