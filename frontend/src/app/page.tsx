"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/documents" : "/login");
  }, [loading, user, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-ink-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-signal" />
    </div>
  );
}
