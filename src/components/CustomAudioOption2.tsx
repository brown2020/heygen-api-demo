import React from 'react';
import { FlagIcon } from '../utils/FlagIcon';
import { Languages } from '../utils/Languages';
import { Voice } from 'elevenlabs/api';

const CustomAudioOption2 = ({ data }: { data: Voice }) => {

    const flagIcon = (accent: string) => {
        return FlagIcon.find(f => f.accent.toLowerCase() === accent.toLowerCase());
    }

    const language = (code: string) => {
        return Languages.find(lang => lang.code === code) || { name: 'Unknown Language' };
    };

    return (
        <div className="p-2">
            <div className="p-2 border rounded-md cursor-pointer">
                <span className="flex items-center gap-2">
                    {data.labels?.gender === 'male' ? (
                        <div className="opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 14 14">
                                <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M13.18 13.5a6.49 6.49 0 0 0-12.36 0z" /><path d="M7 9A4.232 4.232 0 1 0 7 .536A4.232 4.232 0 0 0 7 9" />
                                    <path d="M8.382 6.405s-.351.691-1.382.691s-1.382-.69-1.382-.69m5.537-2.444h-.028a4.12 4.12 0 0 1-3.09-1.392a4.12 4.12 0 0 1-3.091 1.392a4.1 4.1 0 0 1-1.973-.5a4.234 4.234 0 0 1 8.182.5" /></g>
                            </svg>
                        </div>
                    ) : data.labels?.gender === 'female' ? (
                        <div className="opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 512">
                                <path fill="currentColor" d="m403.6 343.656l-72.823-47.334L344.043 272h23.428a48 48 0 0 0 44.119-66.908L361.581 90.57a112.029 112.029 0 0 0-211.162 0L100.41 205.092A48 48 0 0 0 144.529 272h23.428l13.266 24.322l-72.823 47.334A79.72 79.72 0 0 0 72 410.732V496h368v-85.268a79.73 79.73 0 0 0-36.4-67.076M408 464H104v-53.268a47.84 47.84 0 0 1 21.841-40.246l97.66-63.479L186.953 240h-42.424a16 16 0 0 1-14.72-22.27l50.172-114.9l.448-1.143a80.029 80.029 0 0 1 151.142 0l.2.58l50.42 115.463a16 16 0 0 1-14.72 22.27h-42.424L288.5 307.007l97.661 63.479A47.84 47.84 0 0 1 408 410.732Z" />
                            </svg>
                        </div>
                    ) : null}
                    <p className='truncate font-medium'>
                        {data.name}
                    </p>
                </span>
                <div className="flex items-center gap-2">
                    {data.labels?.accent && flagIcon(data.labels?.accent)?.icon.src ? <div>
                        <img src={flagIcon(data.labels?.accent)?.icon.src} width={20} height={20} alt="Flag" />
                    </div> : <></>}
                    <span className="text-neutral-600 text-sm">
                        {data.fine_tuning?.language && language(data.fine_tuning?.language.toString()).name} ( {data.labels?.accent} )
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CustomAudioOption2;
