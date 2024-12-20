"use server";

import { HeyGenFailResponse } from "@/types/heygen";
import { getHeygenAvatarGroups } from "./getHeygenAvatarGroups";
import { syncAvatarGroups } from "@/utils/server-utils/syncAvatarGroups";
import { auth } from "@clerk/nextjs/server";
import { syncMultipleAvatarGroupLooks } from "@/utils/server-utils/syncMultipleAvatarGroupLooks";
import { addErrorReport } from "./addErrorReport";

interface FetchPersonalAvatarGroupsResponse {
    status: true;
}

/**
 * Get list of personal avatars group from heygen
 * Avatar which are not public
 * Get list of avatar stored in collection
 * sync updated avatar list with collection recods
 * fetch looks for avatar groups
 * sync avatar group with collection records    
 * 
 * @param apiKey 
 */
export async function fetchPersonalAvatarGroups(apiKey: string): Promise<HeyGenFailResponse | FetchPersonalAvatarGroupsResponse> {
    const { userId } = await auth.protect();

    // Get list of personal avatars group from heygen
    const avatarGroupList = await getHeygenAvatarGroups(apiKey, "false");

    if (!avatarGroupList.status) {
        return avatarGroupList;
    }

    // Create get only non public groups
    const personalGroups = avatarGroupList.data.data.avatar_group_list
        .filter(group => !group.group_type.toLowerCase().includes("public"));


    // Sync list with avatar groups store in collection
    const syncResponse = await syncAvatarGroups(personalGroups, { type: "personal", owner: userId });
    
    const avatarGroupsIds = [...syncResponse.withoutImageAvatarGroupIds, ...syncResponse.newAvatarGroupIds];
    if(avatarGroupsIds.length > 0){
        const withoutImageAvatarGroups = personalGroups.filter(group => avatarGroupsIds.includes(group.id));
        
        // Sync avatar group looks
        const syncMultipleAvatarGroupLooksResponse = await syncMultipleAvatarGroupLooks(apiKey, withoutImageAvatarGroups, []);
        if(!syncMultipleAvatarGroupLooksResponse.status){
            return syncMultipleAvatarGroupLooksResponse;
        }

        if(syncMultipleAvatarGroupLooksResponse.notFoundAvatars.length > 0){
            // Send error report with userid, avatarGroupIds
            await addErrorReport("fetchPersonalAvatarGroups", {userId, avatarGroupId: syncMultipleAvatarGroupLooksResponse.notFoundAvatars.join(",")});
        }

    }


    return { status: true };
}
