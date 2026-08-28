import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://cardelume.com";
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/create", "/api/", "/checkout/", "/account/", "/internal/", "/health/"]
    }],
    sitemap: `${base}/sitemap.xml`,
    host: base
  };
}
