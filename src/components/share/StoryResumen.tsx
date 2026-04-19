import React from "react";

export interface StoryResumenData {
  groupName: string;
  year: number;
  totalJuntadas: number;
  totalSpent: number;
  topPresente: string;
  topFantasma: string;
  fantasmaFaltas: number;
}

export const StoryResumen = React.forwardRef<HTMLDivElement, StoryResumenData>(
  ({ groupName, year, totalJuntadas, totalSpent, topPresente, topFantasma, fantasmaFaltas }, ref) => {
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
          padding: "36px 32px 28px",
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
          background: "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: "#E85D3A", letterSpacing: "-0.5px" }}>
            ronda
          </span>
          <span style={{ fontSize: 13, color: "rgba(142,138,154,0.6)", fontWeight: 500 }}>
            {year}
          </span>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20, position: "relative" }}>

          {/* Group name */}
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#E85D3A",
              textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8,
            }}>
              El año del grupo
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#EDEAF0", lineHeight: 1.1 }}>
              {groupName}
            </div>
          </div>

          {/* Big stats */}
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { value: String(totalJuntadas), label: "juntadas" },
              { value: `$${(totalSpent / 1000).toFixed(0)}k`, label: "gastados" },
            ].map(({ value, label }) => (
              <div key={label} style={{
                flex: 1,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16,
                padding: "18px 12px",
                textAlign: "center",
              }}>
                <div style={{
                  fontSize: 50, fontWeight: 900, color: "#EDEAF0",
                  lineHeight: 1, fontFamily: '"Plus Jakarta Sans", sans-serif',
                }}>
                  {value}
                </div>
                <div style={{ fontSize: 12, color: "#8E8A9A", marginTop: 6, fontWeight: 500 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Awards row */}
          <div style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#8E8A9A" }}>🏆 Más presente</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#F5A623" }}>{topPresente}</span>
            </div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#8E8A9A" }}>👻 Fantasma</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#8B5CF6" }}>
                {topFantasma} · faltó {fantasmaFaltas}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", paddingTop: 20 }}>
          <span style={{
            fontSize: 11, color: "rgba(142,138,154,0.35)",
            letterSpacing: "1px", fontWeight: 500,
          }}>
            ronda.app
          </span>
        </div>
      </div>
    );
  }
);

StoryResumen.displayName = "StoryResumen";
