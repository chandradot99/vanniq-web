"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AudioLines } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (hasHydrated && accessToken) {
      router.replace("/agents");
    }
  }, [hasHydrated, accessToken, router]);

  if (!hasHydrated) return null;
  if (accessToken) return null;

  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <AudioLines className="h-5 w-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Naaviq</span>
        </div>

        {children}
      </div>
    </div>
  );
}
