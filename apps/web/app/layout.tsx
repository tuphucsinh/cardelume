import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/noto-serif-jp/500.css";
import "@fontsource/noto-sans-jp/400.css";
import "@fontsource/noto-serif-kr/500.css";
import "@fontsource/noto-sans-kr/400.css";
import "@fontsource/noto-serif-sc/500.css";
import "@fontsource/noto-sans-sc/400.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { PhysicalEffectsProvider } from "../components/physical-effects";
import { headers } from "next/headers";
import { validLocale } from "../i18n/locale-detection";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cardelume.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CardeLume — Beautiful cards, made in moments.",
    template: "%s · CardeLume"
  },
  description: "Personal, thoughtful greeting cards created just for them. No design skills, no subscription. Pay only when you love it.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "CardeLume",
    title: "CardeLume — Beautiful cards, made in moments.",
    description: "Personal, thoughtful, and created just for them.",
    images: [{ url: "/brand/og-card.png", width: 1200, height: 630, alt: "CardeLume" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "CardeLume — Beautiful cards, made in moments.",
    description: "Personal, thoughtful, and created just for them."
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf8f1",
  colorScheme: "light"
};

export default async function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  const h=await headers();
  const locale=validLocale(h.get("x-cardelume-locale"))??"en";
  return (
    <html lang={locale}>
      <body><PhysicalEffectsProvider>{children}</PhysicalEffectsProvider></body>
    </html>
  );
}
