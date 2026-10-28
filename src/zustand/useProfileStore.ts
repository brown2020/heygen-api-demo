import { create } from "zustand";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "./useAuthStore";
import { db, isFirebaseConfigured } from "@/firebase/firebaseClient";
import { normalizeStoredCredits, STARTER_CREDITS } from "@/libs/billing";
import { clientProfileWritePayload } from "@/libs/profile-fields";

export interface ProfileType {
  email: string;
  contactEmail: string;
  displayName: string;
  photoUrl: string;
  emailVerified: boolean;
  credits: number;
  heygen_api_key: string;
  elevenlabs_api_key: string;
  selectedAvatar: string;
  selectedTalkingPhoto: string;
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
  profile: ProfileType;
  fetchProfile: () => void;
  updateProfile: (newProfile: Partial<ProfileType>) => Promise<void>;
}

const mergeProfileWithDefaults = (
  profile: Partial<ProfileType>,
  authState: AuthState
): ProfileType => ({
  ...defaultProfile,
  ...profile,
  credits: normalizeStoredCredits(profile.credits),
  email: authState.authEmail || profile.email || "",
  contactEmail: profile.contactEmail || authState.authEmail || "",
  displayName: profile.displayName || authState.authDisplayName || "",
  photoUrl: profile.photoUrl || authState.authPhotoUrl || "",
});

const useProfileStore = create<ProfileState>((set, get) => ({
  profile: defaultProfile,

  fetchProfile: async () => {
    const { uid, authEmail, authDisplayName, authPhotoUrl, authEmailVerified } =
      useAuthStore.getState();
    if (!uid) return;
    if (!isFirebaseConfigured) return;

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
        await setDoc(userRef, clientProfileWritePayload(newProfile), { merge: true });
      } else {
        newProfile = {
          email: authEmail || "",
          contactEmail: "",
          displayName: authDisplayName || "",
          photoUrl: authPhotoUrl || "",
          emailVerified: authEmailVerified || false,
          credits: STARTER_CREDITS,
          heygen_api_key: "",
          elevenlabs_api_key: "",
          selectedAvatar: "",
          selectedTalkingPhoto: "",
        };
        await setDoc(userRef, {
          ...clientProfileWritePayload(newProfile),
          credits: STARTER_CREDITS,
        });
      }
      set({ profile: newProfile });
    } catch (error) {
      console.error("Error fetching or creating profile:", error);
    }
  },

  updateProfile: async (newProfile: Partial<ProfileType>) => {
    const uid = useAuthStore.getState().uid;
    if (!uid) return;
    if (!isFirebaseConfigured) return;

    const payload = clientProfileWritePayload(newProfile);
    if (Object.keys(payload).length === 0) return;

    try {
      const userRef = doc(db, `users/${uid}/profile/userData`);
      set({ profile: { ...get().profile, ...payload } });
      await updateDoc(userRef, payload);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  },
}));

export default useProfileStore;
