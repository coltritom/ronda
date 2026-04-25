"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function CTAFinal() {
  const router = useRouter();
  return (
    <section className="max-w-[1080px] mx-auto px-4 md:px-8 pt-10 pb-16 md:pb-20">
      <div className="text-center px-6 md:px-10 py-10 md:py-14 bg-gradient-to-br from-noche-media to-noche rounded-[20px] md:rounded-[32px] border border-white/[0.06] relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full border border-fuego/[0.06] pointer-events-none" />
        <h2 className="font-display font-extrabold text-[26px] md:text-4xl mb-3 tracking-tight relative">
          Tu grupo tiene historia.<br />Empezá a guardarla.
        </h2>
        <p className="text-[15px] md:text-[17px] text-niebla max-w-[420px] mx-auto mb-6 relative">
          Creá tu grupo en 30 segundos. Mandá el link. Y que la próxima juntada ya quede registrada.
        </p>
        <div className="relative">
          <Button big onClick={() => router.push("/registro")}>Creá tu grupo</Button>
        </div>
      </div>
    </section>
  );
}
