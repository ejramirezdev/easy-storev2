import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easystoreecu.com";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contáctanos en Easy Store. Estamos aquí para ayudarte con tus necesidades tecnológicas. Servicio al cliente en Ecuador.",
  keywords: [
    "contacto Easy Store",
    "soporte técnico Ecuador",
    "atención al cliente Ecuador",
    "consultoría tecnología Ecuador",
  ],
  openGraph: {
    title: "Contacto | Easy Store",
    description: "Contáctanos para consultas sobre productos tecnológicos y servicios en Ecuador.",
    url: `${siteUrl}/contact`,
  },
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

