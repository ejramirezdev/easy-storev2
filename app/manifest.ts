import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Easy Store - Productos Tecnológicos Ecuador",
    short_name: "Easy Store",
    description: "Tienda de productos tecnológicos, gadgets y servicios de reparación y desarrollo de software en Ecuador. Encuentra los mejores dispositivos y soluciones tecnológicas.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0B",
    theme_color: "#D81B9C",
    orientation: "portrait-primary",
    categories: ["shopping", "technology"],
    lang: "es-EC",
    dir: "ltr",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/screenshot-narrow.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
  };
}

