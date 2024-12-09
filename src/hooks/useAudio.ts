import { findAudio } from "@/actions/findAudio";
import useProfileStore from "@/zustand/useProfileStore";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export const useAudio = () => {
    const {profile, voices, fetchVoices } = useProfileStore();

    const [isFetching, setIsFetching] = useState(false);

    const voiceList = useMemo(() => {
        return voices == null ? [] : voices;
    }, [voices])

    const findVoice = async (voiceId: string) => {
        // Check voice list already have voice
        // If not, then fetch voice 
        const voice = voiceList.find((v) => v.voice_id === voiceId);
        if (voice) { return { status: true, voice }; }
        else {
            setIsFetching(true);
            const voice = await findAudio(profile.elevenlabs_api_key, voiceId)
            if (voice.status) {
                return { status: true, voice: voice.voice }
            }
            if ("error" in voice && voice.error) {
                toast.error(voice.error);
            } else {

            }

            setIsFetching(false);
        }

        return { status: false }
    }

    const loadAudioList = useCallback(async () => {
        if (profile.elevenlabs_api_key !== null) {
            setIsFetching(true);
            await fetchVoices();
            setIsFetching(false);
        }
    }, [profile.elevenlabs_api_key])

    useEffect(() => {
        if (profile.elevenlabs_api_key !== null)
            loadAudioList()
    }, [profile, loadAudioList])

    return {
        audioList: voiceList,
        isFetching,
        findVoice
    }
}