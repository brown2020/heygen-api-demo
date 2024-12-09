"use server";
import { ElevenLabsClient, ElevenLabsError } from 'elevenlabs';
import { Voice } from 'elevenlabs/api';
import NodeCache from "node-cache";
export async function getAudioList(elevenlabs_api_key: string) {
    try {

        const audioCacheKey = `audio-${elevenlabs_api_key}`;

        // Check audio list exist in cache
        const myCache = new NodeCache();
        let audioList = myCache.get( audioCacheKey );
        console.log("audioList: ", audioList);
        

        if(audioList == undefined){
            // If not, then fetch audio list
            const elevenlabs = new ElevenLabsClient({
                apiKey: elevenlabs_api_key // Defaults to process.env.ELEVENLABS_API_KEY
            })
            
            const voices = await elevenlabs.voices.getAll();
            audioList = voices.voices;

            // save that list in cache
            myCache.set<Voice[]>( audioCacheKey, voices.voices )
            
        }
        
        // return audio list
        return { status: true, voices: audioList };

    } catch (error) {
        console.log("Error on fetch audio list: ", error);
        if(error instanceof ElevenLabsError){
            if(error.statusCode == 401){
                return { error: "ElevenLabs : Invalid API key." };
            }
        }

        return { error: "Something went wrong." };
    }
}