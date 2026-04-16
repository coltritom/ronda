"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "¿Cómo creo un grupo?",
    a: "Tocá el botón + en la barra lateral (o en la pantalla de Grupos) y seguí los pasos. Podés ponerle nombre, elegir un emoji y empezar a invitar gente.",
  },
  {
    q: "¿Cómo invito a alguien al grupo?",
    a: "Desde la página del grupo, tocá \"Copiar link de invitación\" y compartilo por donde quieras. El link es único para ese grupo.",
  },
  {
    q: "¿Qué es una juntada?",
    a: "Una juntada es un evento del grupo: puede ser un asado, un partido de fútbol, una salida, lo que sea. Dentro de cada juntada podés registrar asistencia, aportes y gastos.",
  },
  {
    q: "¿Cómo funciona el ranking?",
    a: "El ranking se calcula automáticamente en base a asistencias, aportes y veces que alguien puso la casa. Se actualiza cada vez que cerrás una juntada.",
  },
  {
    q: "¿Qué pasa cuando cierro las cuentas de una juntada?",
    a: "Ronda calcula quién le debe a quién y simplifica las transferencias para que haya la menor cantidad posible. Podés marcar cada deuda como pagada.",
  },
  {
    q: "¿Los datos están seguros?",
    a: "Sí. Ronda no comparte tu información con terceros. Cada grupo es privado y solo pueden verlo quienes tengan el link de invitación.",
  },
];

export default function AyudaPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto pb-8">
      <div className="px-4 md:px-6 pt-4 pb-2">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-fuego text-[13px] font-semibold bg-transparent border-none cursor-pointer p-0 mb-4"
        >
          <ChevronLeft size={16} />
          Volver
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <HelpCircle size={20} className="text-fuego" />
          <h1 className="font-display font-bold text-2xl text-humo">Ayuda</h1>
        </div>
        <p className="text-[13px] text-niebla mt-1">Preguntas frecuentes sobre Ronda.</p>
      </div>

      <div className="px-4 md:px-6 mt-4 flex flex-col gap-3">
        {FAQS.map((faq, i) => (
          <div key={i} className="bg-noche-media rounded-2xl p-4">
            <p className="font-semibold text-[15px] text-humo mb-1.5">{faq.q}</p>
            <p className="text-sm text-niebla leading-relaxed">{faq.a}</p>
          </div>
        ))}

        <div className="bg-noche-media rounded-2xl p-4 text-center mt-2">
          <p className="text-sm text-niebla mb-3">
            ¿No encontrás lo que buscás?
          </p>
          <button
            onClick={() => router.push("/feedback")}
            className="text-sm text-fuego font-semibold bg-transparent border-none cursor-pointer"
          >
            Mandanos un mensaje →
          </button>
        </div>
      </div>
    </div>
  );
}
