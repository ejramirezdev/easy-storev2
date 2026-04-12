/**
 * JSX compartido para imágenes OG (next/og ImageResponse). Edge-safe.
 */
export function EasyStoreDefaultOgImage() {
  return (
    <div
      style={{
        background: "#000000",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px",
      }}
    >
      <div
        style={{
          fontSize: 120,
          fontWeight: 900,
          color: "#FFFFFF",
          marginBottom: 30,
          textAlign: "center",
          letterSpacing: "-2px",
          lineHeight: 1.1,
        }}
      >
        Easy Store
      </div>
      <div
        style={{
          width: "200px",
          height: "6px",
          background:
            "linear-gradient(90deg, #D600AA 0%, #9CFF1E 50%, #D600AA 100%)",
          marginBottom: 30,
          borderRadius: "3px",
        }}
      />
      <div
        style={{
          fontSize: 36,
          color: "#D81B9C",
          textAlign: "center",
          maxWidth: "900px",
          fontWeight: 600,
          marginBottom: 20,
        }}
      >
        Productos Tecnológicos y Servicios en Ecuador
      </div>
      <div
        style={{
          fontSize: 24,
          color: "#CCCCCC",
          textAlign: "center",
          maxWidth: "800px",
          fontWeight: 400,
        }}
      >
        Tecnología al alcance de tus manos
      </div>
    </div>
  );
}
