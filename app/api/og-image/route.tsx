import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { EasyStoreDefaultOgImage } from "@/lib/easy-store-og-image";

// Usar edge runtime para mejor rendimiento
export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "default";

    // Para la página principal, generar imagen con logo prominente sobre fondo negro
    if (type === "default" || !type) {
      return new ImageResponse(<EasyStoreDefaultOgImage />, {
        width: 1200,
        height: 630,
      });
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
