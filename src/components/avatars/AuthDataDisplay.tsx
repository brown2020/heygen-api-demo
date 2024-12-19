import { useAuthStore } from "@/zustand/useAuthStore";

export default function AuthDataDisplay() {
  const uid = useAuthStore((s) => s.uid);
  const authEmail = useAuthStore((s) => s.authEmail);

  return (
    <div className="flex flex-col p-5 border rounded-[10px] shadow-[rgba(50,_50,_105,_0.15)_0px_2px_5px_0px,_rgba(0,_0,_0,_0.05)_0px_1px_1px_0px]">
    <h2 className="text-2xl font-sans font-medium mb-5 max-sm:text-lg max-sm:mb-7">User Profile</h2>
    <div className="flex flex-col">
      <div className="text-base mb-1">Login email</div>
      <div className="px-[15px] py-[10px] text-sm text-black bg-lightGray rounded-lg h-10 overflow-x-auto overflow-y-hidden">
        {authEmail}
      </div>
    </div>
    <div className="flex flex-col mt-[15px]">
      <div className="text-base mb-1">User ID</div>
      <div className="px-[15px] py-[10px] text-black text-sm bg-lightGray rounded-lg h-10 overflow-x-auto overflow-y-hidden">
        {uid}
      </div>
    </div>
  </div>
  );
}
