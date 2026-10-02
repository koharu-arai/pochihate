import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ポチハテ — 買うか迷ったら",
    short_name: "ポチハテ",
    description: "買うか迷ったら、ポチる前に数字で考える",
    lang: "ja",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef1f4",
    theme_color: "#eef1f4",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "判定する", url: "/", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "30日リスト", url: "/list", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
