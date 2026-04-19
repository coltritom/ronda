"use client";

import { useRef, useState, useEffect } from "react";
import { X, Download, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { captureAndShare } from "@/lib/captureStory";

interface ShareStoryModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  filename?: string;
}

// Story card is 390×693. We scale it to fit inside the modal preview area.
const CARD_W = 390;
const CARD_H = 693;
const PREVIEW_W = 260; // target preview width
const SCALE = PREVIEW_W / CARD_W;

export function ShareStoryModal({ open, onClose, children, filename = "ronda-story" }: ShareStoryModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

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

  const handleShare = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      await captureAndShare(cardRef.current, filename);
      toast.success("¡Imagen lista para compartir!");
    } catch {
      toast.error("No se pudo generar la imagen.");
    } finally {
      setLoading(false);
    }
  };

  const previewH = CARD_H * SCALE;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-sm rounded-t-[20px] sm:rounded-[20px] bg-noche-media border border-white/[0.07] shadow-2xl flex flex-col">
        {/* Handle mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="h-1 w-10 rounded-full bg-niebla/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <h2 className="font-display font-bold text-[17px] text-humo">
            Compartir story
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-niebla hover:bg-white/5 transition-colors bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview */}
        <div className="flex justify-center px-5 pb-5">
          <div
            style={{
              width: previewW(CARD_W, SCALE),
              height: previewH,
              position: "relative",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
              flexShrink: 0,
            }}
          >
            {/* The actual card rendered at full size, scaled via CSS transform */}
            <div
              style={{
                transformOrigin: "top left",
                transform: `scale(${SCALE})`,
                width: CARD_W,
                height: CARD_H,
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              {/* Clone the card with the ref attached for capture */}
              <div ref={cardRef}>
                {children}
              </div>
            </div>
          </div>
        </div>

        {/* Hint */}
        <p className="text-center text-[12px] text-niebla/60 pb-2 px-5">
          Formato story 9:16 — listo para Instagram, WhatsApp o TikTok
        </p>

        {/* CTA */}
        <div
          className="px-5 pt-3 shrink-0"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}
        >
          <button
            onClick={handleShare}
            disabled={loading}
            className="
              w-full py-3.5 rounded-xl font-semibold text-[15px]
              bg-fuego text-white flex items-center justify-center gap-2
              disabled:opacity-60 transition-all active:scale-[0.98]
              border-none cursor-pointer
            "
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Generando...</>
            ) : (
              <><Share2 size={16} /> Compartir imagen</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function previewW(cardW: number, scale: number) {
  return Math.round(cardW * scale);
}
