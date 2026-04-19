import React from "react";
import type { WrappedCardProps } from "@/components/grupo/WrappedCard";

export type StoryResumenData = WrappedCardProps;

const AWARDS = (p: StoryResumenData) => [
  { icon: "🏆", label: "El Presente",     value: p.topPresente,   detail: null },
  { icon: "👻", label: "El Fantasma",     value: p.topFantasma,   detail: `faltó ${p.fantasmaFaltas}` },
  { icon: "⏳", label: "El Misterioso",   value: p.topMisterioso, detail: p.topMisteriosoDetalle },
  { icon: "🏠", label: "La Sede Oficial", value: p.topSede,       detail: `puso la casa ${p.sedeVeces} veces` },
];

export const StoryResumen = React.forwardRef<HTMLDivElement, StoryResumenData>(
  (props, ref) => {
    const { groupName, year, totalJuntadas, totalSies } = props;

    return (
      <div
        ref={ref}
        style={{
          width: 390,
          height: 693,
          background: "#1A1625",
          position: "relative",
          overflow: "hidden",
          fontFamily: '"Plus Jakarta Sans", Inter, sans-serif',
          display: "flex",
          flexDirection: "column",
          padding: "36px 30px 28px",
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        {/* Glow top-right */}
        <div style={{
          position: "absolute", top: -60, right: -60,
          width: 240, height: 240, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,93,58,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        {/* Glow bottom-left */}
        <div style={{
          position: "absolute", bottom: 40, left: -80,
          width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: "#E85D3A", letterSpacing: "-0.5px" }}>
            ronda
          </span>
          <span style={{ fontSize: 13, color: "rgba(142,138,154,0.6)", fontWeight: 500 }}>
            {year}
          </span>
        </div>

        {/* Group title block */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#E85D3A",
            textTransform: "uppercase", letterSpacing: "2.5px", marginBottom: 6,
          }}>
            El año del grupo
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#EDEAF0", lineHeight: 1.1 }}>
            {groupName}
          </div>
          <div style={{ fontSize: 13, color: "#8E8A9A", marginTop: 5 }}>
            📅 {totalJuntadas} juntadas registradas
          </div>
        </div>

        {/* Main metric card */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18,
          padding: "20px 16px",
          textAlign: "center",
          marginBottom: 18,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#8E8A9A",
            textTransform: "uppercase", letterSpacing: "2px", marginBottom: 10,
          }}>
            Confirmaciones &apos;Voy&apos;
          </div>
          <div style={{
            fontSize: 72, fontWeight: 900, color: "#EDEAF0",
            lineHeight: 1, fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}>
            {totalSies}
          </div>
          <div style={{ fontSize: 12, color: "#8E8A9A", marginTop: 8 }}>
            Total de síes que dieron en el año
          </div>
        </div>

        {/* Awards */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 18,
          padding: "4px 16px",
          flex: 1,
        }}>
          {AWARDS(props).map(({ icon, label, value, detail }, i) => (
            <div key={label} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 0",
              borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}>
              <span style={{ fontSize: 18, width: 26, textAlign: "center", flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: "#8E8A9A", fontWeight: 500, lineHeight: 1.2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#EDEAF0", lineHeight: 1.3 }}>{value}</div>
              </div>
              {detail && (
                <div style={{
                  fontSize: 11, color: "#8E8A9A", textAlign: "right",
                  maxWidth: 110, lineHeight: 1.3, flexShrink: 0,
                }}>
                  {detail}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", paddingTop: 14 }}>
          <span style={{ fontSize: 11, color: "rgba(142,138,154,0.3)", letterSpacing: "1px", fontWeight: 500 }}>
            ronda.app
          </span>
        </div>
      </div>
    );
  }
);

StoryResumen.displayName = "StoryResumen";
