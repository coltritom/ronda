"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, User } from "lucide-react";
import { createClient } from "@/lib/supabase/clients";

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [avatarEmoji, setAvatarEmoji] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("ronda_avatar");
    if (cached) { setAvatarEmoji(cached); return; }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      const emoji = user?.user_metadata?.avatar_emoji;
      if (emoji) setAvatarEmoji(emoji);
    });
  }, []);

  const getActiveTab = () => {
    if (pathname === "/perfil") return "perfil";
    if (pathname === "/home") return "home";
    if (pathname === "/grupos" || pathname.startsWith("/grupo/") || pathname.startsWith("/juntada/")) return "grupos";
    return "home";
  };

  const activeTab = getActiveTab();

  const TABS = [
    { id: "home", icon: <Home size={20} strokeWidth={activeTab === "home" ? 2.5 : 2} />, label: "Inicio", href: "/home" },
    { id: "grupos", icon: <Users size={20} strokeWidth={activeTab === "grupos" ? 2.5 : 2} />, label: "Grupos", href: "/grupos" },
    {
      id: "perfil",
      icon: avatarEmoji
        ? <span className={`text-[20px] leading-none ${activeTab === "perfil" ? "opacity-100" : "opacity-60"}`}>{avatarEmoji}</span>
        : <User size={20} strokeWidth={activeTab === "perfil" ? 2.5 : 2} />,
      label: "Perfil",
      href: "/perfil",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-white/[0.06] dark:border-white/[0.06] border-black/[0.06] bg-noche dark:bg-noche bg-hueso">
      <div className="flex justify-around items-center px-2 pt-2 pb-3">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
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
              {tab.icon}
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
