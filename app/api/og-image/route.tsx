import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// Usar edge runtime para mejor rendimiento
export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "default";

    // Para la página principal, generar imagen con logo prominente sobre fondo negro
    if (type === "default" || !type) {
      return new ImageResponse(
        (
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
            {/* Logo principal - más grande y prominente */}
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
            {/* Línea decorativa con colores de marca */}
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
            {/* Subtítulo */}
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
            {/* Texto adicional */}
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
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Si es un producto, generar imagen con información del producto
    const productName = searchParams.get("name");
    const productPrice = searchParams.get("price");

    if (type === "product" && productName) {
      return new ImageResponse(
        (
          <div
            style={{
              background: "linear-gradient(135deg, #1a1a1a 0%, #000000 100%)",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px",
            }}
          >
            {/* Nombre del producto */}
            <div
              style={{
                fontSize: 56,
                fontWeight: 900,
                color: "#FFFFFF",
                marginBottom: 30,
                textAlign: "center",
                lineHeight: 1.2,
                maxWidth: "1000px",
              }}
            >
              {productName}
            </div>

            {/* Precio destacado */}
            {productPrice && (
              <div
                style={{
                  fontSize: 80,
                  fontWeight: 900,
                  color: "#D81B9C",
                  marginBottom: 30,
                  textAlign: "center",
                }}
              >
                {productPrice}
              </div>
            )}

            {/* Branding */}
            <div
              style={{
                fontSize: 32,
                color: "#CCCCCC",
                marginTop: 40,
                textAlign: "center",
              }}
            >
              Easy Store Ecuador
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Fallback: imagen por defecto
    return new ImageResponse(
      (
        <div
          style={{
            background: "#000000",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontSize: 48,
            fontWeight: 900,
          }}
        >
          Easy Store
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error("Error generando imagen OG:", error);
    // Retornar imagen de error simple
    return new ImageResponse(
      (
        <div
          style={{
            background: "#000000",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontSize: 48,
          }}
        >
          Easy Store
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
