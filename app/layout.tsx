import type { Metadata } from "next";
import Header from "@/components/Header";
import Providers from "./providers";
import { UiLockProvider } from "@/lib/ui-lock";
import UiLockOverlay from "@/components/common/UiLockOverlay";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easy-storev2.vercel.app";
const siteName = "Easy Store";
const defaultDescription = "Tienda de productos tecnológicos, gadgets y servicios de reparación y desarrollo de software en Ecuador. Encuentra los mejores dispositivos y soluciones tecnológicas.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} - Productos Tecnológicos y Servicios en Ecuador`,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    "tienda tecnología Ecuador",
    "productos tecnológicos Ecuador",
    "gadgets Ecuador",
    "reparación laptops Ecuador",
    "desarrollo software Ecuador",
    "hardware Ecuador",
    "software a medida Ecuador",
    "dispositivos electrónicos Ecuador",
    "tecnología Ecuador",
    "tienda online Ecuador",
  ],
  authors: [{ name: "Easy Store" }],
  creator: "Easy Store",
  publisher: "Easy Store",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_EC",
    url: siteUrl,
    siteName: siteName,
    title: `${siteName} - Productos Tecnológicos y Servicios en Ecuador`,
    description: defaultDescription,
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} - Productos Tecnológicos y Servicios en Ecuador`,
    description: defaultDescription,
    images: [`${siteUrl}/og-image.jpg`],
    creator: "@easystoreecu",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    // Agregar cuando tengas los códigos de verificación
    // google: "tu-codigo-google",
    // yandex: "tu-codigo-yandex",
    // bing: "tu-codigo-bing",
  },
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easy-storev2.vercel.app";
  
  // Structured Data - Organization
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": "Easy Store",
    "description": "Tienda de productos tecnológicos, gadgets y servicios de reparación y desarrollo de software en Ecuador",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "image": `${siteUrl}/og-image.jpg`,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "EC",
      "addressLocality": "Ecuador"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+593958720950",
      "contactType": "customer service",
      "email": "easystoreecu@gmail.com",
      "availableLanguage": "Spanish"
    },
    "sameAs": [
      // Agregar cuando tengas redes sociales
      // "https://www.facebook.com/easystoreecu",
      // "https://www.instagram.com/easystoreecu",
      // "https://twitter.com/easystoreecu"
    ],
    "priceRange": "$$",
    "paymentAccepted": "Credit Card, Cash, Bank Transfer",
    "currenciesAccepted": "USD"
  };

  return (
    <html lang="es" suppressHydrationWarning>
      <body className="body-bg" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <UiLockProvider>
          <UiLockOverlay />
          <Providers>
            <Header />
            {children}
            {modal}
          </Providers>
        </UiLockProvider>
      </body>
    </html>
  );
}
