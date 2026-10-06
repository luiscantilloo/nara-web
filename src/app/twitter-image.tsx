import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const runtime = "edge";
export const alt = `${SITE_NAME} · ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #F0ECE6 0%, #E8E0D4 55%, #FDCD22 160%)",
          padding: 64,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "#FDCD22",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
              color: "#161413",
            }}
          >
            N
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#161413",
              letterSpacing: "-0.02em",
            }}
          >
            {SITE_NAME}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
          <div
            style={{
              fontSize: 44,
              fontWeight: 600,
              color: "#161413",
              lineHeight: 1.2,
            }}
          >
            {SITE_TAGLINE}
          </div>
          <div style={{ fontSize: 24, color: "#5E5750", lineHeight: 1.35 }}>
            proyectonara.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
