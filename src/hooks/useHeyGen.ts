"use client";
import { fetchPersonalAvatarGroups } from "@/actions/fetchPersonalAvatarGroups";
import { uploadTalkingPhoto } from "@/actions/uploadTalkingPhoto";
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


    const uploadPhoto = useCallback(async (base64File: string, fileName: string) => {
        if (isUploading || !_profile.heygen_api_key) return { status: false };

        setIsUploading(true);
        const response = await uploadTalkingPhoto(_profile.heygen_api_key, base64File, fileName);
        if ("error" in response) {
            if ("displayMessage" in response && response.displayMessage) toast.error(response.displayMessage);
            setIsUploading(false);
            return { status: false }
        } else {
            toast.success("Photo uploaded successfully");
            await fetchAvatarGroupsFromHeygen(response.data.talking_photo_id);
            setIsUploading(false);
            return { status: true }
        }

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