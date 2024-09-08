import { useAuthStore } from "@/zustand/useAuthStore";

export default function AuthDataDisplay() {
  const uid = useAuthStore((s) => s.uid);
  const authEmail = useAuthStore((s) => s.authEmail);

  return (
    <div className="flex flex-col px-5 py-3 space-y-3 border border-gray-500 rounded-md">
      <div className="flex flex-col space-y-1">
        <div className="text-sm">Login email</div>
        <div className="px-3 py-2 text-black bg-gray-400 rounded-md h-10">
          {authEmail}
        </div>
      </div>
      <div className="flex flex-col space-y-1">
        <div className="text-sm">User ID</div>
        <div className="px-3 py-2 text-black bg-gray-400 rounded-md h-10">
          {uid}
        </div>
      </div>
    </div>
  );
}
