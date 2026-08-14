import { ImageResponse } from "next/og";

export const alt = "InfoGraphic AI - AI-Powered Infographic Generator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
          color: "#ffffff",
          fontFamily: "Inter, sans-serif",
          padding: 60,
        }}
      >
        <div style={{ fontSize: 96, lineHeight: 1.1, fontWeight: 800 }}>
          InfoGraphic AI
        </div>
        <div
          style={{
            fontSize: 32,
            opacity: 0.9,
            marginTop: 24,
            textAlign: "center",
          }}
        >
          Turn ideas into stunning infographics with AI
        </div>
      </div>
    ),
    { ...size },
  );
}
