"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useAuthContext } from "./AuthProvider";
import AuthForm from "./AuthForm";
import Footer from "./Footer";

function SignedInHome() {
  const uid = useAuthStore((state) => state.uid);
  const photoUrl = useAuthStore((state) => state.authPhotoUrl);
  const fullName = useAuthStore((state) => state.authDisplayName);
  const email = useAuthStore((state) => state.authEmail);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100">
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
      <div>{fullName || email}</div>
      <div className="w-full">
        <div className="text-lg font-medium">User ID</div>
        <div className="text-sm py-1 px-2 bg-slate-100 rounded-md break-all">
          {uid || "No User"}
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

export default function Home() {
  const { user, ready, configured, error } = useAuthContext();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col gap-5 bg-white shadow-md rounded-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center">Heygen API Demo</h1>
          {configured && !ready ? (
            <p className="text-sm text-slate-600 text-center" role="status">
              Checking session
            </p>
          ) : user ? (
            <SignedInHome />
          ) : (
            <>
              <div className="flex flex-col items-center gap-3">
                <p className="text-lg font-medium text-gray-700 text-center">
                  Welcome to the Heygen API Demo!
                </p>
                <p className="text-sm text-gray-600 text-center">
                  Sign in with email or Google to sync talking photos, generate
                  avatar videos via HeyGen, and manage credits.
                </p>
              </div>
              <AuthForm />
              {error && (
                <p className="text-sm text-red-800" role="alert">
                  {error}
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
