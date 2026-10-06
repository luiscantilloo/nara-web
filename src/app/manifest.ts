import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} · ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/ingreso",
    display: "standalone",
    background_color: "#F0ECE6",
    theme_color: "#FDCD22",
    lang: "es-CO",
    icons: [
      {
        src: "/nara/marca/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/nara/marca/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
