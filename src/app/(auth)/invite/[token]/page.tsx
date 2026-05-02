"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/clients";
import { acceptInvite, getInviteData } from "@/lib/actions/invites";
import { Button } from "@/components/ui/Button";

interface InviteData {
  groupId: string;
  groupName: string;
  memberCount: number;
  invitedBy: string;
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notFoundReason, setNotFoundReason] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      const result = await getInviteData(token);
      if ("error" in result) {
        setNotFoundReason(`token="${token}" error="${result.error}"`);
        setNotFound(true);
        return;
      }
      setInvite(result);
    }

    load();
  }, [token]);

  const handleJoin = async () => {
    if (!isLoggedIn) {
      router.push(`/login?next=/invite/${token}`);
      return;
    }

    setJoining(true);
    setError("");

    const result = await acceptInvite(token);

    if ("error" in result) {
      setError(result.error);
      setJoining(false);
      return;
    }

    router.push(`/grupo/${result.groupId}`);
  };

  // Token inválido o expirado
  if (notFound) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center min-h-screen justify-center py-12 px-4 text-center">
        <span className="font-display font-extrabold text-2xl text-fuego tracking-tight mb-10">ronda</span>
        <div className="text-5xl mb-4">🔗</div>
        <h2 className="font-display font-bold text-xl text-humo mb-2">Link inválido o expirado</h2>
        <p className="text-sm text-niebla">Pedile al admin del grupo que te mande uno nuevo.</p>
        {notFoundReason && (
          <p className="mt-4 text-xs text-niebla/60 break-all font-mono">{notFoundReason}</p>
        )}
        <button
          onClick={() => router.push("/login")}
          className="mt-8 text-sm text-fuego font-semibold bg-transparent border-none cursor-pointer"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  // Cargando datos del invite
  if (!invite) {
    return (
      <div className="w-full max-w-sm flex flex-col items-center min-h-screen justify-center py-12 px-4">
        <span className="font-display font-extrabold text-2xl text-fuego tracking-tight mb-12">ronda</span>
        <div className="flex gap-1.5 items-center">
          <div className="w-2 h-2 rounded-full bg-fuego animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 rounded-full bg-fuego animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 rounded-full bg-fuego animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm flex flex-col items-center min-h-screen justify-center py-12 px-4">
      <span className="font-display font-extrabold text-2xl text-fuego tracking-tight mb-10">ronda</span>

      <div className="w-full bg-noche-media rounded-3xl p-6 text-center mb-6">
        <div className="w-20 h-20 rounded-3xl bg-fuego/10 flex items-center justify-center text-4xl mx-auto mb-4">
          🎉
        </div>
        <h2 className="font-display font-bold text-2xl text-humo mb-1">
          {invite.groupName}
        </h2>
        <p className="text-sm text-niebla mb-5">
          {invite.invitedBy} te invitó a unirte
        </p>
        <p className="text-xs text-niebla">
          {invite.memberCount} {invite.memberCount === 1 ? "integrante" : "integrantes"}
        </p>
      </div>

      <p className="text-sm text-niebla text-center mb-6 max-w-[260px]">
        Entrá antes de que te anoten como fantasma.
      </p>

      {error && (
        <p className="text-[13px] text-error font-medium mb-3 text-center">{error}</p>
      )}

      <div className="w-full flex flex-col gap-3">
        <Button full big onClick={handleJoin} disabled={joining}>
          {joining ? "Entrando..." : "Entrar al grupo"}
        </Button>

        {!isLoggedIn && (
          <p className="text-xs text-niebla text-center px-4">
            Si no tenés cuenta,{" "}
            <button
              onClick={() => router.push(`/registro?next=/invite/${token}`)}
              className="text-fuego font-semibold bg-transparent border-none cursor-pointer p-0"
            >
              creá una
            </button>
            {" "}para poder entrar.
          </p>
        )}

        <button
          onClick={() => router.push("/")}
          className="text-sm text-niebla bg-transparent border-none cursor-pointer text-center py-2"
        >
          No, gracias
        </button>
      </div>
    </div>
  );
}
