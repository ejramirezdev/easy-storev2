import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://easystoreecu.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/account/",
          "/cart/",
          "/checkout/",
          "/orders/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/account/",
          "/cart/",
          "/checkout/",
          "/orders/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

