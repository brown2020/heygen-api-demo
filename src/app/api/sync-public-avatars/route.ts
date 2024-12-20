import { NextRequest, NextResponse } from "next/server";
import { getHeygenAvatarGroups } from "@/actions/getHeygenAvatarGroups";
import { syncAvatarGroups } from "@/utils/server-utils/syncAvatarGroups";
import { adminDb } from "@/firebase/firebaseAdmin";
import { AVATAR_GROUP_COLLECTION, AVATAR_NOT_FOUND_GROUP_COLLECTION } from "@/libs/constants";
import { syncMultipleAvatarGroupLooks } from "@/utils/server-utils/syncMultipleAvatarGroupLooks";

export const POST = async (
    req: NextRequest
) => {
    try {

        const { apiKey } = await req.json();

        if (!apiKey) {
            return new Response("Missing API Key", { status: 400 });
        }

        const avatarGroupList = await getHeygenAvatarGroups(apiKey, "true");

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
        const syncResponse = await syncAvatarGroups(publicGroups, {type: "public", owner: null});

        let notFoundAvatars: string[] = [];
        if (syncResponse.withoutImageAvatarGroupIds.length > 0) {
            const withoutImageAvatarGroups = publicGroups.filter(group => syncResponse.withoutImageAvatarGroupIds.includes(group.id));
            const syncMultipleAvatarGroupLooksResponse = await syncMultipleAvatarGroupLooks(apiKey, withoutImageAvatarGroups, notFoundAvatarGroupsIds);
            if(!syncMultipleAvatarGroupLooksResponse.status){
                return new Response("Error syncing multiple avatar group looks", { status: 400 });
            }

            notFoundAvatars = syncMultipleAvatarGroupLooksResponse.notFoundAvatars;

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
