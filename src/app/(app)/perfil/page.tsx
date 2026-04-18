"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme-context";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { MOCK_GROUPS } from "@/lib/constants";
import { LogOut, ChevronRight, MessageSquare, Eye, EyeOff } from "lucide-react";
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

const INPUT_CLASS = `
  w-full px-3.5 py-3 rounded-[10px]
  border-[1.5px] border-white/[0.08]
  bg-noche text-[15px] text-humo
  placeholder:text-niebla/50 outline-none font-body
  focus:border-fuego/50 transition-colors
`;

export default function PerfilPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();

  // Datos (mock por ahora, luego vendrá de Supabase)
  const [displayName, setDisplayName] = useState("Tomi");
  const [email, setEmail] = useState("tomi@email.com");

  // Modales
  const [editModal, setEditModal] = useState<"nombre" | "email" | "password" | null>(null);

  // Campos temporales mientras se edita
  const [tmpName, setTmpName] = useState("");
  const [tmpEmail, setTmpEmail] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const openModal = (type: "nombre" | "email" | "password") => {
    setFieldError("");
    if (type === "nombre") setTmpName(displayName);
    if (type === "email") setTmpEmail(email);
    if (type === "password") {
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
      setShowCurrentPass(false); setShowNewPass(false); setShowConfirmPass(false);
    }
    setEditModal(type);
  };

  const closeModal = () => { setEditModal(null); setFieldError(""); setSaving(false); };

  const handleSaveName = async () => {
    if (!tmpName.trim()) { setFieldError("El nombre no puede estar vacío."); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ data: { full_name: tmpName.trim() } });
    setSaving(false);
    if (error) { setFieldError("No se pudo guardar. Intentá de nuevo."); return; }
    setDisplayName(tmpName.trim());
    closeModal();
  };

  const handleSaveEmail = async () => {
    if (!tmpEmail.trim()) { setFieldError("El email no puede estar vacío."); return; }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: tmpEmail.trim() });
    setSaving(false);
    if (error) { setFieldError("No se pudo actualizar el email. Verificá que sea válido."); return; }
    setEmail(tmpEmail.trim());
    closeModal();
  };

  const handleSavePassword = async () => {
    if (!currentPass) { setFieldError("Ingresá tu contraseña actual."); return; }
    if (newPass.length < 6) { setFieldError("La nueva contraseña debe tener al menos 6 caracteres."); return; }
    if (newPass !== confirmPass) { setFieldError("Las contraseñas nuevas no coinciden."); return; }
    setSaving(true);
    // Primero reautenticamos con la contraseña actual
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setFieldError("No se pudo verificar tu sesión."); setSaving(false); return; }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPass });
    if (signInError) { setFieldError("La contraseña actual es incorrecta."); setSaving(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setSaving(false);
    if (error) { setFieldError("No se pudo cambiar la contraseña. Intentá de nuevo."); return; }
    closeModal();
  };

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
          <Avatar emoji="🙋‍♂️" name={displayName} colorIndex={1} size="lg" selected />
        </div>
        <h1 className="font-display font-bold text-[22px] text-humo">{displayName}</h1>
        <p className="text-sm text-niebla mt-0.5">{email}</p>
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
          <SettingRow label="Nombre" value={displayName} onClick={() => openModal("nombre")} />
          <SettingRow label="Email" value={email} onClick={() => openModal("email")} />
          <SettingRow label="Contraseña" value="••••••••" onClick={() => openModal("password")} />
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

      {/* Modal: Editar nombre */}
      <Modal open={editModal === "nombre"} onClose={closeModal} title="Editar nombre">
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={tmpName}
            onChange={(e) => setTmpName(e.target.value)}
            placeholder="Tu nombre o apodo"
            className={INPUT_CLASS}
            autoFocus
          />
          {fieldError && <p className="text-[13px] text-error">{fieldError}</p>}
          <button
            onClick={handleSaveName}
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-[15px] bg-fuego text-white disabled:opacity-60 transition-all active:scale-[0.98]"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </Modal>

      {/* Modal: Editar email */}
      <Modal open={editModal === "email"} onClose={closeModal} title="Editar email">
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-niebla">
            Te enviaremos un link de confirmación a la nueva dirección.
          </p>
          <input
            type="email"
            value={tmpEmail}
            onChange={(e) => setTmpEmail(e.target.value)}
            placeholder="nuevo@email.com"
            className={INPUT_CLASS}
            autoFocus
          />
          {fieldError && <p className="text-[13px] text-error">{fieldError}</p>}
          <button
            onClick={handleSaveEmail}
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-[15px] bg-fuego text-white disabled:opacity-60 transition-all active:scale-[0.98]"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </Modal>

      {/* Modal: Cambiar contraseña */}
      <Modal open={editModal === "password"} onClose={closeModal} title="Cambiar contraseña">
        <div className="flex flex-col gap-3">
          {/* Contraseña actual */}
          <div>
            <label className="text-xs font-medium text-niebla mb-1 block">Contraseña actual</label>
            <div className="relative">
              <input
                type={showCurrentPass ? "text" : "password"}
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="••••••••"
                className={INPUT_CLASS + " pr-10"}
              />
              <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-niebla bg-transparent border-none cursor-pointer p-0">
                {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="text-xs font-medium text-niebla mb-1 block">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showNewPass ? "text" : "password"}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={INPUT_CLASS + " pr-10"}
              />
              <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-niebla bg-transparent border-none cursor-pointer p-0">
                {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="text-xs font-medium text-niebla mb-1 block">Confirmar nueva contraseña</label>
            <div className="relative">
              <input
                type={showConfirmPass ? "text" : "password"}
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="••••••••"
                className={INPUT_CLASS + " pr-10"}
              />
              <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-niebla bg-transparent border-none cursor-pointer p-0">
                {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {fieldError && <p className="text-[13px] text-error">{fieldError}</p>}

          <button
            onClick={handleSavePassword}
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-[15px] bg-fuego text-white disabled:opacity-60 transition-all active:scale-[0.98] mt-1"
          >
            {saving ? "Cambiando..." : "Cambiar contraseña"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
