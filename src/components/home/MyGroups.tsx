"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/clients";
import { useAuth } from "@/lib/supabase/auth-context";
import { CreateGroupSheet } from "@/components/grupo/CreateGroupSheet";

interface Group {
  id: string;
  name: string;
  emoji: string;
}

export function MyGroups() {
  const router = useRouter();
  const user = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const supabase = createClient();

      const { data } = await supabase
        .from("group_members")
        .select("groups ( id, name, emoji )")
        .eq("user_id", user.id);

      if (data) {
        const mapped = data
          .map((d) => {
            const g = Array.isArray(d.groups) ? d.groups[0] : d.groups;
            const s = g as { id: string; name: string; emoji: string | null } | null;
            if (!s) return null;
            return { id: s.id, name: s.name, emoji: s.emoji ?? s.name.charAt(0).toUpperCase() };
          })
          .filter((g): g is Group => g !== null);

        setGroups(mapped);
      }
    }
    load();
  }, [user]);

  return (
    <div className="px-4 md:px-6 mb-3">
      <div className="flex justify-between items-center mb-2">
        <p className="font-display font-semibold text-[15px] text-carbon dark:text-humo m-0">
          Tus grupos
        </p>
        <button onClick={() => setSheetOpen(true)} className="text-xs font-semibold text-fuego bg-transparent border-none cursor-pointer">
          + Crear
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="bg-noche-media dark:bg-noche-media bg-crema rounded-[14px] py-5 px-4 text-center">
          <p className="text-xs text-niebla dark:text-niebla text-gris-cal">
            Todavía no tenés grupos.
          </p>
        </div>
      ) : (
        <div className="flex gap-2">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => router.push(`/groups/${g.id}`)}
              className="
                flex-1 bg-noche-media dark:bg-noche-media bg-crema rounded-[14px]
                py-3.5 px-2.5 text-center cursor-pointer border-none
                transition-all active:scale-[0.97] hover:opacity-90
                relative
              "
            >
              <span className="text-2xl block">{g.emoji}</span>
              <p className="
                text-xs font-semibold text-carbon dark:text-humo mt-1.5
                overflow-hidden text-ellipsis whitespace-nowrap
              ">
                {g.name}
              </p>
            </button>
          ))}
        </div>
      )}

      <CreateGroupSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
