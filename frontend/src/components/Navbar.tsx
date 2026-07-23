"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="flex h-14 items-center justify-between border-b border-ink-200 bg-white px-5">
      <div className="flex items-center gap-3">
        <Link href="/documents" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-950 font-display text-sm italic text-white">
            M
          </div>
          <span className="hidden font-display text-base italic text-ink-900 sm:inline">Marginal</span>
        </Link>
        {children}
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full bg-signal-soft text-xs font-semibold text-signal-dark"
              title={user.name}
            >
              {(user.name?.charAt(0) ?? "?").toUpperCase()}
            </div>
            <span className="hidden text-sm text-ink-600 md:inline">{user.name}</span>
          </div>
        )}
        <button
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="rounded-md border border-ink-200 px-3 py-1.5 text-sm text-ink-600 transition hover:bg-ink-50"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
