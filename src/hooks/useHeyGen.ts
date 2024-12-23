"use client";
import { fetchPersonalAvatarGroups } from "@/actions/fetchPersonalAvatarGroups";
import { uploadTalkingPhoto } from "@/actions/uploadTalkingPhoto";
import { HeyGenService } from "@/libs/HeyGenService";
import useProfileStore from "@/zustand/useProfileStore";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";

export const useHeyGen = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [isFetchingAvatarGroupsFromHeygen, setIsFetchingAvatarGroupsFromHeygen] = useState(false);

    const profile = useProfileStore((state) => state.profile);
    const updateProfile = useProfileStore((state) => state.updateProfile);
    const updateHeyGenApiKeyCode = useProfileStore((state) => state.updateHeyGenApiKeyCode);

    const _profile = useMemo(() => {
        return profile ? {
            heygen_api_key: profile.heygen_api_key,
        } : {
            heygen_api_key: "",
        }
    }, [profile]);


    const uploadPhoto = useCallback(async (base64File: string) => {
        if (isUploading || !_profile.heygen_api_key) return;

        setIsUploading(true);
        const response = await uploadTalkingPhoto(_profile.heygen_api_key, base64File);
        if ("error" in response) {
            if ("displayMessage" in response && response.displayMessage) toast.error(response.displayMessage);
        } else {
            toast.success("Photo uploaded successfully");
        }

        setIsUploading(false);

    }, [isUploading, _profile]);

    const fetchAvatarGroupsFromHeygen = useCallback(async (avatarGroupID: string | null = null) => {
        if (isFetchingAvatarGroupsFromHeygen || !_profile.heygen_api_key) return;

        toast.promise(new Promise(async (resolve, rejects) => {
            setIsFetchingAvatarGroupsFromHeygen(true);
            updateProfile({ heygen_key_updated: false });
            const response = await fetchPersonalAvatarGroups(_profile.heygen_api_key, avatarGroupID);
            if (!response.status) {
                if (response.apiStatusCode == 401) {
                    updateHeyGenApiKeyCode('unauth-401')
                }
                rejects(false)
            } else {
                updateHeyGenApiKeyCode(null)
                resolve(true)
            }

            setIsFetchingAvatarGroupsFromHeygen(false);
        }), {
            loading: 'Fetching your avatars from Heygen...',
            success: 'Success',
            error: 'Error when fetching avatar list',
        });

    }, [_profile, isFetchingAvatarGroupsFromHeygen])

    return {
        isUploading,
        uploadTalkingPhoto: uploadPhoto,
        fetchAvatarGroupsFromHeygen,
        isFetchingAvatarGroupsFromHeygen
    }
}