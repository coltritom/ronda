"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/clients";
import { CreateGroupSheet } from "@/components/grupo/CreateGroupSheet";

interface Group {
  id: string;
  name: string;
}

export function MyGroups() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("group_members")
        .select("groups ( id, name )")
        .eq("user_id", user.id);

      if (data) {
        const mapped = data
          .map((d) => {
            const g = d.groups;
            if (!g) return null;
            const single = Array.isArray(g) ? g[0] : g;
            return single as Group | null;
          })
          .filter((g): g is Group => g !== null);
        setGroups(mapped);
      }
    }
    load();
  }, []);

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
              onClick={() => router.push(`/grupo/${g.id}`)}
              className="
                flex-1 bg-noche-media dark:bg-noche-media bg-crema rounded-[14px]
                py-3.5 px-2.5 text-center cursor-pointer border-none
                transition-all active:scale-[0.97] hover:opacity-90
                relative
              "
            >
              <span className="text-2xl block">{g.name[0]?.toUpperCase()}</span>
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
