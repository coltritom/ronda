"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [joining, setJoining] = useState(false);

  // Mock data — en producción viene de Supabase
  const group = {
    name: "Los del asado",
    emoji: "🔥",
    memberCount: 7,
    invitedBy: "Mati",
    members: ["🧔", "😎", "👩", "💃", "🧑", "👱‍♀️", "🤙"],
  };

  const handleJoin = () => {
    setJoining(true);
    // TODO: Supabase join grupo con code
    setTimeout(() => {
      router.push("/grupo/g1");
    }, 800);
  };

  return (
    <div className="w-full max-w-sm flex flex-col items-center min-h-screen justify-center py-12 px-4">
      <span className="font-display font-extrabold text-2xl text-fuego tracking-tight mb-10">ronda</span>

      <div className="w-full bg-noche-media rounded-3xl p-6 text-center mb-6">
        <div className="w-20 h-20 rounded-3xl bg-fuego/10 flex items-center justify-center text-4xl mx-auto mb-4">
          {group.emoji}
        </div>

        <h2 className="font-display font-bold text-2xl text-humo mb-1">
          {group.name}
        </h2>
        <p className="text-sm text-niebla mb-5">
          {group.invitedBy} te invitó a unirte
        </p>

        <div className="flex items-center justify-center mb-1">
          {group.members.slice(0, 5).map((e, i) => (
            <div
              key={i}
              className={`
                w-9 h-9 rounded-full bg-fuego/10 flex items-center justify-center text-base
                border-2 border-noche-media
                ${i > 0 ? "-ml-2" : ""}
              `}
              style={{ zIndex: 5 - i }}
            >
              {e}
            </div>
          ))}
          {group.memberCount > 5 && (
            <div className="-ml-2 w-9 h-9 rounded-full bg-noche border-2 border-noche-media flex items-center justify-center text-[11px] font-semibold text-niebla">
              +{group.memberCount - 5}
            </div>
          )}
        </div>
        <p className="text-xs text-niebla">{group.memberCount} integrantes</p>
      </div>

      <p className="text-sm text-niebla text-center mb-6 max-w-[260px]">
        Entrá antes de que te anoten como fantasma.
      </p>

      <div className="w-full flex flex-col gap-3">
        <Button full big onClick={handleJoin}>
          {joining ? "Entrando..." : "Entrar al grupo"}
        </Button>
        <button
          onClick={() => router.push("/login")}
          className="text-sm text-niebla bg-transparent border-none cursor-pointer text-center py-2"
        >
          No, gracias
        </button>
      </div>

      <p className="text-xs text-niebla/60 text-center mt-8">
        Si no tenés cuenta, te pedimos que crees una para poder entrar al grupo.
      </p>
    </div>
  );
}
