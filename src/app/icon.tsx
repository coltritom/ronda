import { ImageResponse } from "next/og";

export const runtime = "edge";

export function generateImageMetadata() {
  return [
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

function Isotipo({ size }: { size: number }) {
  const s = size / 100;
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
        width: size,
        height: size,
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

export default function Icon({ id }: { id: string }) {
  const size = id === "512" ? 512 : 192;
  return new ImageResponse(<Isotipo size={size} />, { width: size, height: size });
}
