"use server";
import { HeyGenService } from "@/libs/HeyGenService";
import { ApiAvatarGroupResponse, ApiUploadTalkingPhotoResponse, HeyGenFailResponse } from "@/types/heygen";
import { heyGenHeaders } from "@/utils/heyGenHeaders";
import { handleErrorGeneral } from "@/utils/server-utils/handleErrorGeneral";
import { handleHeyGenError } from "@/utils/server-utils/handleHeyGenError";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

export const uploadTalkingPhoto = async (apiKey: string, base64Image: string, ): Promise<ApiUploadTalkingPhotoResponse | HeyGenFailResponse> => {
    const { userId } = await auth.protect();

    try {
        
        const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
            if (!matches) {
                throw new Error('Invalid Base64 string');
            }

            const mimeType = matches[1]; // e.g., 'image/png'
            const base64Data = matches[2];

            // Decode the Base64 data
            const buffer = Buffer.from(base64Data, 'base64');
  
            // Convert the Buffer into an ArrayBuffer
            const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
            
        //     return arrayBuffer;

        // const responseBuffer = await axios.get(base64Image,
        //     { responseType: 'arraybuffer' }
        //   );
        //   const arrayBuffer = responseBuffer.data;
          const blob = new Blob([arrayBuffer])
          const _file = new File([blob], 'first.png', { type: blob.type });

        
        const response = await axios.post<ApiUploadTalkingPhotoResponse>(HeyGenService.endpoints.upload_talking_photo, _file, { headers: heyGenHeaders(apiKey) });
        return response.data;
    } catch (error) {
        return handleHeyGenError('Error upload talking photo:', 'uploadTalkingPhoto', error, { apiKey, userId }, [401]);
    }

}