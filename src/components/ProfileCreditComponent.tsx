"use client";

import useProfileStore from "@/zustand/useProfileStore";
import Link from "next/link";

export default function ProfileCreditComponent() {
    const profile = useProfileStore((state) => state.profile);

    return (
        <div className="flex flex-col p-5 border border-lightGray bg-lightGray mt-[60px] max-sm:mt-[30px] rounded-[10px] shadow-drop-shadow">
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex max-sm:flex-col gap-2 w-full items-center">
                    <div className="flex-1 text-lg font-medium">
                        Credits Available: {Math.round(profile.credits)}
                    </div>
                    <Link
                        className="bg-blue-500 text-white px-[60px] py-3 rounded-md hover:opacity-50 text-center"
                        href={"/payment-attempt"}
                    >
                        Buy 10,000 Credits
                    </Link>
                </div>
            </div>
        </div>
    );
}
