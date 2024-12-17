"use client";

import useProfileStore from "@/zustand/useProfileStore";
import { useEffect, useMemo, useState } from "react";

export default function ProfileComponent() {
  const profile = useProfileStore((state) => state.profile);

  const updateProfile = useProfileStore((state) => state.updateProfile);
  const _profile = useMemo(() => {
    return profile ? {
      heygen_api_key: profile.heygen_api_key,
      elevenlabs_api_key: profile.elevenlabs_api_key,
    } : {
      heygen_api_key: "",
      elevenlabs_api_key: "",
    }
  }, [profile]);
  const [heygenApiKey, setHeygenApiKey] = useState(_profile.heygen_api_key);
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState(_profile.elevenlabs_api_key);

  useEffect(() => {
    setHeygenApiKey(_profile.heygen_api_key);
    setElevenlabsApiKey(_profile.elevenlabs_api_key);
  }, [_profile.heygen_api_key, _profile.elevenlabs_api_key]);

  const handleApiKeyChange = async () => {
    if (
      heygenApiKey !== _profile.heygen_api_key ||
      elevenlabsApiKey !== _profile.elevenlabs_api_key
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
    <div className="flex flex-col p-5 border rounded-[10px] shadow-[rgba(50,_50,_105,_0.15)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.05)_0px_1px_1px_0px]">
    <div className="flex flex-col gap-5">
      <div className="flex flex-col">
        <label htmlFor="did-api-key" className="text-base font-light mb-[5px]">
        HeyGen API Key:
        </label>
        <input
          type="text"
          id="did-api-key"
          value={heygenApiKey}
          onChange={(e) => setHeygenApiKey(e.target.value)}
          className="border bg-ghostWhite rounded-md py-[10px] px-[15px] h-10 text-sm"
          placeholder="Enter your Heygen API Key"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="elevenlabs-api-key" className="text-base font-light mb-[5px]">
          ElevenLabs API Key:
        </label>
        <input
          type="text"
          id="elevenlabs-api-key"
          value={elevenlabsApiKey}
          onChange={(e) => setElevenlabsApiKey(e.target.value)}
          className="border bg-ghostWhite rounded-md py-[10px] px-[15px] h-10 text-sm"
          placeholder="Enter your ElevenLabs API Key"
        />
      </div>
      <button
        onClick={handleApiKeyChange}
        disabled={
          heygenApiKey === _profile.heygen_api_key &&
          elevenlabsApiKey === _profile.elevenlabs_api_key
        }
        className="bg-blue-500 text-white px-3 py-2 rounded-md hover:opacity-50 disabled:opacity-50"
      >
        Update API Keys
      </button>
    </div>
  </div>
  );
}
