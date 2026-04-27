"use client";

import { useEffect } from "react";
import { Avatar } from "@/components/ui/Avatar";

interface Member {
  name: string;
  emoji?: string;
  colorIndex: number;
}

interface ConfirmPagoModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  from: Member;
  to: Member;
  amountLabel: string;
}

export function ConfirmPagoModal({ open, onClose, onConfirm, from, to, amountLabel }: ConfirmPagoModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-xs bg-noche-media rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <Avatar emoji={from.emoji} name={from.name} colorIndex={from.colorIndex} />
          <span className="text-base text-niebla">→</span>
          <Avatar emoji={to.emoji} name={to.name} colorIndex={to.colorIndex} />
        </div>

        <p className="font-semibold text-[17px] text-humo leading-snug mb-2">
          ¿{from.name} ya le pagó a {to.name}?
        </p>
        <p className="text-sm text-niebla mb-6">
          Esto cierra la cuenta de {amountLabel}. No se puede deshacer.
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full py-3 rounded-xl bg-fuego font-semibold text-sm text-white border-none cursor-pointer hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            Sí, ya pagó
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm text-niebla bg-transparent border-none cursor-pointer hover:text-humo transition-colors"
          >
            Todavía no
          </button>
        </div>
      </div>
    </div>
  );
}
