import { NextRequest, NextResponse } from "next/server";
import { getHeygenAvatarGroups } from "@/actions/getHeygenAvatarGroups";
import { syncPublicAvatarGroups } from "@/actions/syncPublicAvatarGroups";
import { getHeygenAvatarGroupLooks } from "@/actions/getHeygenAvatarGroupLooks";
import { syncAvatarGroupLooks } from "@/actions/syncAvatarGroupLooks";

export const POST = async (
  req: NextRequest
) => {
    try {
        
        const { apiKey } = await req.json();
    
        if(!apiKey) {
            return new Response("Missing API Key", { status: 400 });
        }
    
        const avatarGroupList = await getHeygenAvatarGroups(apiKey);
    
        if(!avatarGroupList.status) {
            return new Response(avatarGroupList.error, { status: 400 });
        }
    
        // Create separate list of public and personal avatar groups
        const publicGroups = avatarGroupList.data.data.avatar_group_list.filter(group => group.group_type.toLowerCase().includes("public"));
    
        // Sync group with database
        const syncResponse = await syncPublicAvatarGroups(publicGroups);
        const notFoundAvatars: string[]= [];
        if(syncResponse.withoutImageAvatarGroupIds.length > 0){
            for(const newGroupId of syncResponse.withoutImageAvatarGroupIds){
                const avatarGroup = publicGroups.find(group => group.id === newGroupId);
                if(avatarGroup){
                    const avatarGroupLooks = await getHeygenAvatarGroupLooks(apiKey, newGroupId);
                    if(!avatarGroupLooks.status && "apiStatusCode" in avatarGroupLooks && avatarGroupLooks.apiStatusCode === 404){

                        notFoundAvatars.push(newGroupId);
                        continue;
                    }else if(!avatarGroupLooks.status) {
                        console.log("||||||||||||||||||||something went wrong", avatarGroupLooks.error);
                        
                        return new Response(avatarGroupLooks.error, { status: 400 });
                    }
    
                    const syncResponse = await syncAvatarGroupLooks(newGroupId, avatarGroupLooks.data.data.avatar_list);
                    if(!syncResponse.status){
                        return new Response("Error syncing avatar group looks", { status: 400 });
                    }
                }
            }
        }
    
        return NextResponse.json({message: "Sync Public Avatar Detail Successfully.", data: {
            notFoundAvatars
        }}, { status: 200 });
    } catch (error) {
        console.log("Error syncing public avatar groups:", error);
        return NextResponse.json({message: "Something went wrong."}, { status: 200 });
    }
};
