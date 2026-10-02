import type { MetadataRoute } from "next";
import { withBase } from "@/lib/site";

export const dynamic = "force-static";

/** "Add to home screen" turns the demo into a full-screen, app-like icon on phones. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ARNA",
    short_name: "ARNA",
    description: "Live voice translation for events",
    start_url: withBase("/"),
    scope: withBase("/"),
    display: "standalone",
    orientation: "portrait",
    background_color: "#082a32",
    theme_color: "#0e3b45",
    icons: [
      { src: withBase("/brand/emblem-192.png"), sizes: "192x192", type: "image/png" },
      { src: withBase("/brand/emblem-512.png"), sizes: "512x512", type: "image/png" },
    ],
  };
}
