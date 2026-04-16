import { Pill } from "@/components/ui/Pill";
import { PhoneMockup } from "@/components/landing/PhoneMockup";

export function Features() {
  return (
    <section id="producto" className="max-w-[1080px] mx-auto px-4 md:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-9 md:mb-14">
        <Pill color="menta">Producto</Pill>
        <h2 className="font-display font-extrabold text-[28px] md:text-[40px] mt-5 mb-2.5 tracking-tight">
          Todo lo que tu grupo necesita
        </h2>
        <p className="text-[15px] md:text-[17px] text-niebla leading-relaxed max-w-[520px] mx-auto">
          Gastos, asistencia, rankings y memoria grupal en una sola experiencia con alma social.
        </p>
      </div>

      {/* Feature 1: MEMORIA */}
      <div className="flex flex-col md:flex-row items-center gap-7 md:gap-13 mb-8 md:mb-16 p-6 md:p-10 bg-noche-media rounded-3xl border border-white/5">
        <div className="flex-1 order-2 md:order-1">
          <div className="text-[28px] mb-3.5 w-[52px] h-[52px] rounded-[14px] bg-uva/[0.1] flex items-center justify-center">📖</div>
          <h3 className="font-display font-bold text-[22px] md:text-[28px] mb-2.5 tracking-tight">Cada juntada cuenta</h3>
          <p className="text-sm md:text-base text-niebla leading-relaxed mb-4">
            Ronda registra quién fue, quién faltó, qué se hizo y cuánto se gastó. Tu grupo construye
            un historial real que antes se perdía en chats de WhatsApp. A fin de año, vas a poder ver
            cuántas veces se juntaron, quién fue el fantasma del año y cuánta plata movieron juntos.
          </p>
          {/* Wrapped preview */}
          <div className="p-3.5 md:p-4 rounded-[14px] bg-noche border border-white/[0.06]">
            <p className="text-[11px] text-fuego font-semibold uppercase tracking-wider mb-1.5">Los del asado — 2026</p>
            <div className="flex gap-3 md:gap-5 flex-wrap">
              {[
                { n: "14", l: "juntadas" },
                { n: "$182k", l: "gastados" },
                { n: "Nico", l: "fantasma del año" },
              ].map((d) => (
                <div key={d.l}>
                  <p className="font-display font-bold text-lg text-humo">{d.n}</p>
                  <p className="text-[11px] text-niebla">{d.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <PhoneMockup />
        </div>
      </div>

      {/* Feature 2: RANKINGS */}
      <div className="flex flex-col md:flex-row-reverse items-center gap-7 md:gap-13 mb-8 md:mb-16 p-6 md:p-10 bg-noche-media rounded-3xl border border-white/5">
        <div className="flex-1 order-2 md:order-1">
          <div className="text-[28px] mb-3.5 w-[52px] h-[52px] rounded-[14px] bg-ambar/[0.1] flex items-center justify-center">🏆</div>
          <h3 className="font-display font-bold text-[22px] md:text-[28px] mb-2.5 tracking-tight">Los datos no mienten</h3>
          <p className="text-sm md:text-base text-niebla leading-relaxed mb-4">
            Rankings automáticos con datos reales. Quién es el más presente, quién es el fantasma oficial,
            quién puso más plata. Cada etiqueta tiene evidencia. Compartilo en el grupo y que arranque el debate.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Pill color="ambar">🏆 Invicto</Pill>
            <Pill color="uva">👻 Fantasma oficial</Pill>
            <Pill color="rosa">🏅 MVP</Pill>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <PhoneMockup>
            <MiniScreenRanking />
          </PhoneMockup>
        </div>
      </div>

      {/* Feature 3: CUENTAS */}
      <div className="flex flex-col md:flex-row items-center gap-7 md:gap-13 mb-8 md:mb-16 p-6 md:p-10 bg-noche-media rounded-3xl border border-white/5">
        <div className="flex-1 order-2 md:order-1">
          <div className="text-[28px] mb-3.5 w-[52px] h-[52px] rounded-[14px] bg-fuego/[0.1] flex items-center justify-center">💸</div>
          <h3 className="font-display font-bold text-[22px] md:text-[28px] mb-2.5 tracking-tight">Cuentas claras, grupo unido</h3>
          <p className="text-sm md:text-base text-niebla leading-relaxed mb-4">
            Cargá un gasto en 30 segundos. Ronda calcula cuánto le toca a cada uno y simplifica
            las deudas para que haya la menor cantidad de transferencias. Sin planillas, sin capturas
            de Mercado Pago, sin quilombo.
          </p>
          <div className="flex gap-2.5 flex-wrap">
            {["Pusiste $5.000", "Te toca $2.500", "Debés $1.200"].map((t) => (
              <span key={t} className="px-3 py-1.5 rounded-[10px] bg-white/5 text-[13px] font-semibold text-humo">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="order-1 md:order-2">
          <PhoneMockup>
            <MiniScreenCuentas />
          </PhoneMockup>
        </div>
      </div>

      {/* Features 4 + 5 (grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Compartir */}
        <div className="p-6 md:p-8 bg-noche-media rounded-3xl border border-white/5">
          <div className="text-[28px] mb-3.5 w-[52px] h-[52px] rounded-[14px] bg-rosa/[0.1] flex items-center justify-center">📲</div>
          <h3 className="font-display font-bold text-xl md:text-[22px] mb-2.5">Hecho para compartir</h3>
          <p className="text-sm text-niebla leading-relaxed mb-4">
            Cada ranking, badge y resumen se puede compartir como imagen en WhatsApp o Instagram.
            Diseñado para que el screenshot sea publicidad gratis.
          </p>
          <div className="p-4 rounded-xl bg-noche text-center border border-white/[0.06]">
            <span className="text-[22px]">👻</span>
            <p className="font-display font-bold text-[15px] text-humo mt-1">FANTASMA OFICIAL</p>
            <p className="text-[11px] text-niebla mt-0.5">Nico — faltó 5 de 8</p>
            <p className="mt-2 text-[10px] text-fuego font-semibold">ronda · el tracker de tu grupo</p>
          </div>
        </div>

        {/* Velocidad */}
        <div className="p-6 md:p-8 bg-noche-media rounded-3xl border border-white/5">
          <div className="text-[28px] mb-3.5 w-[52px] h-[52px] rounded-[14px] bg-menta/[0.1] flex items-center justify-center">⚡</div>
          <h3 className="font-display font-bold text-xl md:text-[22px] mb-2.5">Rápido como un mensaje</h3>
          <p className="text-sm text-niebla leading-relaxed mb-4">
            Si Ronda fuera más lenta que un chat de WhatsApp, no existiría. Cargar un gasto toma
            30 segundos. Cerrar las cuentas, un toque.
          </p>
          <div className="flex flex-col gap-2.5">
            {[
              { action: "Cargar un gasto", time: "30 seg" },
              { action: "Registrar asistencia", time: "15 seg" },
              { action: "Cerrar cuentas", time: "1 toque" },
              { action: "Crear grupo e invitar", time: "2 min" },
            ].map((t) => (
              <div key={t.action} className="flex justify-between px-3 py-2 rounded-[10px] bg-white/[0.03]">
                <span className="text-[13px] text-humo">{t.action}</span>
                <span className="text-[13px] text-menta font-semibold">{t.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Mini screens para los phone mockups ─── */

function MiniScreenRanking() {
  return (
    <div className="px-2.5 pb-1">
      <p className="font-display font-bold text-xs text-humo mb-2">El ranking no miente</p>
      {/* Podio */}
      <div className="flex items-end justify-center gap-1.5 mb-2.5">
        <div className="text-center flex-1">
          <p className="text-base">👩</p>
          <p className="text-[8px] text-humo font-semibold">Lucía</p>
          <div className="bg-noche-media rounded-t-[5px] py-2 mt-1 text-[11px] font-bold text-niebla font-display">2°</div>
        </div>
        <div className="text-center flex-1">
          <p className="text-[8px] mb-0.5">👑</p>
          <p className="text-xl">🧔</p>
          <p className="text-[8px] text-ambar font-semibold">Mati</p>
          <div className="bg-ambar/20 border border-ambar/40 rounded-t-[5px] py-3 mt-1 text-[13px] font-bold text-ambar font-display">1°</div>
        </div>
        <div className="text-center flex-1">
          <p className="text-base">💃</p>
          <p className="text-[8px] text-humo font-semibold">Sofi</p>
          <div className="bg-noche-media rounded-t-[5px] py-1.5 mt-1 text-[11px] font-bold text-niebla font-display">3°</div>
        </div>
      </div>
      {[
        { e: "🏆", t: "El más presente", n: "Mati", c: "text-ambar bg-ambar/20" },
        { e: "👻", t: "Fantasma oficial", n: "Nico", c: "text-uva bg-uva/20" },
        { e: "💰", t: "La billetera", n: "Lucía", c: "text-ambar bg-ambar/20" },
        { e: "🏅", t: "MVP de la ronda", n: "Mati", c: "text-rosa bg-rosa/20" },
      ].map((r, i) => (
        <div key={i} className="flex items-center justify-between py-1 border-t border-white/5">
          <span className="text-[9px] text-humo">{r.e} {r.n}</span>
          <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${r.c}`}>{r.t}</span>
        </div>
      ))}
    </div>
  );
}

function MiniScreenCuentas() {
  return (
    <div className="px-2.5 pb-1">
      <p className="font-display font-bold text-xs text-humo mb-0.5">Cuentas del grupo</p>
      <p className="text-[9px] text-niebla mb-2">Así quedaron los números.</p>
      {[
        { from: "😎", fn: "Nico", to: "🧔", tn: "Mati", amt: "$2.400", paid: false },
        { from: "🧑", fn: "Facu", to: "👩", tn: "Lucía", amt: "$2.400", paid: false },
        { from: "💃", fn: "Sofi", to: "🧔", tn: "Mati", amt: "$1.800", paid: true },
      ].map((d, i) => (
        <div key={i} className={`bg-noche-media rounded-lg p-2 mb-1.5 ${d.paid ? "opacity-45" : ""}`}>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-sm">{d.from}</span>
            <span className="text-[10px] text-niebla">→</span>
            <span className="text-sm">{d.to}</span>
          </div>
          <p className="text-[10px] font-semibold text-humo">{d.fn} le debe a {d.tn}</p>
          {d.paid
            ? <p className="text-[9px] text-exito font-semibold mt-0.5">✓ Cuenta cerrada</p>
            : <p className="text-[13px] font-bold text-humo mt-0.5">{d.amt}</p>
          }
        </div>
      ))}
    </div>
  );
}
