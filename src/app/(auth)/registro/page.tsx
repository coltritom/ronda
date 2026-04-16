"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";

export default function RegistroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = () => {
    setError("");
    if (!name || !email || !password) {
      setError("Completá todos los campos.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña tiene que tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    // TODO: conectar con Supabase Auth
    setTimeout(() => {
      setLoading(false);
      router.push("/onboarding");
    }, 800);
  };

  const handleGoogle = () => {
    // TODO: Supabase OAuth con Google
    router.push("/onboarding");
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10">
        <span className="font-display font-extrabold text-3xl text-fuego tracking-tight">ronda</span>
        <p className="text-sm text-niebla mt-2">Creá tu cuenta</p>
      </div>

      <button
        onClick={handleGoogle}
        className="
          w-full flex items-center justify-center gap-3 py-3 rounded-xl
          bg-white/10 text-humo
          border border-white/10
          font-semibold text-sm cursor-pointer
          hover:opacity-90 transition-opacity
        "
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continuar con Google
      </button>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-white/[0.08]" />
        <span className="text-xs text-niebla">o con email</span>
        <div className="flex-1 h-px bg-white/[0.08]" />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-medium text-niebla mb-1 block">¿Cómo te dicen?</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre o apodo"
            className="
              w-full px-3.5 py-3 rounded-[10px]
              border-[1.5px] border-white/[0.08]
              bg-noche-media text-[15px] text-humo
              placeholder:text-niebla/50 outline-none font-body
              focus:border-fuego/50 transition-colors
            "
          />
        </div>

        <div>
          <label className="text-xs font-medium text-niebla mb-1 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="
              w-full px-3.5 py-3 rounded-[10px]
              border-[1.5px] border-white/[0.08]
              bg-noche-media text-[15px] text-humo
              placeholder:text-niebla/50 outline-none font-body
              focus:border-fuego/50 transition-colors
            "
          />
        </div>

        <div>
          <label className="text-xs font-medium text-niebla mb-1 block">Contraseña</label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="
                w-full px-3.5 py-3 pr-10 rounded-[10px]
                border-[1.5px] border-white/[0.08]
                bg-noche-media text-[15px] text-humo
                placeholder:text-niebla/50 outline-none font-body
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

        {error && <p className="text-[13px] text-error font-medium">{error}</p>}

        <Button full big onClick={handleRegister}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>

        <p className="text-xs text-niebla text-center mt-1">
          Al crear tu cuenta aceptás los{" "}
          <a href="/terminos" className="text-fuego no-underline">términos de uso</a>
          {" "}y la{" "}
          <a href="/privacidad" className="text-fuego no-underline">política de privacidad</a>.
        </p>
      </div>

      <p className="text-center text-sm text-niebla mt-8">
        ¿Ya tenés cuenta?{" "}
        <a href="/login" className="text-fuego font-semibold no-underline hover:opacity-80">
          Entrá
        </a>
      </p>
    </div>
  );
}
