import { adminDb } from "@/firebase/firebaseAdmin";
import { AVATAR_GROUP_COLLECTION, AVATAR_GROUP_LOOK_COLLECTION } from "@/libs/constants";
import { getAvatarLook } from "@/libs/utils";
import { AvatarGroup, AvatarLook, HeyGenAvatarGroupLookPhoto, HeyGenAvatarGroupLookVideo } from "@/types/heygen";

export async function syncAvatarGroupLooks(avatarGroupId: string, avatarGroupLooks: (HeyGenAvatarGroupLookPhoto|HeyGenAvatarGroupLookVideo)[]) {
    const _avatarGroupLooks = avatarGroupLooks.map(look => getAvatarLook(look, avatarGroupId));
    const avatarGroupLooksIds = _avatarGroupLooks.map(look => look.id);

    // Get Avatar Group Exist
    const avatarGroupSnapshot = await adminDb.collection(AVATAR_GROUP_COLLECTION).doc(avatarGroupId).get();
    if(!avatarGroupSnapshot.exists){
        return {status: false}
    }
    const avatarGroup = avatarGroupSnapshot.data() as AvatarGroup;

    // List all the existing Avatar Group Looks
    const existingAvatarGroupLooksSnapshot = await adminDb.collection(AVATAR_GROUP_LOOK_COLLECTION).where('group_id', '==', avatarGroupId).get();
    const existingAvatarGroupLookIds = existingAvatarGroupLooksSnapshot.docs.map(doc => doc.id);

    // Create list of new Avatar Group Look ids
    const newAvatarGroupLookIds = avatarGroupLooksIds.filter(id => !existingAvatarGroupLookIds.includes(id));
    // Add new Avatar Group Looks
    if(newAvatarGroupLookIds.length > 0){
        const newAvatarGroupLooks = _avatarGroupLooks.filter(look => newAvatarGroupLookIds.includes(look.id));
        if(newAvatarGroupLooks.length > 0){
            console.log("Adding new avatar group looks to database");
            newAvatarGroupLooks.forEach(async (newAvatarGroupLook) => {
                try {
                    await adminDb.collection(AVATAR_GROUP_LOOK_COLLECTION).doc(newAvatarGroupLook.id).set(newAvatarGroupLook as AvatarLook);
                } catch (error) {
                    console.log("Error with update", newAvatarGroupLook);
                    console.log(error);
                    
                    return {status: false}
                }
            });
        }
    }

    // Create list of deleted Avatar Group Look ids
    const deletedAvatarGroupLookIds = existingAvatarGroupLookIds.filter(id => !avatarGroupLooksIds.includes(id));
    // Delete deleted Avatar Group Looks
    if(deletedAvatarGroupLookIds.length > 0){
        console.log("Deleting avatar group looks from database");
        const batch = adminDb.batch();
        existingAvatarGroupLooksSnapshot.docs.forEach(async (doc) => {
            if(deletedAvatarGroupLookIds.includes(doc.id)){
                batch.delete(doc.ref);
            }
        });
        await batch.commit();
    }
    
    // If avatar group preview image is null then update it
    if(avatarGroup.preview_image_url == null && _avatarGroupLooks.length > 0){
        await adminDb.collection(AVATAR_GROUP_COLLECTION).doc(avatarGroupId).update({
            preview_image_url: _avatarGroupLooks[0].image_url
        });
    }

    return {status: true};
}
