import React from "react";

export interface StoryRankingData {
  groupName: string;
  rankingEmoji: string;
  rankingLabel: string;
  top3: { position: number; name: string; score: string }[];
}

const PODIUM_HEIGHT: Record<number, number> = { 1: 90, 2: 64, 3: 48 };
const PODIUM_FONT: Record<number, number> = { 1: 22, 2: 18, 3: 18 };

export const StoryRanking = React.forwardRef<HTMLDivElement, StoryRankingData>(
  ({ groupName, rankingEmoji, rankingLabel, top3 }, ref) => {
    // Sort: [2°, 1°, 3°] for visual podium order
    const ordered = [
      top3.find((p) => p.position === 2)!,
      top3.find((p) => p.position === 1)!,
      top3.find((p) => p.position === 3)!,
    ].filter(Boolean);

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
          background: "radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        {/* Glow bottom-left */}
        <div style={{
          position: "absolute", bottom: 40, left: -80,
          width: 280, height: 280, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,93,58,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: "#E85D3A", letterSpacing: "-0.5px" }}>
            ronda
          </span>
          <div style={{
            background: "rgba(245,166,35,0.12)",
            border: "1px solid rgba(245,166,35,0.2)",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 12, fontWeight: 600, color: "#F5A623",
          }}>
            {rankingEmoji} {rankingLabel}
          </div>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: 36, position: "relative" }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#8E8A9A",
            textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8,
          }}>
            {groupName}
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, color: "#EDEAF0", lineHeight: 1.1 }}>
            El ranking<br />no miente.
          </div>
        </div>

        {/* Podium */}
        <div style={{
          flex: 1, display: "flex", alignItems: "flex-end",
          justifyContent: "center", gap: 10, marginBottom: 24,
          position: "relative",
        }}>
          {ordered.map((p) => {
            const isFirst = p.position === 1;
            const podiumH = PODIUM_HEIGHT[p.position] ?? 48;
            return (
              <div key={p.position} style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 6,
              }}>
                {isFirst && (
                  <span style={{ fontSize: 22, marginBottom: 2 }}>👑</span>
                )}
                {/* Avatar circle */}
                <div style={{
                  width: isFirst ? 60 : 48,
                  height: isFirst ? 60 : 48,
                  borderRadius: "50%",
                  background: isFirst
                    ? "rgba(245,166,35,0.15)"
                    : "rgba(255,255,255,0.07)",
                  border: isFirst
                    ? "2px solid rgba(245,166,35,0.4)"
                    : "2px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: isFirst ? 26 : 20,
                  flexShrink: 0,
                }}>
                  {p.position}°
                </div>
                <div style={{
                  fontSize: isFirst ? 15 : 13,
                  fontWeight: 700,
                  color: isFirst ? "#F5A623" : "#EDEAF0",
                  textAlign: "center",
                }}>
                  {p.name}
                </div>
                <div style={{
                  fontSize: 11, color: isFirst ? "#F5A623" : "#8E8A9A",
                  fontWeight: isFirst ? 600 : 400, textAlign: "center",
                }}>
                  {p.score}
                </div>
                {/* Pedestal */}
                <div style={{
                  width: "100%",
                  height: podiumH,
                  borderRadius: "8px 8px 0 0",
                  background: isFirst
                    ? "rgba(245,166,35,0.15)"
                    : "rgba(255,255,255,0.05)",
                  border: isFirst
                    ? "1px solid rgba(245,166,35,0.25)"
                    : "1px solid rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: PODIUM_FONT[p.position] ?? 18,
                  fontWeight: 800,
                  color: isFirst ? "rgba(245,166,35,0.6)" : "rgba(255,255,255,0.15)",
                }}>
                  {p.position}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center" }}>
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

StoryRanking.displayName = "StoryRanking";
