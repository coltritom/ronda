"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/components/ui/Avatar";
import { fmtARS } from "@/lib/utils";

export interface PersonalSummaryProps {
  name: string;
  debes: number;
  teDebon: number;
  attended: number;
  totalEvents: number;
}

export function PersonalSummary({ name, debes, teDebon, attended, totalEvents }: PersonalSummaryProps) {
  const [avatarEmoji, setAvatarEmoji] = useState("🙋‍♂️");

  useEffect(() => {
    const saved = localStorage.getItem("ronda_avatar");
    if (saved) setAvatarEmoji(saved);
  }, []);

  const statCards = [
    { value: `$${fmtARS(debes)}`,         label: "Debés",      sub: "saldo actual",          href: "/home/debes"      },
    { value: `$${fmtARS(teDebon)}`,        label: "Te deben",   sub: "saldo actual",          href: "/home/te-deben"   },
    { value: `${attended}/${totalEvents}`, label: "Asistencia", sub: "últimas 10 juntadas",   href: "/home/asistencia" },
  ];

  return (
    <div className="px-4 md:px-6 pt-5 pb-1">
      <div className="flex justify-center mb-5">
        <Image
          src="/ronda-wordmark.png"
          alt="Ronda"
          width={80}
          height={80}
          className="opacity-40"
        />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display font-bold text-[22px] text-carbon dark:text-humo m-0">
            Hola, {name}
          </h1>
          <p className="text-[13px] text-gris-cal dark:text-niebla mt-0.5">
            Tu resumen
          </p>
        </div>
        <Link href="/perfil" className="rounded-full">
          <Avatar
            emoji={avatarEmoji}
            name={name}
            colorIndex={1}
            size="md"
            selected
          />
        </Link>
      </div>

      <div className="flex gap-2 mb-3">
        {statCards.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex-1 bg-noche-media dark:bg-noche-media bg-crema rounded-[14px] py-3 px-3.5 text-center hover:opacity-75 active:scale-95 transition-all"
          >
            <p className="font-display font-bold text-xl text-carbon dark:text-humo m-0">
              {s.value}
            </p>
            <p className="text-[11px] text-gris-cal dark:text-niebla mt-0.5">
              {s.label}
            </p>
            <p className="text-[10px] text-gris-cal/60 dark:text-niebla/60 mt-0.5">
              {s.sub}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
