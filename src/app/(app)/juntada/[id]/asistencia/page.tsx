"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/clients";
import type { UIMember } from "@/types";

export default function AsistenciaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [members, setMembers] = useState<UIMember[]>([]);
  const [checks, setChecks] = useState<boolean[]>([]);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: eventData } = await supabase
      .from("events").select("group_id").eq("id", id).single();
    if (!eventData?.group_id) return;

    const [membersResult, attendanceResult] = await Promise.all([
      supabase.from("group_members").select("user_id").eq("group_id", eventData.group_id),
      supabase.from("event_attendance").select("user_id").eq("event_id", id),
    ]);

    const memberUserIds = (membersResult.data ?? []).map(m => m.user_id);
    const { data: profilesData } = await supabase.from("profiles").select("id, name").in("id", memberUserIds);
    const profileMap = Object.fromEntries((profilesData ?? []).map(p => [p.id, p.name]));

    const memberList: UIMember[] = (membersResult.data ?? []).map((m, i) => ({
      id: m.user_id,
      name: profileMap[m.user_id] ?? "Usuario",
      colorIndex: i,
    }));
    const attendedIds = new Set((attendanceResult.data ?? []).map(a => a.user_id));
    setMembers(memberList);
    setChecks(memberList.map(m => attendedIds.has(m.id)));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const toggle = (i: number) => {
    setChecks(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  const handleConfirm = async () => {
    const supabase = createClient();
    const attendedIds = members.filter((_, i) => checks[i]).map(m => m.id);
    await supabase.from("event_attendance").delete().eq("event_id", id);
    if (attendedIds.length > 0) {
      await supabase.from("event_attendance").insert(
        attendedIds.map(userId => ({ event_id: id, user_id: userId }))
      );
    }
    router.push(`/juntada/${id}`);
  };

  const count = checks.filter(Boolean).length;

  return (
    <div className="max-w-lg mx-auto pb-8">
      <div className="px-4 md:px-6 pt-4">
        <button
          onClick={() => router.push(`/juntada/${id}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-3"
        >
          <ChevronLeft size={16} />
          Volver
        </button>
        <h2 className="font-display font-bold text-xl text-humo">
          ¿Quién vino de verdad?
        </h2>
        <p className="text-sm text-niebla mt-1.5">
          {count} de {members.length} fueron
        </p>
      </div>

      <div className="px-4 md:px-6 mt-2">
        {members.map((m, i) => (
          <div
            key={m.id}
            onClick={() => toggle(i)}
            className={`flex items-center gap-3 py-3 cursor-pointer ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
          >
            <Avatar name={m.name} colorIndex={m.colorIndex} />
            <span className="flex-1 text-[15px] text-humo">{m.name}</span>
            <div className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${checks[i] ? "bg-fuego" : "bg-niebla/30"}`}>
              <div className={`w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-[left] ${checks[i] ? "left-[21px]" : "left-[3px]"}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 md:px-6 mt-5">
        <Button full onClick={handleConfirm}>Confirmar asistencia</Button>
      </div>
    </div>
  );
}
