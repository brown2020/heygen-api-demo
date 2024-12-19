import { AvatarLook } from "@/types/heygen";
import { Image } from "@nextui-org/image";
import { useEffect, useMemo } from "react";

export default function AvatarLookPreview({ avatarLook }: { avatarLook: AvatarLook }) {
    const avatarPreview = useMemo(() => {
        if(avatarLook.video_url){
            return <video className="w-full" controls>
            <source src={avatarLook.video_url} type="video/mp4" />
        </video>
        }else if(avatarLook.motion_preview_url){
            return <video className="w-full" controls>
            <source src={avatarLook.motion_preview_url} type="video/mp4" />
        </video>
        }
        return <Image className="h-[50vh] max-w-full text-center" src={avatarLook.image_url} />
    }, [avatarLook])

    useEffect(() => {
        console.log("avatarLook", avatarLook);
        
    }, [avatarLook])

    return <div className="h-[50vh] w-full flex flex-col justify-center">
        <span>{avatarLook.id}</span>
        {
            avatarPreview
        }
    </div>
}