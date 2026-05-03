"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Copy, Check, Crown, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/clients";
import { Avatar } from "@/components/ui/Avatar";
import { getOrCreateInvite } from "@/lib/actions/invites";

interface Member {
  userId: string;
  name: string;
  role: "admin" | "member";
  colorIndex: number;
}

const RANKING_OPTIONS = [
  { id: "presente",  label: "🏆 El más presente",        default: true },
  { id: "billetera", label: "💰 La billetera del grupo",  default: true },
  { id: "mvp",       label: "🏅 MVP de la ronda",         default: true },
  { id: "anfitrion", label: "🏠 Anfitrión/a de oro",      default: true },
  { id: "fantasma",  label: "👻 Fantasma oficial",        default: true },
  { id: "tarde",     label: "⏰ Siempre tarde al split",  default: true },
  { id: "deudor",    label: "😅 Deudor/a serial",         default: false },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`
        w-11 h-6 rounded-full border-none cursor-pointer relative transition-colors shrink-0
        ${checked ? "bg-fuego" : "bg-niebla/30"}
      `}
    >
      <div
        className={`
          w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-[left]
          ${checked ? "left-[21px]" : "left-[3px]"}
        `}
      />
    </button>
  );
}

export default function GroupConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [groupEmoji, setGroupEmoji] = useState("🔥");
  const [members, setMembers] = useState<Member[]>([]);
  const [myRole, setMyRole] = useState<"admin" | "member">("member");
  const [myUserId, setMyUserId] = useState("");
  const [copied, setCopied] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState("");
  const [rankings, setRankings] = useState(
    RANKING_OPTIONS.reduce((acc, r) => ({ ...acc, [r.id]: r.default }), {} as Record<string, boolean>)
  );

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setMyUserId(user.id);

    const [groupRes, membersRes] = await Promise.all([
      supabase.from("groups").select("id, name").eq("id", id).single(),
      supabase
        .from("group_members")
        .select("user_id, role")
        .eq("group_id", id),
    ]);

    if (!groupRes.data) { router.push(`/grupo/${id}`); return; }
    setGroupName(groupRes.data.name);

    // Fetch emoji separately (resilient to missing column)
    const { data: emojiRow } = await supabase
      .from("groups").select("emoji").eq("id", id).single();
    if ((emojiRow as { emoji?: string } | null)?.emoji)
      setGroupEmoji((emojiRow as { emoji: string }).emoji);

    const memberUserIds = (membersRes.data ?? []).map(m => m.user_id);
    const { data: profilesRes } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", memberUserIds);
    const profileMap = Object.fromEntries((profilesRes ?? []).map(p => [p.id, p.name]));

    const mapped: Member[] = (membersRes.data ?? []).map((m, i) => ({
      userId: m.user_id,
      name: profileMap[m.user_id] ?? "Usuario",
      role: m.role as "admin" | "member",
      colorIndex: i,
    }));
    setMembers(mapped);

    const me = mapped.find((m) => m.userId === user.id);
    if (me) setMyRole(me.role);

    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const handleCopyInvite = async () => {
    setInviteError("");
    let token = inviteToken;
    if (!token) {
      const result = await getOrCreateInvite(id);
      if ("error" in result) {
        setInviteError(result.error);
        return;
      }
      token = result.token;
      setInviteToken(token);
    }
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", id)
      .eq("user_id", user.id);
    router.push("/groups");
  };

  const handleDelete = async () => {
    const supabase = createClient();
    await supabase.from("groups").delete().eq("id", id);
    router.push("/groups");
  };

  if (loading) return (
    <div className="max-w-lg mx-auto px-4 md:px-6 pt-8 flex flex-col gap-4 animate-pulse">
      <div className="h-6 w-40 rounded-xl bg-noche-media" />
      <div className="h-28 rounded-2xl bg-noche-media" />
      <div className="h-20 rounded-2xl bg-noche-media" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto pb-8">
      {/* Header */}
      <div className="px-4 md:px-6 pt-4 pb-4">
        <button
          onClick={() => router.push(`/grupo/${id}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-3"
        >
          <ChevronLeft size={16} />
          {groupName}
        </button>
        <h1 className="font-display font-bold text-[22px] text-humo">
          Configuración del grupo
        </h1>
      </div>

      <div className="px-4 md:px-6 flex flex-col gap-3">
        {/* Info del grupo */}
        <div className="bg-noche-media rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mb-3">
            Info del grupo
          </p>
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
              {groupEmoji}
            </div>
            <span className="font-display font-semibold text-lg text-humo">{groupName}</span>
          </div>
        </div>

        {/* Link de invitación */}
        <div className="bg-noche-media rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mb-3">
            Invitación
          </p>
          <p className="text-sm text-niebla mb-3">
            Mandá este link al grupo para que se sumen.
          </p>
          <button
            onClick={handleCopyInvite}
            className={`
              w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm
              border-none cursor-pointer transition-colors
              ${copied ? "bg-menta/10 text-menta" : "bg-fuego/10 text-fuego hover:bg-fuego/15"}
            `}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Link copiado. Mandalo al grupo." : "Copiar link de invitación"}
          </button>
          {inviteError && (
            <p className="text-xs text-error mt-2 text-center">{inviteError}</p>
          )}
        </div>

        {/* Miembros */}
        <div className="bg-noche-media rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mb-3">
            Miembros · {members.length}
          </p>
          {members.map((m, i) => (
            <div
              key={m.userId}
              className={`flex items-center gap-3 py-2.5 ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
            >
              <Avatar name={m.name} colorIndex={m.colorIndex} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[15px] text-humo font-medium">{m.name}</span>
                  {m.role === "admin" && (
                    <span className="flex items-center gap-0.5 text-[10px] text-ambar font-semibold bg-ambar/10 px-1.5 py-0.5 rounded-full">
                      <Crown size={10} />
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Rankings y etiquetas */}
        <div className="bg-noche-media rounded-2xl p-4">
          <p className="text-[11px] font-semibold text-niebla uppercase tracking-wider mb-1">
            Rankings y etiquetas
          </p>
          <p className="text-xs text-niebla mb-3">
            Elegí qué rankings se muestran en este grupo.
          </p>
          {RANKING_OPTIONS.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center justify-between py-2.5 ${i > 0 ? "border-t border-white/[0.04]" : ""}`}
            >
              <span className="text-sm text-humo">{r.label}</span>
              <Toggle
                checked={rankings[r.id]}
                onChange={() => setRankings((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
              />
            </div>
          ))}
        </div>

        {/* Zona peligrosa */}
        <div className="bg-noche-media rounded-2xl p-4 mt-2">
          <p className="text-[11px] font-semibold text-error uppercase tracking-wider mb-3">
            Zona peligrosa
          </p>
          <button
            onClick={handleLeave}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-error bg-error/10 border-none cursor-pointer hover:bg-error/15 transition-colors"
          >
            <Trash2 size={16} />
            Salir del grupo
          </button>
          <p className="text-xs text-niebla text-center mt-2">
            No vas a poder volver sin una invitación nueva.
          </p>
          {myRole === "admin" && (
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-error/70 bg-transparent border-none cursor-pointer hover:text-error transition-colors mt-1"
            >
              Eliminar el grupo para todos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
