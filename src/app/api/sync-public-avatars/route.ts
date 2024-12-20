import { NextRequest, NextResponse } from "next/server";
import { getHeygenAvatarGroups } from "@/actions/getHeygenAvatarGroups";
import { syncPublicAvatarGroups } from "@/actions/syncPublicAvatarGroups";
import { getHeygenAvatarGroupLooks } from "@/actions/getHeygenAvatarGroupLooks";
import { syncAvatarGroupLooks } from "@/actions/syncAvatarGroupLooks";
import { adminDb } from "@/firebase/firebaseAdmin";
import { AVATAR_GROUP_COLLECTION, AVATAR_NOT_FOUND_GROUP_COLLECTION } from "@/libs/constants";

export const POST = async (
    req: NextRequest
) => {
    try {

        const { apiKey } = await req.json();

        if (!apiKey) {
            return new Response("Missing API Key", { status: 400 });
        }

        const avatarGroupList = await getHeygenAvatarGroups(apiKey);

        if (!avatarGroupList.status) {
            return new Response(avatarGroupList.error, { status: 400 });
        }

        // Get not found avatars group list
        const notFoundAvatarGroupsSnapshot = await adminDb.collection(AVATAR_NOT_FOUND_GROUP_COLLECTION).get();
        const notFoundAvatarGroupsIds = notFoundAvatarGroupsSnapshot.docs.map(doc => doc.id);

        // Create get only public groups & remove not found avatars
        const publicGroups = avatarGroupList.data.data.avatar_group_list
            .filter(group => group.group_type.toLowerCase().includes("public"))
            .filter(group => !notFoundAvatarGroupsIds.includes(group.id));

        // Sync group with database
        const syncResponse = await syncPublicAvatarGroups(publicGroups);

        const notFoundAvatars: string[] = [];
        if (syncResponse.withoutImageAvatarGroupIds.length > 0) {
            for (const newGroupId of syncResponse.withoutImageAvatarGroupIds) {
                const avatarGroup = publicGroups.find(group => group.id === newGroupId);
                if (avatarGroup) {
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
                        return new Response(avatarGroupLooks.error, { status: 400 });
                    }

                    const syncResponse = await syncAvatarGroupLooks(newGroupId, avatarGroupLooks.data.data.avatar_list);
                    if (!syncResponse.status) {
                        return new Response("Error syncing avatar group looks", { status: 400 });
                    }
                }
            }

            // Remove not found avatar group from avatar group collection if exist
            if(notFoundAvatars.length> 0){
                const batch = adminDb.batch();
                // Get avatar groups with selected not found group ids
                const avatarGroupsSnapshot = await adminDb.collection(AVATAR_GROUP_COLLECTION).where('id', 'in', notFoundAvatars).get();
                avatarGroupsSnapshot.docs.forEach(async (doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            }

        }

        return NextResponse.json({
            message: "Sync Public Avatar Detail Successfully.", data: {
                notFoundAvatars
            }
        }, { status: 200 });
    } catch (error) {
        console.log("Error syncing public avatar groups:", error);
        return NextResponse.json({ message: "Something went wrong." }, { status: 200 });
    }
};
