import type { Metadata, Viewport } from "next";
import { Alfa_Slab_One, Barlow_Condensed, Metal_Mania } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { business } from "@/lib/business";
import StructuredData from "./components/StructuredData";

const alfaSlab = Alfa_Slab_One({
  variable: "--font-alfa",
  subsets: ["latin"],
  weight: "400",
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const metalMania = Metal_Mania({
  variable: "--font-metal",
  subsets: ["latin"],
  weight: "400",
});

const DESCRIPTION =
  "Veteran-owned BBQ in DeLand, FL serving wood-smoked brisket, ribs, and pulled pork. Dine in or take out at 1204 E New York Ave — plus custom smoker builds and catering.";

export const metadata: Metadata = {
  metadataBase: new URL(business.url),
  title: {
    default: "Feed The Obsession BBQ | Veteran-Owned Wood-Smoked BBQ in DeLand, FL",
    template: "%s | Feed The Obsession BBQ",
  },
  description: DESCRIPTION,
  applicationName: business.name,
  keywords: [
    "BBQ DeLand FL",
    "barbecue DeLand",
    "best BBQ DeLand",
    "brisket DeLand",
    "ribs DeLand",
    "pulled pork DeLand",
    "BBQ catering DeLand",
    "BBQ near me",
    "veteran owned BBQ",
    "wood smoked BBQ",
    "custom smokers",
    "Feed The Obsession BBQ",
    "FTO Barbeque",
  ],
  authors: [{ name: business.name, url: business.url }],
  creator: business.name,
  publisher: business.name,
  category: "restaurant",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: business.name,
    title: "Feed The Obsession BBQ — Wood-Smoked BBQ in DeLand, FL",
    description: DESCRIPTION,
    url: business.url,
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Feed The Obsession BBQ — Veteran-Owned Wood-Smoked BBQ in DeLand, FL",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Feed The Obsession BBQ — Wood-Smoked BBQ in DeLand, FL",
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#020304",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${barlow.variable} ${alfaSlab.variable} ${metalMania.variable} antialiased font-sans`}
      >
        <StructuredData />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
