"use client";

import { useEffect, useRef, useState } from "react";

function AnimatedCounter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          let current = 0;
          const step = Math.ceil(end / 40);
          const iv = setInterval(() => {
            current += step;
            if (current >= end) {
              setVal(end);
              clearInterval(iv);
            } else {
              setVal(current);
            }
          }, 30);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);

  return (
    <span ref={ref} className="font-display font-extrabold text-3xl md:text-[38px] text-humo leading-none">
      {val.toLocaleString("es-AR")}{suffix}
    </span>
  );
}

const DATA = [
  { end: 2400, suffix: "+", label: "Grupos creados" },
  { end: 18000, suffix: "+", label: "Juntadas registradas" },
  { end: 45000, suffix: "+", label: "Gastos divididos" },
  { end: 12, suffix: "", label: "Países con grupos" },
];

export function Stats() {
  return (
    <section className="max-w-[1080px] mx-auto px-4 md:px-8 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {DATA.map((s) => (
          <div
            key={s.label}
            className="p-4 md:p-6 rounded-2xl bg-noche-media border border-white/5 text-center"
          >
            <AnimatedCounter end={s.end} suffix={s.suffix} />
            <p className="mt-1.5 text-xs md:text-sm text-niebla font-medium">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
