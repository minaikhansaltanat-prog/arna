import type { MetadataRoute } from "next";
import { ICONS } from "@/lib/brand";
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
      { src: ICONS.icon192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: ICONS.icon512, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: ICONS.maskable512, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
