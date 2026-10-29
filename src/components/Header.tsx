"use client";

import Link from "next/link";
import { isFirebaseConfigured } from "@/firebase/firebaseClient";
import useProfileStore from "@/zustand/useProfileStore";
import { useAuthContext } from "./AuthProvider";
import UserMenu from "./UserMenu";

export default function Header() {
  const { user, ready } = useAuthContext();
  const profile = useProfileStore((state) => state.profile);
  const showGenerate = Boolean(profile.selectedAvatar || profile.selectedTalkingPhoto);

  return (
    <header className="relative z-50 flex h-14 items-center justify-between px-4 py-2 border-b border-slate-300 bg-white">
      <Link href="/" className="font-medium text-xl">
        Heygen API Demo
      </Link>
      <nav aria-label="Primary" className="flex gap-2 items-center">
        {!isFirebaseConfigured ? (
          <>
            <span className="text-sm text-slate-600" role="status">
              Sign-in unavailable (Firebase Auth not configured)
            </span>
            <Link href="/avatars" className="underline-offset-2 hover:underline">
              Avatars
            </Link>
            <Link href="/profile" className="underline-offset-2 hover:underline">
              Profile
            </Link>
          </>
        ) : !ready ? (
          <span className="text-sm text-slate-600" role="status">
            Checking session
          </span>
        ) : user ? (
          <>
            {showGenerate && (
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
            <UserMenu />
          </>
        ) : (
          <Link href="/" className="underline-offset-2 hover:underline">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
