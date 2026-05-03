"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Copy, Check, RefreshCw, QrCode,
  LogOut, Trash2, Loader2, Shield, X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/clients";
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

const HUMOR_OPTIONS: { id: HumorIntensity; icon: string; label: string; sub: string }[] = [
  { id: "light",  icon: "☁️", label: "Suave",   sub: "Solo positivas" },
  { id: "medium", icon: "⚡", label: "Medio",   sub: "Con algo de ironía" },
  { id: "spicy",  icon: "🌶️", label: "Picante", sub: "Todas" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full
        transition-colors focus:outline-none
        disabled:opacity-50 disabled:cursor-not-allowed
        ${checked ? "bg-fuego" : "bg-niebla/30"}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow
          transition-transform
          ${checked ? "translate-x-6" : "translate-x-1"}
        `}
      />
    </button>
  );
}

function SectionCard({
  title,
  children,
  danger = false,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        danger ? "border-error/30 bg-error/[0.04]" : "border-border bg-surface"
      }`}
    >
      <h2
        className={`font-heading text-base font-semibold mb-4 ${
          danger ? "text-error" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

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

  // ── Settings
  const [settings, setSettings] = useState<GroupSettings>({
    humor_enabled: false,
    humor_intensity: "medium",
    default_currency: "ARS",
  });

  // ── Members
  const [members, setMembers] = useState<Member[]>([]);

  // ── Invite
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [showQR, setShowQR] = useState(false);

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
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setCurrentUserId(user.id);

    const [{ data: groupData }, { data: membershipData }] = await Promise.all([
      supabase
        .from("groups")
        .select("id, name, description, emoji, created_by")
        .eq("id", id)
        .single(),
      supabase
        .from("group_members")
        .select("role")
        .eq("group_id", id)
        .eq("user_id", user.id)
        .single(),
    ]);

    if (groupData) {
      setGroup(groupData as GroupData);
      setEditName(groupData.name);
      setEditDesc(groupData.description ?? "");
      setEditEmoji((groupData as GroupData).emoji ?? "🔥");
      setIsCreator(groupData.created_by === user.id);
    }

    if (membershipData) setMyRole(membershipData.role as Role);

    // Settings — may not exist yet
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

    // Members with profiles
    const { data: membersData } = await supabase
      .from("group_members")
      .select("user_id, role, joined_at")
      .eq("group_id", id)
      .order("joined_at");

    if (membersData) {
      const memberUserIds = membersData.map(m => m.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", memberUserIds);
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

    // Active invite link
    const { data: inviteData } = await supabase
      .from("invite_links")
      .select("code")
      .eq("group_id", id)
      .eq("is_active", true)
      .maybeSingle();

    setInviteCode(inviteData?.code ?? null);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Save group ───────────────────────────────────────────────────────────

  const handleSaveGroup = async () => {
    if (!editName.trim()) {
      toast.error("El nombre no puede estar vacío.");
      return;
    }
    setSavingGroup(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("groups")
      .update({
        name: editName.trim(),
        description: editDesc.trim() || null,
        emoji: editEmoji,
      })
      .eq("id", id);
    setSavingGroup(false);
    if (error) {
      toast.error("No se pudo guardar.");
      return;
    }
    setGroup((prev) =>
      prev
        ? { ...prev, name: editName.trim(), description: editDesc.trim() || null, emoji: editEmoji }
        : prev
    );
    toast.success("Cambios guardados ✓");
  };

  // ─── Auto-save settings ───────────────────────────────────────────────────

  const saveSettings = async (next: Partial<GroupSettings>) => {
    const merged = { ...settings, ...next };
    setSettings(merged);
    const supabase = createClient();
    const { error } = await supabase.from("group_settings").upsert(
      {
        group_id: id,
        humor_enabled: merged.humor_enabled,
        humor_intensity: merged.humor_intensity,
        default_currency: merged.default_currency,
      },
      { onConflict: "group_id" }
    );
    if (error) {
      toast.error("No se pudo guardar la configuración.");
      setSettings(settings);
    } else {
      toast.success("Guardado ✓");
    }
  };

  // ─── Invite helpers ───────────────────────────────────────────────────────

  const inviteUrl =
    inviteCode && typeof window !== "undefined"
      ? `${window.location.origin}/invite/${inviteCode}`
      : inviteCode
      ? `https://ordenalaronda.com/invite/${inviteCode}`
      : null;

  const generateCode = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl).catch(() => {});
    setCopied(true);
    toast.success("Link copiado ✓");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCreateInvite = async () => {
    const supabase = createClient();
    const newCode = generateCode();
    const { error } = await supabase
      .from("invite_links")
      .insert({ group_id: id, code: newCode, is_active: true });
    if (error) {
      toast.error("No se pudo crear el link.");
      return;
    }
    setInviteCode(newCode);
    toast.success("Link de invitación creado ✓");
  };

  const handleRegenerate = async () => {
    setShowRegenConfirm(false);
    setRegenerating(true);
    const supabase = createClient();
    const newCode = generateCode();
    await supabase
      .from("invite_links")
      .update({ is_active: false })
      .eq("group_id", id);
    const { error } = await supabase
      .from("invite_links")
      .insert({ group_id: id, code: newCode, is_active: true });
    setRegenerating(false);
    if (error) {
      toast.error("No se pudo regenerar el link.");
      return;
    }
    setInviteCode(newCode);
    toast.success("Link regenerado ✓");
  };

  // ─── Promote ──────────────────────────────────────────────────────────────

  const handlePromote = async (userId: string) => {
    setPromoting(userId);
    const supabase = createClient();
    const { error } = await supabase
      .from("group_members")
      .update({ role: "admin" })
      .eq("group_id", id)
      .eq("user_id", userId);
    setPromoting(null);
    if (error) {
      toast.error("No se pudo promover.");
      return;
    }
    setMembers((prev) =>
      prev.map((m) => (m.user_id === userId ? { ...m, role: "admin" } : m))
    );
    toast.success("Admin promovido ✓");
    setShowPromoteModal(false);
  };

  // ─── Leave ────────────────────────────────────────────────────────────────

  const handleLeave = async () => {
    setLeaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", id)
      .eq("user_id", currentUserId!);
    setLeaving(false);
    if (error) {
      toast.error("No se pudo salir del grupo.");
      return;
    }
    toast.success("Saliste del grupo.");
    router.push("/groups");
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!group || deleteConfirmText !== group.name) {
      toast.error("El nombre no coincide.");
      return;
    }
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("groups").delete().eq("id", id);
    setDeleting(false);
    if (error) {
      toast.error("No se pudo eliminar el grupo.");
      return;
    }
    toast.success("Grupo eliminado.");
    router.push("/groups");
  };

  // ─── Render: loading ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 size={22} className="animate-spin text-muted" />
      </div>
    );
  }

  const admins = members.filter((m) => m.role === "admin");
  const nonAdmins = members.filter((m) => m.role !== "admin");

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex-1 p-5 lg:p-8 max-w-2xl space-y-5">

        {/* Back */}
        <button
          onClick={() => router.push(`/groups/${id}`)}
          className="flex items-center gap-1.5 text-fuego text-sm font-semibold bg-transparent border-none cursor-pointer p-0"
        >
          <ChevronLeft size={16} />
          Volver al grupo
        </button>

        {/* ── 1. Datos del grupo ───────────────────────────────────────── */}
        <SectionCard title="Datos del grupo">
          <div className="flex flex-col gap-4">

            {/* Emoji selector */}
            <div>
              <p className="font-body text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Emoji del grupo
              </p>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setEditEmoji(e)}
                    className={`
                      w-10 h-10 rounded-xl text-lg flex items-center justify-center
                      border-none cursor-pointer transition-all
                      disabled:cursor-default
                      ${editEmoji === e
                        ? "bg-fuego/15 ring-2 ring-fuego/40"
                        : "bg-surface-2 hover:bg-border disabled:opacity-60"
                      }
                    `}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block font-body text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Nombre
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={!isAdmin}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-surface-2 border border-border
                  text-foreground text-sm font-body
                  outline-none focus:border-fuego/50
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-colors
                "
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-body text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                Descripción <span className="normal-case font-normal">(opcional)</span>
              </label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                disabled={!isAdmin}
                rows={2}
                placeholder="De qué va el grupo…"
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-surface-2 border border-border
                  text-foreground text-sm font-body
                  outline-none focus:border-fuego/50
                  disabled:opacity-60 disabled:cursor-not-allowed
                  resize-none transition-colors
                  placeholder:text-muted/50
                "
              />
            </div>

            {isAdmin && isDirty && (
              <Button onClick={handleSaveGroup} loading={savingGroup} fullWidth>
                Guardar cambios
              </Button>
            )}

            {!isAdmin && (
              <p className="text-xs text-muted">
                Solo los admins pueden editar los datos del grupo.
              </p>
            )}
          </div>
        </SectionCard>

        {/* ── 2. Invitación ────────────────────────────────────────────── */}
        <SectionCard title="Invitación">
          {!isAdmin ? (
            <p className="text-sm text-muted">
              Solo los admins pueden gestionar el link de invitación.
            </p>
          ) : inviteCode ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl bg-surface-2 border border-border px-4 py-3">
                <p className="font-body text-xs text-muted mb-1">Link de invitación</p>
                <p className="font-mono text-sm text-foreground break-all">{inviteUrl}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`
                    flex-1 flex items-center justify-center gap-2
                    py-2.5 rounded-xl text-sm font-semibold
                    border-none cursor-pointer transition-all
                    ${copied
                      ? "bg-exito/10 text-exito"
                      : "bg-fuego/10 text-fuego hover:bg-fuego/15"
                    }
                  `}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copiado" : "Copiar"}
                </button>

                <button
                  onClick={() => setShowQR(true)}
                  className="
                    flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                    text-sm font-semibold bg-surface-2 text-foreground
                    border-none cursor-pointer hover:bg-border transition-colors
                  "
                >
                  <QrCode size={14} />
                  QR
                </button>

                <button
                  onClick={() => setShowRegenConfirm(true)}
                  disabled={regenerating}
                  className="
                    flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                    text-sm font-semibold bg-surface-2 text-muted
                    border-none cursor-pointer hover:bg-border
                    disabled:opacity-50 transition-colors
                  "
                >
                  {regenerating
                    ? <Loader2 size={14} className="animate-spin" />
                    : <RefreshCw size={14} />
                  }
                  Regenerar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted">
                Todavía no hay un link activo para este grupo.
              </p>
              <Button primary={false} onClick={handleCreateInvite}>
                Crear link de invitación
              </Button>
            </div>
          )}
        </SectionCard>

        {/* ── 3. Etiquetas humorísticas (solo admins) ──────────────────── */}
        {isAdmin && (
          <SectionCard title="Etiquetas humorísticas">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-body text-sm text-foreground font-medium">
                    Activar etiquetas
                  </p>
                  <p className="font-body text-xs text-muted mt-0.5">
                    Los miembros reciben badges según su comportamiento
                  </p>
                </div>
                <Toggle
                  checked={settings.humor_enabled}
                  onChange={(v) => saveSettings({ humor_enabled: v })}
                />
              </div>

              {settings.humor_enabled && (
                <div className="flex flex-col gap-2">
                  <p className="font-body text-xs font-semibold text-muted uppercase tracking-wider">
                    Intensidad
                  </p>
                  {HUMOR_OPTIONS.map((opt) => {
                    const active = settings.humor_intensity === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => saveSettings({ humor_intensity: opt.id })}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl border text-left
                          cursor-pointer transition-all
                          ${active
                            ? "border-fuego/40 bg-fuego/5"
                            : "border-border bg-surface-2 hover:border-muted/40"
                          }
                        `}
                      >
                        <span className="text-xl">{opt.icon}</span>
                        <div className="flex-1">
                          <p className={`font-body text-sm font-semibold ${active ? "text-fuego" : "text-foreground"}`}>
                            {opt.label}
                          </p>
                          <p className="font-body text-xs text-muted">{opt.sub}</p>
                        </div>
                        {active && <Check size={14} className="text-fuego flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* ── 4. Gastos (solo admins) ───────────────────────────────────── */}
        {isAdmin && (
          <SectionCard title="Gastos">
            <div>
              <p className="font-body text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Moneda por defecto
              </p>
              <div className="flex gap-2">
                {(["ARS", "USD"] as Currency[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => saveSettings({ default_currency: c })}
                    className={`
                      flex-1 py-3 rounded-xl text-sm font-semibold
                      border-none cursor-pointer transition-all
                      ${settings.default_currency === c
                        ? "bg-fuego text-white"
                        : "bg-surface-2 text-foreground hover:bg-border"
                      }
                    `}
                  >
                    {c === "ARS" ? "🇦🇷 ARS" : "🇺🇸 USD"}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── 5. Tu rol ────────────────────────────────────────────────── */}
        <SectionCard title="Tu rol">
          <div className="flex flex-col gap-4">

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isAdmin ? "bg-fuego/10 text-fuego" : "bg-muted/10 text-muted"}`}>
                {isAdmin ? "👑 Admin" : "👤 Miembro"}
              </span>
              {isCreator && (
                <span className="rounded-full px-3 py-1 text-sm font-semibold bg-ambar/10 text-ambar">
                  ⭐ Creador
                </span>
              )}
            </div>

            {/* Admins list */}
            {isAdmin && admins.length > 0 && (
              <div>
                <p className="font-body text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Admins del grupo
                </p>
                <div className="flex flex-col gap-1.5">
                  {admins.map((m) => (
                    <div
                      key={m.user_id}
                      className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5"
                    >
                      <Avatar
                        name={m.profiles?.name ?? "?"}
                        src={m.profiles?.avatar_url}
                        size="sm"
                      />
                      <span className="font-body text-sm text-foreground flex-1">
                        {m.user_id === currentUserId ? "Vos" : (m.profiles?.name ?? "Usuario")}
                      </span>
                      <span className="text-xs text-fuego font-semibold">Admin</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Promote button */}
            {isAdmin && nonAdmins.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPromoteModal(true)}
                className="
                  flex items-center gap-2 py-2.5 px-4 rounded-xl
                  bg-surface-2 border border-border
                  text-sm font-semibold text-foreground
                  cursor-pointer hover:bg-border transition-colors
                "
              >
                <Shield size={15} className="text-fuego" />
                Promover a admin
              </button>
            )}
          </div>
        </SectionCard>

        {/* ── 6. Zona peligrosa ─────────────────────────────────────────── */}
        <SectionCard title="⚠️ Zona peligrosa" danger>
          <div className="flex flex-col gap-3">

            {/* Salir del grupo */}
            {!showLeaveConfirm ? (
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="
                  flex items-center gap-2 py-2.5 px-4 rounded-xl w-full
                  bg-error/5 border border-error/20
                  text-sm font-semibold text-error
                  cursor-pointer hover:bg-error/10 transition-colors
                "
              >
                <LogOut size={15} />
                Salir del grupo
              </button>
            ) : (
              <div className="rounded-xl border border-error/30 bg-error/5 p-4">
                <p className="text-sm text-foreground font-semibold mb-3">
                  ¿Seguro que querés irte?
                </p>
                <div className="flex gap-2">
                  <Button variant="danger" onClick={handleLeave} loading={leaving} full>
                    Sí, salir
                  </Button>
                  <Button variant="ghost" onClick={() => setShowLeaveConfirm(false)} full>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Eliminar grupo (solo creador) */}
            {isCreator && !showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="
                  flex items-center gap-2 py-2.5 px-4 rounded-xl w-full
                  bg-error/10 border border-error/30
                  text-sm font-semibold text-error
                  cursor-pointer hover:bg-error/20 transition-colors
                "
              >
                <Trash2 size={15} />
                Eliminar grupo
              </button>
            )}

            {isCreator && showDeleteConfirm && (
              <div className="rounded-xl border border-error/40 bg-error/[0.08] p-4">
                <p className="text-sm text-foreground font-semibold mb-1">
                  Esta acción no se puede deshacer.
                </p>
                <p className="text-xs text-muted mb-3">
                  Escribí{" "}
                  <span className="font-mono font-bold text-foreground">
                    {group?.name}
                  </span>{" "}
                  para confirmar.
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={group?.name ?? ""}
                  className="
                    w-full px-3 py-2.5 rounded-xl mb-3
                    bg-surface border border-error/30
                    text-foreground text-sm font-body
                    outline-none placeholder:text-muted/40
                  "
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
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    full
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

      </div>

      {/* ── Modal: Regenerar link ──────────────────────────────────────── */}
      {showRegenConfirm && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <Overlay onClose={() => setShowRegenConfirm(false)} />
          <div className="relative z-10 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-surface border border-border p-6">
            <h3 className="font-heading text-base font-semibold text-foreground mb-2">
              ¿Regenerar link?
            </h3>
            <p className="font-body text-sm text-muted mb-4">
              El link anterior va a dejar de funcionar y nadie más podrá usarlo para unirse.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={handleRegenerate} full>
                Regenerar
              </Button>
              <Button variant="ghost" onClick={() => setShowRegenConfirm(false)} full>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: QR ─────────────────────────────────────────────────── */}
      {showQR && inviteUrl && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <Overlay onClose={() => setShowQR(false)} />
          <div className="relative z-10 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-surface border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base font-semibold text-foreground">
                Link de invitación
              </h3>
              <button
                onClick={() => setShowQR(false)}
                className="text-muted hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="rounded-xl bg-surface-2 border border-border px-4 py-5 mb-4 text-center">
              <p className="font-body text-xs text-muted mb-2">Compartí este link con quien querés invitar</p>
              <p className="font-mono text-sm text-foreground break-all">{inviteUrl}</p>
            </div>
            <button
              onClick={handleCopy}
              className={`
                w-full flex items-center justify-center gap-2
                py-3 rounded-xl text-sm font-semibold
                border-none cursor-pointer transition-all
                ${copied
                  ? "bg-exito/10 text-exito"
                  : "bg-fuego/10 text-fuego hover:bg-fuego/15"
                }
              `}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copiado" : "Copiar link"}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Promover a admin ────────────────────────────────────── */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <Overlay onClose={() => setShowPromoteModal(false)} />
          <div className="relative z-10 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-surface border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-heading text-base font-semibold text-foreground">
                Promover a admin
              </h3>
              <button
                onClick={() => setShowPromoteModal(false)}
                className="text-muted hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 max-h-72 overflow-y-auto" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))" }}>
              {nonAdmins.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">
                  Todos los miembros ya son admins.
                </p>
              ) : (
                nonAdmins.map((m, i) => (
                  <div
                    key={m.user_id}
                    className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-border" : ""}`}
                  >
                    <Avatar
                      name={m.profiles?.name ?? "?"}
                      src={m.profiles?.avatar_url}
                      size="sm"
                    />
                    <span className="flex-1 font-body text-sm text-foreground">
                      {m.profiles?.name ?? "Usuario"}
                    </span>
                    <button
                      onClick={() => handlePromote(m.user_id)}
                      disabled={promoting === m.user_id}
                      className="
                        flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                        bg-fuego/10 text-fuego text-xs font-semibold
                        border-none cursor-pointer hover:bg-fuego/20
                        disabled:opacity-50 transition-colors
                      "
                    >
                      {promoting === m.user_id
                        ? <Loader2 size={12} className="animate-spin" />
                        : <Shield size={12} />
                      }
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
