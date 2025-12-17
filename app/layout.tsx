import type { Metadata } from "next";
import Header from "@/components/Header";
import Providers from "./providers";
import { UiLockProvider } from "@/lib/ui-lock";
import UiLockOverlay from "@/components/common/UiLockOverlay";
import { GoogleAnalytics, GoogleTagManager } from "@/lib/analytics";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://easystoreecu.com";
const siteName = "Easy Store";
const defaultDescription =
  "Tienda de productos tecnológicos, gadgets y servicios de reparación y desarrollo de software en Ecuador. Encuentra los mejores dispositivos y soluciones tecnológicas.";

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
    "comprar tecnología Ecuador",
    "productos electrónicos Ecuador",
    "reparación computadoras Ecuador",
    "servicios informáticos Ecuador",
    "tienda virtual Ecuador",
    "ecommerce Ecuador",
    "venta tecnología Ecuador",
    "accesorios tecnología Ecuador",
    "equipos informáticos Ecuador",
    "soporte técnico Ecuador",
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
        url: `${siteUrl}/api/og-image?type=default`,
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
    images: [`${siteUrl}/api/og-image?type=default`],
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
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://easystoreecu.com";

  // Structured Data - Organization & LocalBusiness
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": ["Store", "LocalBusiness", "OnlineStore"],
    name: "Easy Store",
    description:
      "Tienda de productos tecnológicos, gadgets y servicios de reparación y desarrollo de software en Ecuador",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    image: `${siteUrl}/api/og-image?type=default`,
    address: {
      "@type": "PostalAddress",
      addressCountry: "EC",
      addressRegion: "Ecuador",
      addressLocality: "Ecuador",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+593958720950",
      contactType: "customer service",
      email: "easystoreecu@gmail.com",
      availableLanguage: ["Spanish", "es-EC"],
      areaServed: "EC",
    },
    sameAs: [
      "https://www.instagram.com/easystoreecu/",
      // Agregar cuando tengas más redes sociales
      // "https://www.facebook.com/easystoreecu",
      // "https://twitter.com/easystoreecu"
    ],
    priceRange: "$$",
    paymentAccepted: ["Credit Card", "Cash", "Bank Transfer", "Payphone"],
    currenciesAccepted: "USD",
    openingHours: "Mo-Su",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Productos y Servicios Tecnológicos",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "Servicios",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Desarrollo de Software a Medida",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Reparación de Hardware",
              },
            },
          ],
        },
      ],
    },
  };

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {gaId && <GoogleAnalytics gaId={gaId} />}
        {gtmId && <GoogleTagManager gtmId={gtmId} />}
      </head>
      <body className="body-bg" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
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
