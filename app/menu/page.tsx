import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MenuWrapper from "../components/MenuWrapper";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "The full Feed The Obsession BBQ menu — wood-smoked brisket, ribs, and pulled pork plates with Southern sides. Order online for pickup or dine-in in DeLand, FL.",
  alternates: { canonical: "/menu" },
  openGraph: {
    title: "Menu — Feed The Obsession BBQ",
    description:
      "Wood-smoked brisket, ribs, pulled pork plates & Southern sides. Order online for pickup or dine-in in DeLand, FL.",
    url: "/menu",
    images: ["/og-image.png"],
  },
};

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <MenuWrapper />
      </main>
      <Footer />
    </div>
  );
}
