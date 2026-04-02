"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, Key, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/api-keys", label: "API Keys", icon: Key },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, refreshToken } = useAuthStore();

  async function handleLogout() {
    if (refreshToken) {
      await api.post("/v1/auth/logout", { refresh_token: refreshToken }).catch(() => {});
    }
    logout();
    router.push("/login");
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-card flex flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b">
          <span className="font-semibold text-lg tracking-tight">Vaaniq</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
