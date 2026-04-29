"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/clients";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (password.length < 6) {
      setError("La contraseña tiene que tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError("El link expiró o ya fue usado. Pedí uno nuevo.");
      return;
    }
    router.push("/home");
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10">
        <span className="font-display font-extrabold text-3xl text-fuego tracking-tight">ronda</span>
        <p className="text-sm text-niebla mt-2">Elegí una nueva contraseña</p>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="password" className="text-xs font-medium text-niebla mb-1 block">Nueva contraseña</label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="
                w-full px-3.5 py-3 pr-10 rounded-[10px]
                border-[1.5px] border-white/[0.08]
                bg-noche-media
                text-[15px] text-humo
                placeholder:text-niebla/50
                outline-none font-body
                focus:border-fuego/50 transition-colors
              "
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-niebla bg-transparent border-none cursor-pointer p-0"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="text-xs font-medium text-niebla mb-1 block">Repetí la contraseña</label>
          <input
            id="confirm"
            type={showPass ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="••••••••"
            className="
              w-full px-3.5 py-3 rounded-[10px]
              border-[1.5px] border-white/[0.08]
              bg-noche-media
              text-[15px] text-humo
              placeholder:text-niebla/50
              outline-none font-body
              focus:border-fuego/50 transition-colors
            "
          />
        </div>

        {error && <p className="text-[13px] text-error font-medium">{error}</p>}

        <Button full big onClick={handleSubmit} loading={loading}>
          Guardar contraseña
        </Button>
      </div>
    </div>
  );
}
