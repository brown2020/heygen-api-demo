import { create } from "zustand";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "./useAuthStore";
import { db } from "@/firebase/firebaseClient";
import { Voice } from "elevenlabs/api";
import { AvatarGroup, HeyGenErrorCode, TalkingPhoto } from "@/types/heygen";

export interface ProfileType {
  email: string;
  contactEmail: string;
  displayName: string;
  photoUrl: string;
  emailVerified: boolean;
  credits: number;
  heygen_api_key: string;
  heygen_key_updated?: boolean;
  elevenlabs_api_key: string;
  selectedAvatar: string;
  selectedTalkingPhoto: string;
  did_api_key?: string;
}

const defaultProfile: ProfileType = {
  email: "",
  contactEmail: "",
  displayName: "",
  photoUrl: "",
  emailVerified: false,
  credits: 0,
  heygen_api_key: "",
  elevenlabs_api_key: "",
  selectedAvatar: "",
  selectedTalkingPhoto: "",
};

interface AuthState {
  authEmail?: string;
  authDisplayName?: string;
  authPhotoUrl?: string;
  authEmailVerified?: boolean;
}

interface ProfileState {
  profile: ProfileType | null;
  fetchProfile: () => void;
  updateProfile: (newProfile: Partial<ProfileType>) => Promise<void>;
  useCredits: (amount: number) => Promise<boolean>;
  addCredits: (amount: number) => Promise<void>;
  voices: Voice[] | null;
  fetchVoices: () => Promise<void>;
  avatarGroups: AvatarGroup[] | null;
  talking_photos: TalkingPhoto[] | null;
  invalid_heygen_api_key: HeyGenErrorCode | null;
  updateHeyGenApiKeyCode: (code: HeyGenErrorCode | null) => void;
}

const mergeProfileWithDefaults = (
  profile: Partial<ProfileType>,
  authState: AuthState
): ProfileType => ({
  ...defaultProfile,
  ...profile,
  credits: profile.credits && profile.credits >= 100 ? profile.credits : 1000,
  email: authState.authEmail || profile.email || "",
  contactEmail: profile.contactEmail || authState.authEmail || "",
  displayName: profile.displayName || authState.authDisplayName || "",
  photoUrl: profile.photoUrl || authState.authPhotoUrl || "",
  
});

const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  voices: null,
  avatarGroups: null,
  talking_photos: null,
  invalid_heygen_api_key: null,
  fetchProfile: async () => {
    const { uid, authEmail, authDisplayName, authPhotoUrl, authEmailVerified } =
      useAuthStore.getState();
    if (!uid) return;

    try {
      const userRef = doc(db, `users/${uid}/profile/userData`);
      const docSnap = await getDoc(userRef);

      let newProfile: ProfileType;

      if (docSnap.exists()) {
        newProfile = mergeProfileWithDefaults(docSnap.data() as ProfileType, {
          authEmail,
          authDisplayName,
          authPhotoUrl,
          authEmailVerified,
        });
      } else {
        newProfile = {
          email: authEmail || "",
          contactEmail: "",
          displayName: authDisplayName || "",
          photoUrl: authPhotoUrl || "",
          emailVerified: authEmailVerified || false,
          credits: 1000,
          heygen_api_key: "",
          elevenlabs_api_key: "",
          selectedAvatar: "",
          selectedTalkingPhoto: "",
        };
        console.log("No profile found. Creating new profile document.");

        await setDoc(userRef, newProfile, {merge: true});
      }

      set({ profile: newProfile });
    } catch (error) {
      console.error("Error fetching or creating profile:", error);
    }
  },

  updateHeyGenApiKeyCode: (code: HeyGenErrorCode | null) => {
    set({ invalid_heygen_api_key: code });
  },

  updateProfile: async (newProfile: Partial<ProfileType>) => {
    const uid = useAuthStore.getState().uid;
    if (!uid) return;

    console.log("Updating profile:", newProfile);
    
    // If heygen key is exist and updated then set heygen key updated to true
    const oldProfile = get().profile;
    if("heygen_api_key" in newProfile && oldProfile?.heygen_api_key !== newProfile.heygen_api_key){
      newProfile.heygen_key_updated = true;
      set({ invalid_heygen_api_key: null });
    }

    try {
      const userRef = doc(db, `users/${uid}/profile/userData`);
      await setDoc(userRef, newProfile, { merge: true });
      
      await get().fetchProfile();

      console.log("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  },

  useCredits: async (amount: number) => {
    const uid = useAuthStore.getState().uid;
    const _profile = get().profile;
    if (!uid || _profile == null) return false;

    const profile = _profile;
    if (profile.credits < amount) {
      return false;
    }

    try {
      const newCredits = profile.credits - amount;
      const userRef = doc(db, `users/${uid}/profile/userData`);

      await updateDoc(userRef, { credits: newCredits });
      set({ profile: { ...profile, credits: newCredits } });

      return true;
    } catch (error) {
      console.error("Error using credits:", error);
      return false;
    }
  },

  addCredits: async (amount: number) => {
    const uid = useAuthStore.getState().uid;
    const profile = get().profile;
    if (!uid || !profile) return;

    const newCredits = profile.credits + amount;

    try {
      const userRef = doc(db, `users/${uid}/profile/userData`);

      await updateDoc(userRef, { credits: newCredits });
      set({ profile: { ...profile, credits: newCredits } });
    } catch (error) {
      console.error("Error adding credits:", error);
    }
  },
  fetchVoices: async () => {

    // // check key exist for voices
    // const profile = get().profile;
    // if (get().voices !== null || profile == null) {
    //   return;
    // }

    // // If not, then fetch audio list
    // const audioList = await getAudioList(profile.elevenlabs_api_key);
    // if ("error" in audioList && audioList.error) {
    //   console.error("Error fetching audio list: ", audioList.error);
    //   toast.error(audioList.error);
    //   return;
    // }

    // if (audioList.status && Array.isArray(audioList.voices)) {
    //   // set audio list in voices
    //   set({ voices: audioList.voices });
    // } else {
    //   set({ voices: null });
    // }

  }
}));

export default useProfileStore;
