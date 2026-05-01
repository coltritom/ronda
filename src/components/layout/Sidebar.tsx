"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Moon, Sun, HelpCircle, MessageSquare, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/clients";
import { useTheme } from "@/lib/theme-context";

interface SidebarGroup {
  id: string;
  name: string;
  emoji: string;
  pendingCount: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [groups, setGroups] = useState<SidebarGroup[]>([]);
  const [userName, setUserName] = useState("Vos");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      const profileName = profile?.name ?? "";
      const isEmail = profileName.includes("@");
      const metaName: string =
        user.user_metadata?.display_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        "";
      const resolvedName = isEmail ? metaName : profileName;
      if (resolvedName) setUserName(resolvedName);

      const { data: memberships } = await supabase
        .from("group_members")
        .select("groups ( id, name )")
        .eq("user_id", user.id);

      const userGroups = (memberships ?? [])
        .map((m) => {
          const g = Array.isArray(m.groups) ? m.groups[0] : m.groups;
          return g as { id: string; name: string } | null;
        })
        .filter((g): g is { id: string; name: string } => g !== null);

      setGroups(
        userGroups.map((g) => ({
          id: g.id,
          name: g.name,
          emoji: g.name.charAt(0).toUpperCase(),
          pendingCount: 0,
        }))
      );
    }
    load();
  }, []);

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen fixed left-0 top-0 bg-noche-media border-r border-white/[0.06] z-40">

      {/* ─── TOP SECTION ─── */}
      <div className="px-5 pt-5 pb-3">
        <span
          onClick={() => router.push("/home")}
          className="font-display font-extrabold text-xl text-fuego tracking-tight cursor-pointer"
        >
          ronda
        </span>
      </div>

      <div className="px-3 flex flex-col gap-0.5 mb-2">
        {/* Inicio */}
        <button
          onClick={() => router.push("/home")}
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-left
            border-none cursor-pointer transition-colors
            ${pathname === "/home"
              ? "bg-fuego/10 text-fuego font-medium"
              : "bg-transparent text-niebla hover:bg-white/5"
            }
          `}
        >
          <Home size={16} />
          <span>Inicio</span>
        </button>

        {/* Perfil */}
        <button
          onClick={() => router.push("/perfil")}
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-left
            border-none cursor-pointer transition-colors
            ${pathname === "/perfil"
              ? "bg-fuego/10 text-fuego font-medium"
              : "bg-transparent text-niebla hover:bg-white/5"
            }
          `}
        >
          <div className="w-7 h-7 rounded-full bg-fuego/15 flex items-center justify-center text-sm font-bold text-fuego">
            {userName.charAt(0).toUpperCase()}
          </div>
          <span>{userName}</span>
        </button>
      </div>

      {/* ─── GRUPOS ─── */}
      <div className="px-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3 mb-2 mt-2">
          <span className="text-[11px] font-semibold text-niebla uppercase tracking-wider">
            Tus grupos
          </span>
          <button
            onClick={() => router.push("/grupos")}
            className="w-6 h-6 rounded-lg bg-fuego/10 flex items-center justify-center text-fuego cursor-pointer border-none hover:bg-fuego/20 transition-colors"
            title="Ver grupos"
          >
            <Plus size={14} />
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-niebla mb-2">Todavía no tenés grupos.</p>
            <button
              onClick={() => router.push("/grupos")}
              className="text-xs text-fuego font-semibold bg-transparent border-none cursor-pointer"
            >
              Crear grupo
            </button>
          </div>
        ) : (
          groups.map((g) => {
            const active = pathname === `/grupo/${g.id}` || pathname.startsWith(`/grupo/${g.id}/`);
            return (
              <button
                key={g.id}
                onClick={() => router.push(`/grupo/${g.id}`)}
                className={`
                  flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm w-full text-left
                  transition-colors cursor-pointer border-none mb-0.5
                  ${active
                    ? "bg-fuego/10 text-humo font-medium"
                    : "bg-transparent text-niebla hover:bg-white/5"
                  }
                `}
              >
                <span className="text-base font-bold">{g.emoji}</span>
                <span className="truncate flex-1">{g.name}</span>
                {g.pendingCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-alerta/20 text-alerta text-[10px] font-bold flex items-center justify-center shrink-0">
                    {g.pendingCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* ─── BOTTOM SECTION ─── */}
      <div className="px-3 pb-3 flex flex-col gap-0.5 border-t border-white/[0.06] pt-3">
        {/* Toggle dark/light */}
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm w-full text-left bg-transparent border-none cursor-pointer text-niebla hover:bg-white/5 transition-colors"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          {theme === "dark" ? "Modo claro" : "Modo oscuro"}
        </button>

        {/* Ayuda */}
        <button
          onClick={() => router.push("/ayuda")}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm w-full text-left bg-transparent border-none cursor-pointer text-niebla hover:bg-white/5 transition-colors"
        >
          <HelpCircle size={16} />
          Ayuda
        </button>

        {/* Feedback */}
        <button
          onClick={() => router.push("/feedback")}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm w-full text-left bg-transparent border-none cursor-pointer text-niebla hover:bg-white/5 transition-colors"
        >
          <MessageSquare size={16} />
          Mandanos feedback
        </button>
      </div>

      {/* Version */}
      <div className="px-5 pb-3">
        <p className="text-[10px] text-niebla/40">Ronda v1.0</p>
      </div>
    </aside>
  );
}
