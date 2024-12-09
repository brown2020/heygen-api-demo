"use server";

import { admin } from "@/firebase/firebaseAdmin";

export async function getFileUrl(filepath: string){
    try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(filepath);

        // const stream = file.createWriteStream({
        //     metadata: {
        //         contentType: 'image/jpeg' // Adjust content type as needed
        //     }
        // });

        const [url] = await file.getSignedUrl({
            action: "read",
            expires: "03-17-2125",
        });
        return url;
        // return new Promise((resolve, reject) => {
        //     stream.on('error', reject);
        //     stream.on('finish', resolve);

        //     fs.createReadStream(filePath).pipe(stream);
        // });
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}