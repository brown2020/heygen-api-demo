"use client";

import { auth, isFirebaseConfigured } from "@/firebase/firebaseClient";
import { isClerkConfigured } from "@/libs/clerk-config";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useInitializeStores } from "@/zustand/useInitializeStores";
import useProfileStore from "@/zustand/useProfileStore";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import {
  signInWithCustomToken,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { serverTimestamp, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useEffect } from "react";

function NavShell({ children }: { children: React.ReactNode }) {
  return (
    <header className="flex h-14 items-center justify-between px-4 py-2 border-b border-slate-300 bg-white">
      <Link href="/" className="font-medium text-xl">
        Heygen API Demo
      </Link>
      <nav aria-label="Primary" className="flex gap-2 items-center">
        {children}
      </nav>
    </header>
  );
}

function HeaderWithClerk() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const setAuthDetails = useAuthStore((state) => state.setAuthDetails);
  const clearAuthDetails = useAuthStore((state) => state.clearAuthDetails);
  const profile = useProfileStore((state) => state.profile);
  useInitializeStores();

  useEffect(() => {
    let cancelled = false;

    const syncAuthState = async () => {
      if (isSignedIn && user) {
        if (!isFirebaseConfigured) {
          if (!cancelled) {
            queueMicrotask(() =>
              setAuthDetails({
                uid: user.id,
                firebaseUid: "",
                authEmail: user.emailAddresses[0]?.emailAddress || "",
                authDisplayName: user.fullName || "",
                authPhotoUrl: user.imageUrl,
                authReady: true,
                lastSignIn: serverTimestamp() as Timestamp,
              })
            );
          }
          return;
        }
        try {
          const token = await getToken({ template: "integration_firebase" });
          const userCredentials = await signInWithCustomToken(
            auth,
            token || ""
          );
          await updateProfile(userCredentials.user, {
            displayName: user.fullName,
            photoURL: user.imageUrl,
          });
          if (!cancelled) {
            queueMicrotask(() =>
              setAuthDetails({
                uid: user.id,
                firebaseUid: userCredentials.user.uid,
                authEmail: user.emailAddresses[0]?.emailAddress || "",
                authDisplayName: user.fullName || "",
                authPhotoUrl: user.imageUrl,
                authReady: true,
                lastSignIn: serverTimestamp() as Timestamp,
              })
            );
          }
        } catch (error) {
          console.error("Error signing in with custom token:", error);
          if (!cancelled) {
            queueMicrotask(() => clearAuthDetails());
          }
        }
      } else {
        if (isFirebaseConfigured) {
          try {
            await firebaseSignOut(auth);
          } catch {
            // ignore
          }
        }
        if (!cancelled) {
          queueMicrotask(() => clearAuthDetails());
        }
      }
    };

    syncAuthState();
    return () => {
      cancelled = true;
    };
  }, [clearAuthDetails, getToken, isSignedIn, setAuthDetails, user]);

  return (
    <NavShell>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        {(profile.selectedAvatar || profile.selectedTalkingPhoto) && (
          <Link href="/generate" className="underline-offset-2 hover:underline">
            Generate
          </Link>
        )}
        <Link href="/avatars" className="underline-offset-2 hover:underline">
          Avatars
        </Link>
        <Link href="/profile" className="underline-offset-2 hover:underline">
          Profile
        </Link>
        <UserButton />
      </SignedIn>
    </NavShell>
  );
}

function HeaderWithoutClerk() {
  return (
    <NavShell>
      <span className="text-sm text-slate-600" role="status">
        Sign-in unavailable (Clerk not configured)
      </span>
      <Link href="/avatars" className="underline-offset-2 hover:underline">
        Avatars
      </Link>
      <Link href="/profile" className="underline-offset-2 hover:underline">
        Profile
      </Link>
    </NavShell>
  );
}

export default function Header() {
  if (!isClerkConfigured) {
    return <HeaderWithoutClerk />;
  }
  return <HeaderWithClerk />;
}
