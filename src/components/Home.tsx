"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import Footer from "./Footer";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const uid = useAuthStore((state) => state.uid);
  const photoUrl = useAuthStore((state) => state.authPhotoUrl);
  const firebaseUid = useAuthStore((state) => state.firebaseUid);
  const fullName = useAuthStore((state) => state.authDisplayName);
  const [loading, setLoading] = useState(false);
  const handleClick = () => {
    setLoading(true);
  };

  return (
    <>
      <SignedIn>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-full gap-[100px] px-[30px]">
            <div className="flex flex-col gap-[30px] bg-white shadow-pop-up-shadow rounded-2xl p-[30px] max-w-[616px] w-full">
              <h2 className="text-center font-medium  text-[26px] max-xs:text-[22px]">Heygen API Demo</h2>

              <div className="flex flex-col items-center mb-[10px] gap-2">
                <div className="w-20 h-20 rounded-full overflow-hidden">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      width={256}
                      height={256}
                      alt={"user"}
                      priority
                    />
                  ) : <div className="bg-gray-300 animate-pulse rounded-lg w-20 h-20 mx-auto" />}
                </div>
                <div className="text-center mt-[10px] text-[22px] max-xs:text-lg">{fullName}</div>

                <div className="w-full">
                  <div className="text-base max-xs:text-sm">Clerk User</div>
                  <div className="text-xs max-xs:text-sm py-[10px] overflow-auto px-[15px] text-[#1E1E1E] bg-lightGray rounded-lg">
                    {uid ? (
                      uid
                    ) : (
                      <div className="bg-gray-300 animate-pulse h-6 w-full rounded-lg" />
                    )}
                  </div>
                </div>

                <div className="w-full">
                  <div className="text-base max-xs:text-sm">Firebase User</div>
                  <div className="text-xs max-xs:text-sm py-[10px] overflow-auto px-[15px] text-[#1E1E1E] bg-lightGray rounded-lg">
                    {firebaseUid ? (
                      firebaseUid
                    ) : (
                      <div className="bg-gray-300 animate-pulse h-6 w-full rounded-lg" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                {firebaseUid && (
                  <div className="p-2 bg-blue-500 text-white rounded-md text-center">
                    <Link href="/avatars" onClick={handleClick}>
                      <div className="bg-blue-500 text-white rounded-lg px-8 text-center flex justify-center items-center">
                        {loading ? (
                          <LoaderCircle
                            className={`animate-spin transition`}
                          />
                        ) : (
                          "Avatars"
                        )}
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-full gap-[100px] px-[30px]">
            <div className="flex flex-col gap-[30px] bg-white shadow-pop-up-shadow rounded-2xl p-[30px] max-w-[616px] w-full">
              <div className="flex flex-col items-center mb-4">
                <div className="text-center font-medium  text-[26px] max-xs:text-[22px]">
                  Welcome to the Heygen API Demo!
                </div>
                <div className="text-lg text-center max-xs:text-xs mt-5 xs:px-9">
                  This demo showcases the capabilities of the Heygen API, allowing
                  you to interact with various features and explore the potential
                  of integrating Heygen into your projects. Sign in to start
                  exploring the features, or learn more about what you can achieve
                  with this powerful tool.
                </div>
              </div>
            </div>
          </div>
        </div>
      </SignedOut>
      <Footer />
    </>
  );
}
