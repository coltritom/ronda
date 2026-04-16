"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Users, User } from "lucide-react";

const TABS = [
  { id: "home", icon: Home, label: "Inicio", href: "/home" },
  { id: "grupos", icon: Users, label: "Grupos", href: "/grupos" },
  { id: "perfil", icon: User, label: "Perfil", href: "/perfil" },
];

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveTab = () => {
    if (pathname === "/perfil") return "perfil";
    if (pathname === "/home") return "home";
    if (pathname === "/grupos" || pathname.startsWith("/grupo/") || pathname.startsWith("/juntada/")) return "grupos";
    return "home";
  };

  const activeTab = getActiveTab();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-white/[0.06] dark:border-white/[0.06] border-black/[0.06] bg-noche dark:bg-noche bg-hueso">
      <div className="flex justify-around items-center px-2 pt-2 pb-3">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              className={`
                flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer
                transition-colors
                ${active ? "text-fuego" : "text-niebla dark:text-niebla text-gris-cal"}
              `}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span className={`text-[10px] ${active ? "font-semibold" : "font-normal"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
