"use client";

import { useState } from "react";
import { Pill } from "@/components/ui/Pill";

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-4 flex justify-between items-center text-left bg-transparent border-none cursor-pointer"
      >
        <span className="font-semibold text-[15px] text-humo flex-1 pr-4">{q}</span>
        <span className={`text-xl text-fuego shrink-0 transition-transform duration-200 ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && (
        <p className="pb-4 text-sm text-niebla leading-relaxed">{a}</p>
      )}
    </div>
  );
}

const ITEMS = [
  { q: "¿Qué es Ronda exactamente?", a: "Ronda es el tracker social de tu grupo. Registra juntadas, divide gastos, arma rankings con datos reales y guarda la memoria colectiva. No es una app de finanzas ni una agenda: es una herramienta social que resuelve la plata como efecto secundario." },
  { q: "¿Es gratis?", a: "Sí. Podés crear hasta 2 grupos de 10 integrantes con gastos ilimitados. El plan Pro cuesta $2.99/mes por grupo y lo paga solo el admin. Los demás no ponen nada." },
  { q: "¿Qué pasa si el admin deja de pagar Pro?", a: "El grupo vuelve al plan gratuito. Toda la información, historial y rankings se mantienen. Nunca perdés datos." },
  { q: "¿Cómo invito a mi grupo?", a: "Creás el grupo, copiás el link y lo mandás al chat de WhatsApp. Cada persona entra, se pone su nombre y listo. En 2 minutos ya están todos adentro." },
  { q: "¿Funciona solo para asados?", a: "No. Funciona para cualquier juntada: asados, cenas, viajes, after offices, partidos de fútbol. Si hay un grupo que se junta y gasta plata, Ronda sirve." },
  { q: "¿Es segura mi información?", a: "Ronda no se conecta a tu banco ni a Mercado Pago. Los montos los cargás manualmente. No almacenamos datos bancarios. Los datos del grupo solo son visibles para sus miembros." },
];

export function FAQ() {
  return (
    <section id="faq" className="max-w-[1080px] mx-auto px-4 md:px-8 py-16">
      <div className="text-center mb-7 md:mb-11">
        <Pill color="uva">FAQ</Pill>
        <h2 className="font-display font-extrabold text-[28px] md:text-[40px] mt-5 tracking-tight">
          Preguntas frecuentes
        </h2>
      </div>
      <div className="max-w-[680px] mx-auto">
        {ITEMS.map((item) => (
          <FaqItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>
    </section>
  );
}
