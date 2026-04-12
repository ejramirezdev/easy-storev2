import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Easy Store - Productos Tecnológicos Ecuador",
    short_name: "Easy Store",
    description:
      "Tienda de productos tecnológicos, gadgets y servicios de reparación y desarrollo de software en Ecuador. Encuentra los mejores dispositivos y soluciones tecnológicas.",
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
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
