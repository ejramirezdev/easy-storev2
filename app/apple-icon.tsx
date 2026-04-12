import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #121218 0%, #000000 100%)",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: -2,
            lineHeight: 1,
          }}
        >
          Easy
        </div>
        <div
          style={{
            fontSize: 38,
            fontWeight: 900,
            color: "#D81B9C",
            letterSpacing: 2,
            marginTop: 4,
          }}
        >
          STORE
        </div>
        <div
          style={{
            marginTop: 14,
            width: 100,
            height: 5,
            borderRadius: 3,
            background:
              "linear-gradient(90deg, #D600AA 0%, #9CFF1E 50%, #D600AA 100%)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
