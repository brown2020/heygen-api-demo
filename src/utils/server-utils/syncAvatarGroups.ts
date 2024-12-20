import { adminDb } from "@/firebase/firebaseAdmin";
import { AVATAR_GROUP_COLLECTION, AVATAR_GROUP_LOOK_COLLECTION, OWNERSHIP_TYPE } from "@/libs/constants";
import { AvatarGroup, HeyGenAvatarGroup } from "@/types/heygen";

interface PublicOwnerShipDetail {
    type: typeof OWNERSHIP_TYPE[0];
    owner: null
}

interface PersonalOwnerShipDetail {
    type: typeof OWNERSHIP_TYPE[1];
    owner: string;
}

export async function syncAvatarGroups(heygenAvatarGroups: HeyGenAvatarGroup[], ownershipDetail: PublicOwnerShipDetail | PersonalOwnerShipDetail) {
    // Get list of all  Avatars exist in our database
    const avatarGroupsSnapshot = await adminDb.collection(AVATAR_GROUP_COLLECTION).where('type', '==', ownershipDetail.type).get();

    const existingAvatarGroupIds = avatarGroupsSnapshot.docs.map(doc => doc.id);
    const allGroupIds = heygenAvatarGroups.map(group => group.id);

    // List all the ids of new  Avatars
    // Create list of new  Avatars
    const newAvatarGroupIds = allGroupIds.filter(id => !existingAvatarGroupIds.includes(id));
    if(newAvatarGroupIds.length > 0){
        const newAvatarGroups = heygenAvatarGroups.filter(heygenAvatarGroup => newAvatarGroupIds.includes(heygenAvatarGroup.id));
        // Add all those avatar groups in our database
        if(newAvatarGroups.length > 0) {
            console.log("Adding new avatar groups to database");
            
            newAvatarGroups.forEach(async (newAvatarGroup) => {
                await adminDb.collection(AVATAR_GROUP_COLLECTION).doc(newAvatarGroup.id).set({
                    id: newAvatarGroup.id,
                    name: newAvatarGroup.name,
                    type: ownershipDetail.type,
                    num_looks: newAvatarGroup.num_looks,
                    created_at: newAvatarGroup.created_at,
                    group_type: newAvatarGroup.group_type,
                    preview_image_url: newAvatarGroup.preview_image_url,
                    owner: ownershipDetail.owner
                } as AvatarGroup)
            });
        }
    }

    // Create list of deleted Avatars
    const deletedAvatarGroupIds = existingAvatarGroupIds.filter(id => !allGroupIds.includes(id));
    if(deletedAvatarGroupIds.length > 0){
        console.log("Deleting avatar groups from database");
        const batch = adminDb.batch();
        avatarGroupsSnapshot.docs.forEach(async (doc) => {
            if(deletedAvatarGroupIds.includes(doc.id)){
                batch.delete(doc.ref);
            }
        });
        // Delete all those avatar groups from our database
        await batch.commit();

        // remove all avatar looks from the deleted groups
        const avatarLooksSnapshot = await adminDb.collection(AVATAR_GROUP_LOOK_COLLECTION).where('group_id', 'in', deletedAvatarGroupIds).get();
        const batchLooks = adminDb.batch();
        avatarLooksSnapshot.docs.forEach(async (doc) => {
            batchLooks.delete(doc.ref);
        });
        await batchLooks.commit();
    }

    // List all avatar group which does not have preview image
    const avatarGroupDocs = avatarGroupsSnapshot.docs.map(doc => doc.data() as AvatarGroup);
    const avatarGroupsWithoutPreviewImage = avatarGroupDocs.filter(group => !group.preview_image_url);
    const withoutImageAvatarGroupIds = avatarGroupsWithoutPreviewImage.map(group => group.id);

    // Sync all those groups with our database


    return { 
        newAvatarGroupIds,
        withoutImageAvatarGroupIds
    };
}
