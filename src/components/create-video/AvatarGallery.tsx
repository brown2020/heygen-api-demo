import React from 'react';
import Image from 'next/image';
import { DIDTalkingPhoto } from '@/types/did';

interface AvatarGalleryProps {
  selectedAvatar: DIDTalkingPhoto | null;
  personalTalkingPhotos: DIDTalkingPhoto[];
  handleChangeAvatar: (avatar: DIDTalkingPhoto) => void;
}

const AvatarGallery: React.FC<AvatarGalleryProps> = ({ personalTalkingPhotos, handleChangeAvatar}) => {
  return (
      <ul className="w-full grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
        {personalTalkingPhotos.map((avatar, index) => (
          <article
            key={index}
            onClick={() => handleChangeAvatar(avatar)}
            className="group/avatar relative border-transparent border-2 hover:border-gray-300 hover:drop-shadow-2xl transition-all cursor-pointer ease-in-out duration-300 isolate flex flex-col justify-end overflow-hidden rounded-2xl px-6 pb-6 pt-10 lg:pt-16 xl:pt-20 2xl:pt-32 mx-auto w-full"
          >
            {avatar.preview_image_url && (
              <Image
                src={avatar.preview_image_url}
                alt={avatar.talking_photo_name}
                width={512}
                height={512}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/0"></div>
            <h3 className="z-10 mt-3 text-xl font-bold text-white transition duration-300">{avatar.talking_photo_name}</h3>
          </article>
        ))}
      </ul>
  );
};

export default AvatarGallery;
