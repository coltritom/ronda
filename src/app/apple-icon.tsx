import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

function Isotipo() {
  const s = 180 / 100;
  const circle = (cx: number, cy: number, r: number, fill: string) => (
    <div
      style={{
        position: "absolute",
        left: (cx - r) * s,
        top: (cy - r) * s,
        width: r * 2 * s,
        height: r * 2 * s,
        borderRadius: "50%",
        background: fill,
      }}
    />
  );

  return (
    <div
      style={{
        width: 180,
        height: 180,
        background: "#0B0B0B",
        position: "relative",
        display: "flex",
      }}
    >
      {circle(44, 25, 11,   "#E06347")}
      {circle(63, 33, 8,    "#D4806A")}
      {circle(61, 64, 8,    "#D4806A")}
      {circle(44, 73, 10.5, "#E06347")}
      {circle(29, 61, 10,   "#E06347")}
      {circle(30, 42, 9.5,  "#D9705A")}
      {circle(46, 48, 4,    "#F2B8A8")}
    </div>
  );
}

export default function AppleIcon() {
  return new ImageResponse(<Isotipo />, { width: 180, height: 180 });
}
