"use server";
import { ElevenLabsClient, ElevenLabsError } from "elevenlabs";

export async function findAudio(elevenlabs_api_key: string, voiceId: string) {
    try {
        const elevenlabs = new ElevenLabsClient({
            apiKey: elevenlabs_api_key // Defaults to process.env.ELEVENLABS_API_KEY
        })
        const voice = await elevenlabs.voices.get(voiceId);
        return { status: true, voice: voice };
    } catch (error) {
        console.log("Error on fetch audio list: ", error);
        if(error instanceof ElevenLabsError){
            if(error.statusCode == 401){
                return { error: "ElevenLabs : Invalid API key." };
            }else if(error.body && typeof error.body == 'object' && "detail" in error.body && error.body.detail){
                if(typeof  error.body.detail == 'object' && "status" in error.body.detail){
                    if(error.body.detail.status == 'voice_not_found'){
                        return { error: "Voice not found." };
                    }
                }
            }
        }
        

        return { error: "Something went wrong." };
    }
}