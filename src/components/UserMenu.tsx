"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useAuthContext } from "@/components/AuthProvider";

export default function UserMenu() {
  const { user, signOutUser } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const label = user.displayName || user.email || "Account";

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm text-slate-900 hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        {label}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-10 mt-2 w-56 rounded-md border border-slate-200 bg-white p-2 shadow-md"
        >
          {user.email && (
            <p className="px-2 py-1 text-xs text-slate-600 break-all">{user.email}</p>
          )}
          <button
            type="button"
            role="menuitem"
            className="w-full rounded-md px-2 py-2 text-left text-sm text-slate-900 hover:bg-slate-100 disabled:text-slate-400"
            disabled={signingOut}
            onClick={() => {
              setSigningOut(true);
              void signOutUser()
                .catch(() => {
                  setSigningOut(false);
                })
                .finally(() => setOpen(false));
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
