import React from 'react';
import Image from 'next/image';
import { AvatarGroup, AvatarLook } from '@/types/heygen';
import { ChevronLeft } from 'lucide-react';

interface AvatarGalleryProps {
  selectedAvatar: AvatarLook | null;
  personalTalkingPhotos: AvatarGroup[];
  handleChangeAvatar: (avatar: AvatarLook) => void;
  handleChangeAvatarGroup: (selectedAvatarGroup: AvatarGroup | null) => void,
  selectedAvatarGroup: AvatarGroup | null;
  avatarLooks: AvatarLook[];
}

const AvatarGallery: React.FC<AvatarGalleryProps> = ({
  personalTalkingPhotos, handleChangeAvatar, handleChangeAvatarGroup, selectedAvatarGroup, avatarLooks
}) => {

  return (
    < >
      {
        selectedAvatarGroup ? <div className='h-full flex flex-col gap-2'>
          <div>
            <button onClick={() => handleChangeAvatarGroup(null)} className='inline-flex'><ChevronLeft /> See All</button>
            <br />
            <div className='inline-flex items-center gap-3'>
              {selectedAvatarGroup.preview_image_url && <Image className='object-cover rounded-full h-16 w-16 border shadow-md' height={100} width={100} src={selectedAvatarGroup.preview_image_url} alt={selectedAvatarGroup.name} />}
              <h2 className='text-2xl font-bold'>
                {selectedAvatarGroup.name}
              </h2>
            </div>
          </div>
          <div className='grow border overflow-hidden'>
            <div className='max-h-full overflow-auto'>
              <ul className="w-full grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
                {
                  avatarLooks.map((look, index) => {
                    return (
                      <article
                        key={index}
                        onClick={() => handleChangeAvatar(look)}
                        className={`group/avatar relative border-transparent border-2 hover:border-gray-300 hover:drop-shadow-2xl transition-all cursor-pointer ease-in-out duration-300 isolate flex flex-col justify-end overflow-hidden rounded-2xl px-6 pb-6 pt-10 lg:pt-16 xl:pt-20 2xl:pt-32 mx-auto w-full`}
                      >
                        {look.image_url && (
                          <Image
                            src={look.image_url}
                            alt={look.name}
                            width={512}
                            height={512}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/0"></div>
                        <h3 className="z-10 mt-3 text-xl font-bold text-white transition duration-300">{look.name}</h3>
                      </article>
                    )
                  })
                }
              </ul>
            </div>
          </div>
        </div> :
          <ul className="w-full grid gap-4 grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
            {personalTalkingPhotos.map((avatar, index) => (
              <article
                key={index}
                onClick={() => handleChangeAvatarGroup(avatar)}
                className="group/avatar relative border-transparent border-2 hover:border-gray-300 hover:drop-shadow-2xl transition-all cursor-pointer ease-in-out duration-300 isolate flex flex-col justify-end overflow-hidden rounded-2xl px-6 pb-6 pt-10 lg:pt-16 xl:pt-20 2xl:pt-32 mx-auto w-full"
              >
                {avatar.preview_image_url && (
                  <Image
                    src={avatar.preview_image_url}
                    alt={avatar.name}
                    width={512}
                    height={512}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/0"></div>
                <h3 className="z-10 mt-3 text-xl font-bold text-white transition duration-300">{avatar.name}</h3>
              </article>
            ))}
          </ul>
      }
    </>
  );
};

export default AvatarGallery;
