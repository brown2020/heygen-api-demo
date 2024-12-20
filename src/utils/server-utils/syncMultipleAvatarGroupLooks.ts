import { getHeygenAvatarGroupLooks } from "@/actions/getHeygenAvatarGroupLooks";
import { adminDb } from "@/firebase/firebaseAdmin";
import { AVATAR_NOT_FOUND_GROUP_COLLECTION } from "@/libs/constants";
import { HeyGenAvatarGroup, HeyGenFailResponse } from "@/types/heygen";
import { syncAvatarGroupLooks } from "./syncAvatarGroupLooks";

interface SyncMultipleAvatarGroupLooksResponse {
    status: true;
    notFoundAvatars: string[];
}

export async function syncMultipleAvatarGroupLooks(apiKey: string, heygenAvatarGroups: HeyGenAvatarGroup[], notFoundAvatarGroupsIds: string[]): Promise<SyncMultipleAvatarGroupLooksResponse | HeyGenFailResponse> {
    const notFoundAvatars: string[] = [];
    for (const key in heygenAvatarGroups) {
        const avatarGroup = heygenAvatarGroups[key];
        const newGroupId = avatarGroup.id;
        const avatarGroupLooks = await getHeygenAvatarGroupLooks(apiKey, newGroupId);
        if (!avatarGroupLooks.status && "apiStatusCode" in avatarGroupLooks && avatarGroupLooks.apiStatusCode === 404) {

            // If avatar look not found 
            // Add this avatar group to not found list if not exist in list
            if (!notFoundAvatarGroupsIds.includes(newGroupId)) {
                await adminDb.collection(AVATAR_NOT_FOUND_GROUP_COLLECTION).doc(newGroupId).set({
                    id: newGroupId,
                    name: avatarGroup.name,
                    created_at: avatarGroup.created_at,
                    group_type: avatarGroup.group_type,
                });
            }

            notFoundAvatars.push(newGroupId);
            continue;
        } else if (!avatarGroupLooks.status) {
            return avatarGroupLooks;
        }

        const syncResponse = await syncAvatarGroupLooks(newGroupId, avatarGroupLooks.data.data.avatar_list);
        if (!syncResponse.status) {
            return syncResponse;
        }
    }
    return { status: true, notFoundAvatars };
}