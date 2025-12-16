import { db } from "@/firebase/firebaseClient";
import { Timestamp, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { create } from "zustand";

interface AuthState {
  uid: string;
  firebaseUid: string;
  authEmail: string;
  authDisplayName: string;
  authPhotoUrl: string;
  authEmailVerified: boolean;
  authReady: boolean;
  authPending: boolean;
  isAdmin: boolean;
  isAllowed: boolean;
  isInvited: boolean;
  lastSignIn: Timestamp | null;
  premium: boolean;
  credits: number;
}

interface AuthActions {
  setAuthDetails: (details: Partial<AuthState>) => Promise<void>;
  clearAuthDetails: () => void;
}

type AuthStore = AuthState & AuthActions;

const defaultAuthState: AuthState = {
  uid: "",
  firebaseUid: "",
  authEmail: "",
  authDisplayName: "",
  authPhotoUrl: "",
  authEmailVerified: false,
  authReady: false,
  authPending: false,
  isAdmin: false,
  isAllowed: false,
  isInvited: false,
  lastSignIn: null,
  premium: false,
  credits: 0,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...defaultAuthState,

  setAuthDetails: async (details: Partial<AuthState>) => {
    set((state) => ({ ...state, ...details }));

    const storeState = get();
    const filteredState: Partial<AuthState> = {};
    const setIfPresent = <K extends keyof AuthState>(key: K) => {
      const value = storeState[key];
      if (value !== undefined && value !== null) filteredState[key] = value;
    };
    for (const key of Object.keys(defaultAuthState) as (keyof AuthState)[]) {
      setIfPresent(key);
    }

    await updateUserDetailsInFirestore(filteredState, storeState.uid);
  },

  clearAuthDetails: () => set({ ...defaultAuthState }),
}));

async function updateUserDetailsInFirestore(
  details: Partial<AuthState>,
  uid: string
) {
  if (uid) {
    const userRef = doc(db, `users/${uid}`);
    try {
      await setDoc(
        userRef,
        { ...details, lastSignIn: serverTimestamp() },
        { merge: true }
      );
    } catch (error) {
      console.error("Error updating auth details in Firestore:", error);
    }
  }
}
