"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MessageSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

const TOPICS = [
  "Encontré un error",
  "Falta algo que quiero",
  "Algo es confuso",
  "Quiero dar una sugerencia",
  "Otro",
];

export default function FeedbackPage() {
  const router = useRouter();
  const [topic, setTopic] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, message }),
      });
    } finally {
      setSending(false);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="max-w-2xl mx-auto pb-8 px-4 md:px-6 pt-4">
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-4"
        >
          <ChevronLeft size={16} />
          Volver
        </button>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-menta/[0.12] flex items-center justify-center mb-4">
            <Check size={24} className="text-menta" />
          </div>
          <h2 className="font-display font-bold text-xl text-humo mb-2">Gracias por el feedback</h2>
          <p className="text-sm text-niebla">Lo leemos todo. En serio.</p>
          <button
            onClick={() => router.push("/groups")}
            className="mt-6 text-sm text-fuego font-semibold bg-transparent border-none cursor-pointer"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="px-4 md:px-6 pt-4 pb-2">
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-4"
        >
          <ChevronLeft size={16} />
          Volver
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <MessageSquare size={20} className="text-fuego" />
          <h1 className="font-display font-bold text-2xl text-humo">Feedback</h1>
        </div>
        <p className="text-[13px] text-niebla mt-1">Ayudanos a mejorar Ronda.</p>
      </div>

      <div className="px-4 md:px-6 mt-4 flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium text-niebla mb-2">¿Sobre qué es?</p>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t === topic ? null : t)}
                className={`
                  px-3 py-1.5 rounded-full text-sm border-none cursor-pointer transition-all
                  ${topic === t
                    ? "bg-fuego/[0.12] text-fuego ring-1 ring-fuego/30 font-medium"
                    : "bg-noche-media text-niebla hover:bg-white/10"
                  }
                `}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-niebla mb-2">Tu mensaje</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Contanos qué pasó, qué querés o qué cambiarías..."
            rows={5}
            className="
              w-full px-3.5 py-3 rounded-[10px]
              border-[1.5px] border-white/[0.08]
              bg-noche text-[15px] text-humo
              placeholder:text-niebla/50 outline-none font-body resize-none
              focus:border-fuego/50 transition-colors
            "
          />
        </div>

        <Button full onClick={handleSend} disabled={!message.trim() || sending}>
          {sending ? "Enviando..." : "Enviar feedback"}
        </Button>

        <p className="text-xs text-niebla/60 text-center">
          También podés escribirnos a ordenalaronda@gmail.com
        </p>
      </div>
    </div>
  );
}
