"use client";

import { isClerkConfigured } from "@/libs/clerk-config";
import { useAuthStore } from "@/zustand/useAuthStore";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import Footer from "./Footer";

function SignedInHome() {
  const uid = useAuthStore((state) => state.uid);
  const photoUrl = useAuthStore((state) => state.authPhotoUrl);
  const firebaseUid = useAuthStore((state) => state.firebaseUid);
  const fullName = useAuthStore((state) => state.authDisplayName);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-20 h-20 rounded-full overflow-hidden">
        {photoUrl && (
          <Image
            src={photoUrl}
            width={256}
            height={256}
            alt={fullName ? `${fullName} profile photo` : "User profile photo"}
            priority
          />
        )}
      </div>
      <div>{fullName}</div>

      <div className="w-full">
        <div className="text-lg font-medium">Clerk User</div>
        <div className="text-sm py-1 px-2 bg-slate-100 rounded-md">
          {uid || "No User"}
        </div>
      </div>

      <div className="w-full">
        <div className="text-lg font-medium">Firebase User</div>
        <div className="text-sm py-1 px-2 bg-slate-100 rounded-md">
          {firebaseUid || "No User"}
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Link
          href="/avatars"
          className="p-2 bg-blue-700 text-white rounded-md w-32 text-center inline-block hover:bg-blue-800"
        >
          Avatars
        </Link>
        <Link
          href="/profile"
          className="p-2 bg-slate-700 text-white rounded-md w-32 text-center inline-block hover:bg-slate-800"
        >
          Profile
        </Link>
      </div>
    </div>
  );
}

function WelcomeCopy() {
  return (
    <div className="flex flex-col items-center mb-4 gap-3">
      <p className="text-lg font-medium text-gray-700 text-center">
        Welcome to the Heygen API Demo!
      </p>
      <p className="text-sm text-gray-600 text-center">
        Sign in with Clerk to sync talking photos, generate avatar videos via
        HeyGen, and manage credits. Authentication UI is hosted by Clerk (no
        custom email/password forms in this app).
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col gap-5 bg-white shadow-md rounded-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center">Heygen API Demo</h1>

          {isClerkConfigured ? (
            <>
              <SignedIn>
                <SignedInHome />
              </SignedIn>
              <SignedOut>
                <WelcomeCopy />
                <div className="flex justify-center">
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="p-2 bg-blue-700 text-white rounded-md w-40 text-center hover:bg-blue-800"
                    >
                      Sign in
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>
            </>
          ) : (
            <>
              <WelcomeCopy />
              <p
                className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3 text-center"
                role="status"
              >
                Clerk is not configured in this environment. Set{" "}
                <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> via secrets to
                enable sign-in.
              </p>
              <div className="flex justify-center gap-3">
                <Link
                  href="/avatars"
                  className="p-2 bg-blue-700 text-white rounded-md w-32 text-center inline-block hover:bg-blue-800"
                >
                  Avatars
                </Link>
                <Link
                  href="/profile"
                  className="p-2 bg-slate-700 text-white rounded-md w-32 text-center inline-block hover:bg-slate-800"
                >
                  Profile
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
