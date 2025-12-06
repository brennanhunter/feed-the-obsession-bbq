import type { Metadata } from "next";
import { Alfa_Slab_One, Barlow_Condensed } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Feed The Obsession BBQ - Veteran Owned Authentic BBQ",
  description: "Veteran owned BBQ serving high quality wood-smoked authentic barbecue. Brisket, ribs, pulled pork and more. Catering available.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${barlow.variable} ${alfaSlab.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
