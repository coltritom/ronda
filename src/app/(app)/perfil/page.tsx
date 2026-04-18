"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import { Avatar } from "@/components/ui/Avatar";
import { MOCK_GROUPS } from "@/lib/constants";
import { LogOut, ChevronRight, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/clients";

function SettingRow({ label, value, onClick }: { label: string; value?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-3 bg-transparent border-none cursor-pointer text-left"
    >
      <span className="text-[15px] text-humo">{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-niebla">{value}</span>}
        <ChevronRight size={16} className="text-niebla" />
      </div>
    </button>
  );
}

export default function PerfilPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Avatar + Info */}
      <div className="text-center pt-8 mb-6 px-4">
        <div className="mx-auto mb-3 flex justify-center">
          <Avatar emoji="🙋‍♂️" name="Tomi" colorIndex={1} size="lg" selected />
        </div>
        <h1 className="font-display font-bold text-[22px] text-humo">Tomi</h1>
        <p className="text-sm text-niebla mt-0.5">tomi@email.com</p>
      </div>

      <div className="px-4 flex flex-col gap-3">
        {/* Apariencia */}
        <div className="bg-noche-media rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[15px] text-humo">Modo oscuro</p>
              <p className="text-[13px] text-niebla mt-0.5">
                {theme === "dark" ? "Activado" : "Desactivado"}
              </p>
            </div>
            <button
              onClick={toggle}
              className={`
                w-12 h-7 rounded-full border-none cursor-pointer relative transition-colors
                ${theme === "dark" ? "bg-fuego" : "bg-niebla/40"}
              `}
            >
              <div
                className={`
                  w-[22px] h-[22px] rounded-full bg-white absolute top-[3px] transition-[left]
                  ${theme === "dark" ? "left-[23px]" : "left-[3px]"}
                `}
              />
            </button>
          </div>
        </div>

        {/* Cuenta */}
        <div className="bg-noche-media rounded-2xl px-4 divide-y divide-white/[0.06]">
          <SettingRow label="Nombre" value="Tomi" />
          <SettingRow label="Email" value="tomi@email.com" />
          <SettingRow label="Contraseña" value="••••••••" />
        </div>

        {/* Mis grupos */}
        <div className="bg-noche-media rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mb-2.5">
            Mis grupos
          </p>
          {MOCK_GROUPS.map((g, i) => (
            <div
              key={g.id}
              className={`py-2.5 ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
            >
              <span className="text-[15px] text-humo">
                {g.emoji} {g.name}
              </span>
            </div>
          ))}
        </div>

        {/* Feedback — solo mobile */}
        <button
          onClick={() => router.push("/feedback")}
          className="md:hidden flex items-center justify-center gap-2 py-3 text-fuego font-semibold text-sm bg-transparent border-none cursor-pointer"
        >
          <MessageSquare size={16} />
          Mandanos feedback
        </button>

        {/* Cerrar sesión */}
        <button onClick={handleLogout} className="flex items-center justify-center gap-2 py-3 text-error font-semibold text-sm bg-transparent border-none cursor-pointer mt-2">
          <LogOut size={16} />
          Cerrar sesión
        </button>

        <p className="text-center text-xs text-niebla/50 mt-4">
          Ronda v1.0 · Hecho con ❤️ en Argentina
        </p>
      </div>
    </div>
  );
}
