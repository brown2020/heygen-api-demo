import { DEMO_MODE_ERROR_NOTICE } from "@/libs/heygen-demo";

export function DemoModeNotice({ notice }: { notice?: string | null }) {
  const text = notice?.trim() || DEMO_MODE_ERROR_NOTICE;
  return (
    <div
      role="status"
      className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      {text}
    </div>
  );
}
