import CreateVideo from "@/components/create-video/CreateVideo";
import HeyGenWrapper from "@/components/wrappers/HeyGenWrapper";

export default function CreateVideoPage() {
    return <HeyGenWrapper>
        <CreateVideo
        video_id={null} 
        />
    </HeyGenWrapper>
}