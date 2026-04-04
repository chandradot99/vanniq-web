"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AudioLines, Bot, Plug, Settings, LogOut, PanelLeftClose, PanelLeftOpen, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings/platform", label: "Platform Settings", icon: Settings },
];

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}

function SidebarItem({ icon: Icon, label, collapsed, active, onClick, href }: SidebarItemProps) {
  const baseClass = cn(
    "relative group flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm transition-colors",
    collapsed && "justify-center px-0",
    active
      ? "bg-primary/10 text-primary font-medium"
      : "text-muted-foreground hover:bg-accent hover:text-foreground"
  );

  const inner = (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
      {collapsed && (
        <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-popover border border-border text-xs text-foreground whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none shadow-md transition-opacity duration-150">
          {label}
        </span>
      )}
    </>
  );

  if (href) {
    return <Link href={href} className={baseClass}>{inner}</Link>;
  }
  return <button onClick={onClick} className={baseClass}>{inner}</button>;
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { logout, refreshToken } = useAuthStore();
  const { resolvedTheme, setTheme } = useTheme();

  async function handleLogout() {
    if (refreshToken) {
      await api.post("/v1/auth/logout", { refresh_token: refreshToken }).catch(() => {});
    }
    logout();
    router.push("/login");
  }

  return (
    <aside
      className={cn(
        "relative border-r border-border/60 bg-sidebar flex flex-col shrink-0 transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Toggle button — sits on the right border, vertically centered */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-30 h-6 w-6 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent shadow-sm transition-colors"
      >
        {collapsed ? <PanelLeftOpen className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
      </button>

      {/* Logo */}
      <div className="h-14 flex items-center border-b border-border/60 px-3 gap-2 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
          <AudioLines className="h-4 w-4" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight flex-1 truncate">Vaaniq</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {NAV.map(({ href, label, icon }) => (
          <SidebarItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            collapsed={collapsed}
            active={pathname.startsWith(href)}
          />
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-2 border-t border-border/60 space-y-0.5">
        <SidebarItem
          icon={resolvedTheme === "dark" ? Moon : Sun}
          label="Toggle theme"
          collapsed={collapsed}
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        />
        <SidebarItem
          icon={LogOut}
          label="Sign out"
          collapsed={collapsed}
          onClick={handleLogout}
        />
      </div>
    </aside>
  );
}
