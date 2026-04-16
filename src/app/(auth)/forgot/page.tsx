"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, Mail } from "lucide-react";

export default function ForgotPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!email) return;
    setLoading(true);
    // TODO: Supabase resetPasswordForEmail
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 800);
  };

  return (
    <div className="w-full max-w-sm">
      <button
        onClick={() => router.push("/login")}
        className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-8"
      >
        <ChevronLeft size={16} />
        Volver a entrar
      </button>

      {sent ? (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-menta/[0.12] flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-menta" />
          </div>
          <h2 className="font-display font-bold text-xl text-humo mb-2">
            Revisá tu email
          </h2>
          <p className="text-sm text-niebla leading-relaxed mb-6">
            Te mandamos un link a{" "}
            <span className="text-humo font-medium">{email}</span>{" "}
            para restablecer tu contraseña.
          </p>
          <a href="/login" className="text-sm font-semibold text-fuego no-underline">
            Volver a entrar
          </a>
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <span className="font-display font-extrabold text-3xl text-fuego tracking-tight">ronda</span>
            <p className="text-sm text-niebla mt-2">
              Ingresá tu email y te mandamos un link para restablecer tu contraseña.
            </p>
          </div>

          <div className="flex flex-col gap-3">
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

            <Button full big onClick={handleSend}>
              {loading ? "Enviando..." : "Enviar link"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
