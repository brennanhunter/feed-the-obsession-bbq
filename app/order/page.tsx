import type { Metadata } from "next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import OrderPage from "../components/cart/OrderPage";
import { getMenu } from "@/lib/catalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Your Order",
  description: "Review your Feed The Obsession BBQ order and pay securely for pickup in DeLand, FL.",
  robots: { index: false, follow: true },
};

export default async function Page() {
  const items = await getMenu();
  // Quick add-ons for the "Don't forget" row: sides and extras that can be ordered online.
  const extras = items.filter(
    (i) => (i.section === "Sides" || i.section === "Extras") && !i.callToOrder
  );
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main>
        <OrderPage extras={extras} />
      </main>
      <Footer />
    </div>
  );
}
