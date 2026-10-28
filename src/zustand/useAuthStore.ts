import { db } from "@/firebase/firebaseClient";
import { stripPrivilegedFields } from "@/libs/privileged-fields";
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
  authError: string | null;
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
  authError: null,
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...defaultAuthState,

  setAuthDetails: async (details: Partial<AuthState>) => {
    set((state) => ({ ...state, ...details }));

    const storeState = get();
    const persisted: Record<string, unknown> = {};
    for (const key of Object.keys(defaultAuthState) as (keyof AuthState)[]) {
      persisted[key] = storeState[key];
    }
    await updateUserDetailsInFirestore(stripPrivilegedFields(persisted), storeState.uid);
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
        { ...stripPrivilegedFields(details as Record<string, unknown>), lastSignIn: serverTimestamp() },
        { merge: true }
      );
    } catch (error) {
      console.error("Error updating auth details in Firestore:", error);
    }
  }
}
