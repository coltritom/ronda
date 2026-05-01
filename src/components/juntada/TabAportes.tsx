"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { X, Plus, ChevronDown } from "lucide-react";
import { APORTE_CATEGORIES, type AporteId } from "@/lib/constants";
import { createClient } from "@/lib/supabase/clients";

interface Aporte {
  id: string;
  memberId: string;
  memberName: string;
  categoryId: AporteId;
  note?: string;
}

interface Participant {
  id: string;
  name: string;
  colorIndex: number;
}

interface TabAportesProps {
  juntadaId: string;
  groupId: string;
}

export function TabAportes({ juntadaId, groupId }: TabAportesProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [aportes, setAportes] = useState<Aporte[]>([]);
  const [adding, setAdding] = useState(false);
  const [newMember, setNewMember] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<AporteId | null>(null);
  const [newNote, setNewNote] = useState("");
  const [catOpen, setCatOpen] = useState(false);

  const load = useCallback(async () => {
    if (!groupId) return;
    const supabase = createClient();
    const [membersResult, guestsResult, aportesResult] = await Promise.all([
      supabase.from("group_members").select("user_id, profiles(name)").eq("group_id", groupId),
      supabase.from("event_guests").select("id, name").eq("event_id", juntadaId),
      supabase.from("event_aportes").select("id, member_id, member_name, category_id, note")
        .eq("event_id", juntadaId).order("created_at"),
    ]);

    const memberList: Participant[] = (membersResult.data ?? []).map((m, i) => {
      const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return { id: m.user_id, name: (p as { name: string } | null)?.name ?? "Usuario", colorIndex: i };
    });
    const guestList: Participant[] = (guestsResult.data ?? []).map((g, i) => ({
      id: g.id, name: g.name, colorIndex: (memberList.length + i) % 8,
    }));
    setParticipants([...memberList, ...guestList]);

    setAportes((aportesResult.data ?? []).map(a => ({
      id: a.id,
      memberId: a.member_id,
      memberName: a.member_name,
      categoryId: a.category_id as AporteId,
      note: a.note ?? undefined,
    })));
  }, [juntadaId, groupId]);

  useEffect(() => { load(); }, [load]);

  const grouped = aportes.reduce((acc, a) => {
    if (!acc[a.memberId]) acc[a.memberId] = [];
    acc[a.memberId].push(a);
    return acc;
  }, {} as Record<string, Aporte[]>);

  const scores = Object.entries(grouped).map(([memberId, items]) => {
    const total = items.reduce((sum, item) => {
      const cat = APORTE_CATEGORIES.find(c => c.id === item.categoryId);
      return sum + (cat?.weight || 1);
    }, 0);
    return { memberId, total, count: items.length };
  }).sort((a, b) => b.total - a.total);

  const getParticipant = (memberId: string, memberName: string): Participant => {
    return participants.find(m => m.id === memberId) ?? { id: memberId, name: memberName, colorIndex: 0 };
  };

  const handleAdd = async () => {
    if (!newMember) { toast.error("Seleccioná quién aportó."); return; }
    if (!newCategory) { toast.error("Elegí qué llevó."); return; }
    const participant = participants.find(p => p.id === newMember);
    if (!participant) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("event_aportes")
      .insert({
        event_id: juntadaId,
        member_id: newMember,
        member_name: participant.name,
        category_id: newCategory,
        note: newNote || null,
      })
      .select("id")
      .single();
    if (data) {
      setAportes(prev => [...prev, {
        id: data.id,
        memberId: newMember,
        memberName: participant.name,
        categoryId: newCategory,
        note: newNote || undefined,
      }]);
    }
    setNewMember(null);
    setNewCategory(null);
    setNewNote("");
    setAdding(false);
  };

  const handleRemove = async (aporteId: string) => {
    const supabase = createClient();
    await supabase.from("event_aportes").delete().eq("id", aporteId);
    setAportes(prev => prev.filter(a => a.id !== aporteId));
  };

  const selectedCat = APORTE_CATEGORIES.find(c => c.id === newCategory);

  return (
    <div className="px-4 md:px-6 py-4">
      {aportes.length === 0 && !adding ? (
        <div className="text-center py-10">
          <p className="text-sm text-niebla mb-1">Nadie aportó nada todavía.</p>
          <p className="text-xs text-niebla/60 mb-4">Es opcional — no todas las juntadas necesitan aportes.</p>
          <Button onClick={() => setAdding(true)}>Agregar aporte</Button>
        </div>
      ) : (
        <>
          {Object.entries(grouped).map(([memberId, items], gi) => {
            const member = getParticipant(memberId, items[0].memberName);
            const score = scores.find(s => s.memberId === memberId);
            return (
              <div
                key={memberId}
                className={`pb-3 mb-3 ${gi > 0 ? "border-t border-white/[0.06] pt-3" : ""}`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <Avatar name={member.name} colorIndex={member.colorIndex} />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-humo">{member.name}</p>
                    <p className="text-[11px] text-niebla">
                      {score?.count} aporte{score?.count !== 1 ? "s" : ""} · {score?.total} pts
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 ml-[50px]">
                  {items.map(a => {
                    const cat = APORTE_CATEGORIES.find(c => c.id === a.categoryId)!;
                    return (
                      <div key={a.id} className="flex items-center gap-2 group">
                        <span className="text-sm">{cat.emoji}</span>
                        <span className="text-sm text-humo">{cat.label}</span>
                        {a.note && <span className="text-xs text-niebla">— {a.note}</span>}
                        <span className="text-[10px] text-niebla/50 ml-auto">+{cat.weight}</span>
                        <button
                          onClick={() => handleRemove(a.id)}
                          className="opacity-0 group-hover:opacity-100 text-niebla bg-transparent border-none cursor-pointer p-0.5 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {scores.length > 1 && (
            <div className="bg-noche rounded-xl p-3 mb-4">
              <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mb-2">
                Puntaje de aportes
              </p>
              <p className="text-[10px] text-niebla/60 mb-2">
                No es lo mismo llevar la carne que llevar hielo. Cada aporte tiene un peso distinto.
              </p>
              {scores.map((s, i) => {
                const member = getParticipant(s.memberId, grouped[s.memberId][0].memberName);
                return (
                  <div key={s.memberId} className={`flex items-center gap-2 py-1.5 ${i > 0 ? "border-t border-white/[0.04]" : ""}`}>
                    <span className="w-4 text-center text-xs font-bold text-niebla">{i + 1}</span>
                    <Avatar name={member.name} colorIndex={member.colorIndex} size="sm" />
                    <span className="flex-1 text-sm text-humo">{member.name}</span>
                    <span className="text-sm font-semibold text-humo">{s.total} pts</span>
                  </div>
                );
              })}
            </div>
          )}

          {adding ? (
            <div className="bg-noche-media rounded-2xl p-4 flex flex-col gap-3">
              <p className="font-semibold text-sm text-humo">Agregar aporte</p>

              <div>
                <p className="text-xs text-niebla mb-1.5">¿Quién aportó?</p>
                <div className="flex gap-2 flex-wrap">
                  {participants.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setNewMember(m.id)}
                      className={`
                        flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border-none cursor-pointer transition-all
                        ${newMember === m.id ? "bg-fuego/[0.12] ring-1 ring-fuego/30" : "bg-white/5"}
                      `}
                    >
                      <Avatar name={m.name} colorIndex={m.colorIndex} size="sm" />
                      <span className={`text-xs font-medium ${newMember === m.id ? "text-humo" : "text-niebla"}`}>
                        {m.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <p className="text-xs text-niebla mb-1.5">¿Qué llevó?</p>
                <button
                  onClick={() => setCatOpen(!catOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] border-[1.5px] border-white/[0.08] bg-noche cursor-pointer"
                >
                  {selectedCat ? (
                    <span className="flex items-center gap-2 text-sm text-humo">
                      <span>{selectedCat.emoji}</span>
                      {selectedCat.label}
                      <span className="text-[10px] text-niebla">+{selectedCat.weight}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-niebla/50">Elegí qué llevó</span>
                  )}
                  <ChevronDown size={16} className={`text-niebla transition-transform ${catOpen ? "rotate-180" : ""}`} />
                </button>
                {catOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-noche-media rounded-xl border border-white/[0.08] overflow-hidden z-10 shadow-lg max-h-[200px] overflow-y-auto">
                    {APORTE_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setNewCategory(cat.id); setCatOpen(false); }}
                        className={`
                          w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left border-none cursor-pointer text-sm transition-colors
                          ${newCategory === cat.id ? "bg-fuego/10 text-fuego font-medium" : "bg-transparent text-humo hover:bg-white/5"}
                        `}
                      >
                        <span>{cat.emoji}</span>
                        <span className="flex-1">{cat.label}</span>
                        <span className="text-[10px] text-niebla">+{cat.weight}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input
                type="text"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Detalle (opcional). Ej: Vacío y chorizo"
                className="
                  w-full px-3.5 py-2.5 rounded-[10px]
                  border-[1.5px] border-white/[0.08]
                  bg-noche text-sm text-humo
                  placeholder:text-niebla/50
                  outline-none font-body focus:border-fuego/50 transition-colors
                "
              />

              <div className="flex gap-2">
                <Button full onClick={handleAdd}>Agregar</Button>
                <button
                  onClick={() => { setAdding(false); setNewMember(null); setNewCategory(null); setNewNote(""); }}
                  className="px-4 py-2.5 rounded-xl text-sm text-niebla bg-transparent border border-white/[0.08] cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <Button primary={false} full onClick={() => setAdding(true)}>
                <Plus size={16} />
                Agregar aporte
              </Button>
            </div>
          )}

          <p className="text-xs text-niebla/60 text-center mt-3">
            Los aportes son opcionales. Si nadie llevó nada, no pasa nada.
          </p>
        </>
      )}
    </div>
  );
}
