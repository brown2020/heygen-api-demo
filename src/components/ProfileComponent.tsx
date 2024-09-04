"use client";

import Link from "next/link";
import useProfileStore from "@/zustand/useProfileStore";
import { useEffect, useState } from "react";

type Props = {};
export default function ProfileComponent({}: Props) {
  const profile = useProfileStore((state) => state.profile);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const [heygenApiKey, setHeygenApiKey] = useState(profile.heygen_api_key);
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState(
    profile.elevenlabs_api_key
  );

  useEffect(() => {
    setHeygenApiKey(profile.heygen_api_key);
    setElevenlabsApiKey(profile.elevenlabs_api_key);
  }, [profile.heygen_api_key, profile.elevenlabs_api_key]);

  const handleApiKeyChange = async () => {
    if (
      heygenApiKey !== profile.heygen_api_key ||
      elevenlabsApiKey !== profile.elevenlabs_api_key
    ) {
      try {
        await updateProfile({
          heygen_api_key: heygenApiKey,
          elevenlabs_api_key: elevenlabsApiKey,
        });
        console.log("API keys updated successfully!");
      } catch (error) {
        console.error("Error updating API keys:", error);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row px-5 py-3 gap-3 border border-gray-500 rounded-md">
        <div className="flex gap-2 w-full items-center">
          <div className="flex-1">
            Conversation Credits: {Math.round(profile.credits)}
          </div>
          <Link
            className="bg-blue-500 text-white px-3 py-2 rounded-md hover:opacity-50 flex-1 text-center"
            href={"/payment-attempt"}
          >
            Buy 10,000 Credits
          </Link>
        </div>
      </div>
      <div className="flex flex-col px-5 py-3 gap-3 border border-gray-500 rounded-md">
        <label htmlFor="heygen-api-key" className="text-sm font-medium">
          HeyGen API Key:
        </label>
        <input
          type="text"
          id="heygen-api-key"
          value={heygenApiKey}
          onChange={(e) => setHeygenApiKey(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 h-10"
          placeholder="Enter your HeyGen API Key"
        />
        <label htmlFor="elevenlabs-api-key" className="text-sm font-medium">
          ElevenLabs API Key:
        </label>
        <input
          type="text"
          id="elevenlabs-api-key"
          value={elevenlabsApiKey}
          onChange={(e) => setElevenlabsApiKey(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 h-10"
          placeholder="Enter your ElevenLabs API Key"
        />
        <button
          onClick={handleApiKeyChange}
          disabled={
            heygenApiKey === profile.heygen_api_key &&
            elevenlabsApiKey === profile.elevenlabs_api_key
          }
          className="bg-blue-500 text-white px-3 py-2 rounded-md hover:opacity-50 disabled:opacity-50"
        >
          Update API Keys
        </button>
      </div>
    </div>
  );
}
