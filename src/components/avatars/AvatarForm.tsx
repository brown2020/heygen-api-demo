'use client';
import { AvatarGroup, AvatarLook } from "@/types/heygen";
import { useAuthStore } from "@/zustand/useAuthStore";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAudio } from "@/hooks/useAudio";
import { Voice } from "elevenlabs/api";
import { Card, CardBody, CardFooter } from "@nextui-org/card";
import { Image as NextUIImage } from "@nextui-org/image";
import { ModalBody, ModalContent, ModalFooter, ModalHeader } from "@nextui-org/modal";
import AvatarLookPreview from "./AvatarLookPreview";


export default function AvatarForm({ avatarDetail, submit, avatarLooks }: {
    submit: (val: { status: boolean }) => void,
    avatarDetail: AvatarGroup,
    avatarLooks: AvatarLook[],
}) {
    const { audioList: options } = useAudio();
    const [, setAudioOptions] = useState<Voice[]>(options);
    const [selectedLook, setSelectedLook] = useState<AvatarLook | null>(null);

    useEffect(() => {
        setAudioOptions(options);
    }, [options])

    const close = () => {
        submit({ status: false });
    }

    return <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
            <div>
            <span>{avatarDetail.name}</span> <span className="float-right pr-4 font-light">{avatarDetail.id}</span>
            </div>
        </ModalHeader>
        <ModalBody className="">
            <div className="flex justify-center flex-col items-center">
                <div className="w-full bg-white transform px-4 pb-4 pt-5 sm:p-4 sm:pb-4 rounded-lg transition-all">
                    <div className="flex xs:gap-5 max-xs:flex-col">
                        {
                            !selectedLook &&
                            <div className="gap-2 grid grid-cols-2 sm:grid-cols-4 w-full">
                                {
                                    avatarLooks.map((look, index) => <Card key={index} isPressable shadow="none" radius="none" onPress={() => { setSelectedLook(look) }}>
                                        <CardBody className="p-0 rounded-lg border-1 shadow-lg"  >
                                            <NextUIImage
                                                alt={look.name}
                                                className="w-full object-contain h-[140px]"
                                                radius="lg"
                                                src={look.image_url}
                                                width="100%"
                                            />
                                        </CardBody>
                                        <CardFooter className="text-small text-gray-500">
                                            <b>{look.name}</b>
                                        </CardFooter>
                                    </Card>)
                                }
                            </div>
                        }
                        {selectedLook && <AvatarLookPreview avatarLook={selectedLook} />}

                    </div>
                </div>
            </div>
        </ModalBody>
        <ModalFooter>
            {!selectedLook && <button onClick={close} color="danger">Close</button>}
            {selectedLook && <button onClick={() => { setSelectedLook(null) }} color="danger">Go Back</button>}
        </ModalFooter>

    </ModalContent>

}