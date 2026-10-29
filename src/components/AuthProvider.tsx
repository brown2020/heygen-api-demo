"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { serverTimestamp, type Timestamp } from "firebase/firestore";
import { clearAuthSession, establishAuthSession } from "@/actions/authSession";
import { auth, isFirebaseConfigured } from "@/firebase/firebaseClient";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useInitializeStores } from "@/zustand/useInitializeStores";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  configured: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function requireConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase Auth is not configured.");
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const setAuthDetails = useAuthStore((state) => state.setAuthDetails);
  const clearAuthDetails = useAuthStore((state) => state.clearAuthDetails);
  const identityKey = useRef("");
  useInitializeStores();

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let cancelled = false;

    const unsubscribe = onIdTokenChanged(auth, (next) => {
      void (async () => {
        if (cancelled) return;
        if (!next) {
          identityKey.current = "";
          try {
            await clearAuthSession();
          } catch {
            // The cookie is already absent when Admin is not configured.
          }
          if (cancelled) return;
          clearAuthDetails();
          setUser(null);
          setReady(true);
          return;
        }

        try {
          const token = await next.getIdToken();
          await establishAuthSession(token);
          if (cancelled) return;
          setUser(next);
          setError(null);
          const key = [
            next.uid,
            next.email ?? "",
            next.displayName ?? "",
            next.photoURL ?? "",
            String(next.emailVerified),
          ].join("|");
          if (identityKey.current !== key) {
            identityKey.current = key;
            await setAuthDetails({
              uid: next.uid,
              firebaseUid: next.uid,
              authEmail: next.email || "",
              authDisplayName: next.displayName || "",
              authPhotoUrl: next.photoURL || "",
              authEmailVerified: next.emailVerified,
              authReady: true,
              authError: null,
              lastSignIn: serverTimestamp() as Timestamp,
            });
          }
        } catch (sessionError) {
          console.error("Firebase session setup failed:", sessionError);
          if (cancelled) return;
          setUser(next);
          setError("Could not start a server session. Profile actions may be unavailable.");
          const key = `error|${next.uid}`;
          if (identityKey.current !== key) {
            identityKey.current = key;
            await setAuthDetails({
              uid: next.uid,
              firebaseUid: next.uid,
              authEmail: next.email || "",
              authDisplayName: next.displayName || "",
              authPhotoUrl: next.photoURL || "",
              authEmailVerified: next.emailVerified,
              authReady: true,
              authError: "Could not start a server session. Profile actions may be unavailable.",
              lastSignIn: serverTimestamp() as Timestamp,
            });
          }
        } finally {
          if (!cancelled) setReady(true);
        }
      })();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [clearAuthDetails, setAuthDetails]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      configured: isFirebaseConfigured,
      error,
      signInWithEmail: async (email, password) => {
        requireConfigured();
        setError(null);
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      signUpWithEmail: async (email, password) => {
        requireConfigured();
        setError(null);
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      },
      signInWithGoogle: async () => {
        requireConfigured();
        setError(null);
        await signInWithPopup(auth, new GoogleAuthProvider());
      },
      signOutUser: async () => {
        setError(null);
        try {
          await clearAuthSession();
        } catch {
          // Cookie clear is best-effort when Admin is not configured.
        }
        if (isFirebaseConfigured) {
          await firebaseSignOut(auth);
        }
        identityKey.current = "";
        clearAuthDetails();
        setUser(null);
      },
    }),
    [clearAuthDetails, error, ready, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return value;
}
