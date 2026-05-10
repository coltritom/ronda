import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ronda",
    short_name: "Ronda",
    description: "La memoria de tus juntadas",
    start_url: "/home",
    display: "standalone",
    background_color: "#0B0B0B",
    theme_color: "#E06347",
    orientation: "portrait",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
