"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Copy, Check,
  LogOut, Trash2, Loader2, Shield, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/clients";
import { useAuth } from "@/lib/supabase/auth-context";
import { getOrCreateInvite } from "@/lib/actions/invites";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "admin" | "member";
type HumorIntensity = "light" | "medium" | "spicy";
type Currency = "ARS" | "USD";

interface GroupData {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  created_by: string;
}

interface GroupSettings {
  humor_enabled: boolean;
  humor_intensity: HumorIntensity;
  default_currency: Currency;
}

interface Member {
  user_id: string;
  role: Role;
  joined_at: string;
  profiles: { name: string; avatar_url: string | null } | null;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const EMOJIS = ["🔥", "⚽", "🏖️", "🎮", "🍕", "🍺", "🎯", "🏀", "🎸", "🏠", "🚗", "🎂", "🌴", "🎉", "🐾"];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Overlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const user = useAuth();

  // ── Meta
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<Role>("member");
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAdmin = myRole === "admin";

  // ── Group editable fields
  const [group, setGroup] = useState<GroupData | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editEmoji, setEditEmoji] = useState("🔥");
  const [savingGroup, setSavingGroup] = useState(false);

  const isDirty = group
    ? editName !== group.name ||
      editDesc !== (group.description ?? "") ||
      editEmoji !== (group.emoji ?? "🔥")
    : false;

  // ── Settings (kept in state for future use)
  const [settings, setSettings] = useState<GroupSettings>({
    humor_enabled: false,
    humor_intensity: "medium",
    default_currency: "ARS",
  });

  // ── Members
  const [members, setMembers] = useState<Member[]>([]);

  // ── Invite
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Danger zone
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Promote
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);

  // ─── Load data ────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    setCurrentUserId(user.id);

    const [{ data: groupData }, { data: membershipData }] = await Promise.all([
      supabase.from("groups").select("id, name, description, emoji, created_by").eq("id", id).single(),
      supabase.from("group_members").select("role").eq("group_id", id).eq("user_id", user.id).single(),
    ]);

    if (!membershipData) { router.push("/groups"); return; }
    if (groupData) {
      setGroup(groupData as GroupData);
      setEditName(groupData.name);
      setEditDesc(groupData.description ?? "");
      setEditEmoji((groupData as GroupData).emoji ?? "🔥");
      setIsCreator(groupData.created_by === user.id);
    }
    setMyRole(membershipData.role as Role);

    const { data: settingsData } = await supabase
      .from("group_settings")
      .select("humor_enabled, humor_intensity, default_currency")
      .eq("group_id", id)
      .maybeSingle();

    if (settingsData) {
      setSettings({
        humor_enabled: settingsData.humor_enabled ?? false,
        humor_intensity: (settingsData.humor_intensity as HumorIntensity) ?? "medium",
        default_currency: (settingsData.default_currency as Currency) ?? "ARS",
      });
    }

    const { data: membersData } = await supabase
      .from("group_members")
      .select("user_id, role, joined_at")
      .eq("group_id", id)
      .order("joined_at");

    if (membersData) {
      const memberUserIds = membersData.map(m => m.user_id);
      const { data: profilesData } = await supabase
        .from("profiles").select("id, name, avatar_url").in("id", memberUserIds);
      const profileMap = Object.fromEntries(
        (profilesData ?? []).map(p => [p.id, { name: p.name, avatar_url: p.avatar_url }])
      );
      setMembers(membersData.map(m => ({
        user_id: m.user_id,
        role: m.role as Role,
        joined_at: m.joined_at,
        profiles: profileMap[m.user_id] ?? null,
      })));
    }

    setLoading(false);
  }, [id, router, user]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Save group ───────────────────────────────────────────────────────────

  const handleSaveGroup = async () => {
    if (!editName.trim()) { toast.error("El nombre no puede estar vacío."); return; }
    setSavingGroup(true);
    const supabase = createClient();
    const { error } = await supabase.from("groups")
      .update({ name: editName.trim(), description: editDesc.trim() || null, emoji: editEmoji })
      .eq("id", id);
    setSavingGroup(false);
    if (error) { toast.error("No se pudo guardar."); return; }
    setGroup((prev) =>
      prev ? { ...prev, name: editName.trim(), description: editDesc.trim() || null, emoji: editEmoji } : prev
    );
    toast.success("Cambios guardados ✓");
  };

  // ─── Invite helpers ───────────────────────────────────────────────────────

  const handleCopy = async () => {
    let token = inviteToken;
    if (!token) {
      const result = await getOrCreateInvite(id);
      if ("error" in result) { toast.error("No se pudo generar el link."); return; }
      token = result.token;
      setInviteToken(token);
    }
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ─── Promote ──────────────────────────────────────────────────────────────

  const handlePromote = async (userId: string) => {
    setPromoting(userId);
    const supabase = createClient();
    const { error } = await supabase.from("group_members")
      .update({ role: "admin" }).eq("group_id", id).eq("user_id", userId);
    setPromoting(null);
    if (error) { toast.error("No se pudo promover."); return; }
    setMembers((prev) => prev.map((m) => (m.user_id === userId ? { ...m, role: "admin" } : m)));
    toast.success("Admin promovido ✓");
    setShowPromoteModal(false);
  };

  // ─── Leave ────────────────────────────────────────────────────────────────

  const handleLeave = async () => {
    setLeaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("group_members")
      .delete().eq("group_id", id).eq("user_id", currentUserId!);
    setLeaving(false);
    if (error) { toast.error("No se pudo salir del grupo."); return; }
    toast.success("Saliste del grupo.");
    router.push("/groups");
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!group || deleteConfirmText !== group.name) { toast.error("El nombre no coincide."); return; }
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("groups").delete().eq("id", id);
    setDeleting(false);
    if (error) { toast.error("No se pudo eliminar el grupo."); return; }
    toast.success("Grupo eliminado.");
    router.push("/groups");
  };

  // ─── Render: loading ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 size={22} className="animate-spin text-niebla" />
      </div>
    );
  }

  const admins    = members.filter((m) => m.role === "admin");
  const nonAdmins = members.filter((m) => m.role !== "admin");

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-4 pb-8 flex flex-col gap-4">

        {/* Back */}
        <button
          onClick={() => router.push(`/groups/${id}`)}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 self-start"
        >
          <ChevronLeft size={16} />
          Volver al grupo
        </button>

        {/* ── 1. Datos del grupo ─────────────────────────────────────── */}
        <div className="bg-noche-media rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-niebla">Datos del grupo</p>

          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                disabled={!isAdmin}
                onClick={() => setEditEmoji(e)}
                className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border-none cursor-pointer transition-all disabled:cursor-default
                  ${editEmoji === e ? "bg-fuego/15 ring-2 ring-fuego/40" : "bg-noche hover:bg-noche/60 disabled:opacity-60"}`}
              >
                {e}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            disabled={!isAdmin}
            placeholder="Nombre del grupo"
            className="w-full px-4 py-3 rounded-xl bg-noche text-humo text-sm outline-none focus:ring-1 focus:ring-fuego/40 disabled:opacity-60 placeholder:text-niebla/50"
          />

          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            disabled={!isAdmin}
            rows={2}
            placeholder="De qué va el grupo… (opcional)"
            className="w-full px-4 py-3 rounded-xl bg-noche text-humo text-sm outline-none focus:ring-1 focus:ring-fuego/40 disabled:opacity-60 placeholder:text-niebla/50 resize-none"
          />

          {isAdmin && isDirty && (
            <button
              onClick={handleSaveGroup}
              disabled={savingGroup}
              className="w-full py-3 rounded-xl bg-fuego text-white text-sm font-semibold transition-colors hover:bg-fuego/90 disabled:opacity-50"
            >
              {savingGroup ? "Guardando…" : "Guardar cambios"}
            </button>
          )}

          {!isAdmin && (
            <p className="text-xs text-niebla">Solo los admins pueden editar los datos del grupo.</p>
          )}
        </div>

        {/* ── 2. Invitación ──────────────────────────────────────────── */}
        <div className="bg-noche-media rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-niebla">Invitación</p>

          {!isAdmin ? (
            <p className="text-sm text-niebla">Solo los admins pueden gestionar el link de invitación.</p>
          ) : (
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-semibold border-none cursor-pointer transition-all
                ${copied
                  ? "bg-menta/[0.15] text-menta"
                  : "bg-noche text-fuego hover:bg-noche/60"
                }`}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "¡Link copiado!" : "Copiar link de invitación"}
            </button>
          )}
        </div>

        {/* ── 3. Tu rol ──────────────────────────────────────────────── */}
        <div className="bg-noche-media rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-niebla">Tu rol</p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isAdmin ? "bg-fuego/10 text-fuego" : "bg-niebla/10 text-niebla"}`}>
              {isAdmin ? "👑 Admin" : "👤 Miembro"}
            </span>
            {isCreator && (
              <span className="rounded-full px-3 py-1 text-sm font-semibold bg-ambar/10 text-ambar">
                ⭐ Creador
              </span>
            )}
          </div>

          {isAdmin && admins.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {admins.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 rounded-xl bg-noche px-3 py-2.5">
                  <Avatar name={m.profiles?.name ?? "?"} src={m.profiles?.avatar_url} size="sm" />
                  <span className="text-sm text-humo flex-1">
                    {m.user_id === currentUserId ? "Vos" : (m.profiles?.name ?? "Usuario")}
                  </span>
                  <span className="text-xs text-fuego font-semibold">Admin</span>
                </div>
              ))}
            </div>
          )}

          {isAdmin && nonAdmins.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPromoteModal(true)}
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-noche border border-niebla/10 text-sm font-semibold text-humo cursor-pointer hover:bg-noche/60 transition-colors"
            >
              <Shield size={15} className="text-fuego" />
              Promover a admin
            </button>
          )}
        </div>

        {/* ── 4. Zona peligrosa ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-error/30 bg-error/[0.04] p-5 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-error">Zona peligrosa</p>

          {!showLeaveConfirm ? (
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl w-full bg-error/5 border border-error/20 text-sm font-semibold text-error cursor-pointer hover:bg-error/10 transition-colors"
            >
              <LogOut size={15} />
              Salir del grupo
            </button>
          ) : (
            <div className="rounded-xl border border-error/30 bg-error/5 p-4">
              <p className="text-sm text-humo font-semibold mb-3">¿Seguro que querés irte?</p>
              <div className="flex gap-2">
                <Button variant="danger" onClick={handleLeave} loading={leaving} full>Sí, salir</Button>
                <Button variant="ghost" onClick={() => setShowLeaveConfirm(false)} full>Cancelar</Button>
              </div>
            </div>
          )}

          {isCreator && !showDeleteConfirm && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl w-full bg-error/10 border border-error/30 text-sm font-semibold text-error cursor-pointer hover:bg-error/20 transition-colors"
            >
              <Trash2 size={15} />
              Eliminar grupo
            </button>
          )}

          {isCreator && showDeleteConfirm && (
            <div className="rounded-xl border border-error/40 bg-error/[0.08] p-4">
              <p className="text-sm text-humo font-semibold mb-1">Esta acción no se puede deshacer.</p>
              <p className="text-xs text-niebla mb-3">
                Escribí{" "}
                <span className="font-mono font-bold text-humo">{group?.name}</span>{" "}
                para confirmar.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={group?.name ?? ""}
                className="w-full px-3 py-2.5 rounded-xl mb-3 bg-noche border border-error/30 text-humo text-sm outline-none placeholder:text-niebla/40"
              />
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  loading={deleting}
                  disabled={deleteConfirmText !== group?.name}
                  full
                >
                  Eliminar para siempre
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                  full
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ── Modal: Promover a admin ────────────────────────────────────── */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <Overlay onClose={() => setShowPromoteModal(false)} />
          <div className="relative z-10 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-noche-media">
            <div className="flex items-center justify-between p-5 border-b border-noche">
              <h3 className="font-display text-base font-semibold text-humo">Promover a admin</h3>
              <button
                onClick={() => setShowPromoteModal(false)}
                className="text-niebla hover:text-humo transition-colors bg-transparent border-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 max-h-72 overflow-y-auto" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}>
              {nonAdmins.length === 0 ? (
                <p className="text-sm text-niebla text-center py-4">Todos los miembros ya son admins.</p>
              ) : (
                nonAdmins.map((m, i) => (
                  <div key={m.user_id} className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-noche" : ""}`}>
                    <Avatar name={m.profiles?.name ?? "?"} src={m.profiles?.avatar_url} size="sm" />
                    <span className="flex-1 text-sm text-humo">{m.profiles?.name ?? "Usuario"}</span>
                    <button
                      onClick={() => handlePromote(m.user_id)}
                      disabled={promoting === m.user_id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fuego/10 text-fuego text-xs font-semibold border-none cursor-pointer hover:bg-fuego/20 disabled:opacity-50 transition-colors"
                    >
                      {promoting === m.user_id ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
                      Promover
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
