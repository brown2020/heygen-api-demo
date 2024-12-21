import { getFileUrl } from "@/actions/getFileUrl";
import { resizeImage } from "@/utils/resizeImage";
import { useAuthStore } from "@/zustand/useAuthStore";
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import { storage } from "@/firebase/firebaseClient";
import { ref, uploadBytes } from "firebase/storage";
import { CloudUpload } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface CreateAvatarCardProps {
    handleClose: () => void;
    create?: boolean;
}

export default function CreateAvatarCard({ handleClose, create = true }: CreateAvatarCardProps) {
    const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [stepCompleted, setStepCompleted] = useState([
        { step: 1, completed: false },
        { step: 2, completed: false },
        { step: 3, completed: false },
    ]);
    const uid = useAuthStore((state) => state.uid);
    const [avatarId, setAvatarId] = useState<string>("");

    const MAX_FILE_SIZE_MB = 2;
    const VALID_IMAGE_TYPES = ["image/png", "image/jpg", "image/jpeg", "image/webp"];

    useEffect(() => {
        if (create) {
            const _avatarId = `new-${Date.now()}`;
            setAvatarId(_avatarId);
        }
    }, [create]);

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
            await handleUploadImage(e.target.files);
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
            await handleUploadImage(e.dataTransfer.files);
        }
        setIsLoading(false);
    };

    const handleUploadImage = async (files: FileList) => {
        setIsLoading(true);
        const file = files[0];
        const validationError = validateFile(file);

        if (validationError) {
            toast.error(validationError);
            setIsLoading(false);
            return;
        }

        const id = avatarId;
        const resizedImage = await resizeImage(file);
        const filePath = `images/${uid}/${id}/${file.name}`;
        const storageRef = ref(storage, filePath);

        await uploadBytes(storageRef, resizedImage);

        const url = await getFileUrl(filePath)
        setAvatarPhoto(url);
        completedStep(1);
        setIsLoading(false);
    }

    const completedStep = (number: number) => {
        setStepCompleted((prevStepCompleted) => {
            return prevStepCompleted.map((step, index) => 
                index === number - 1 ? { ...step, completed: true } : step
            );
        });
    }

    const handleNextStep = () => {
        setCurrentStep((prevStep) => (prevStep < 3 ? prevStep + 1 : prevStep));
    };

    const renderStepContent = () => {
        if (currentStep === 1) {
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
        } else if (currentStep === 2) {
            return avatarPhoto ? (
                <div className="text-center">
                    <h3 className="text-lg font-semibold">Uploaded Photo</h3>
                    <img src={avatarPhoto} alt="Avatar Preview" className="w-24 h-24 rounded-full mx-auto mt-4" />
                    <p className="text-sm mt-2 text-gray-600">If this looks good, proceed to the next step.</p>
                </div>
            ) : (
                <p className="text-center text-gray-600">No photo uploaded yet.</p>
            );
        } else if (currentStep === 3) {
            return (
                <div className="text-center">
                    <h3 className="text-lg font-semibold">Ready to Save Your Avatar</h3>
                    <p className="text-sm text-gray-600 mt-2">Click Close to finish the process.</p>
                </div>
            );
        }
    };

    return (
        <ModalContent>
            <ModalHeader className="flex flex-col gap-2">
                <h2 className="text-xl md:text-xl font-semibold">
                    {currentStep === 1
                        ? "Upload Photos of Your Avatar"
                        : currentStep === 2
                            ? "Review Uploads"
                            : "Save Avatar"}
                </h2>
                <div className="text-xs text-gray-600 font-light">
                    {currentStep === 1
                        ? "Upload photos to create multiple looks for your avatar."
                        : currentStep === 2
                            ? "Review the uploaded photos and finalize your avatar look."
                            : "Save your avatar to use it in different applications."}
                </div>
            </ModalHeader>

            <ModalBody>{renderStepContent()}</ModalBody>

            <ModalFooter className="flex justify-between gap-4 mt-4 md:mt-6">
                {currentStep == 1 ? (
                    <button
                        className="font-medium py-2 px-7 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
                        onClick={() => handleClose()}
                    >
                        Close
                    </button>) : (
                    <button
                        className="font-medium py-2 px-7 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
                        onClick={() => setCurrentStep(1)}
                    >
                        Back
                    </button>
                )
                }
                {currentStep < 3 && (
                    <button
                    disabled={ !stepCompleted[currentStep - 1].completed }
                        className={`font-medium ${!stepCompleted[currentStep - 1].completed && 'opacity-40'} py-2 px-7 rounded-xl bg-gray-300 hover:bg-gray-400 transition`}
                        onClick={handleNextStep}
                    >
                        Next
                    </button>
                )}
            </ModalFooter>
        </ModalContent>
    );
}
