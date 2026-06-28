import Header from "./components/Header";
import LogoOverlay from "./components/LogoOverlay";
import Carousel from "./components/Carousel";
import FindTheSmoke from "./components/FindTheSmoke";
import MenuWrapper from "./components/MenuWrapper";
import CustomSmokers from "./components/CustomSmokers";
import Footer from "./components/Footer";
import { CartProvider } from "./components/cart/CartContext";
import CartWidget from "./components/cart/CartWidget";
// BIKE WEEK - uncomment for next bike week
// import BikeWeekModal from "./components/BikeWeekModal";

export default function Home() {
  return (
    <CartProvider>
    <div className="min-h-screen bg-black text-white">
      {/* Primary SEO heading — one H1 per page, keyword + location. Visually hidden
          so it doesn't alter the hero design. */}
      <h1 className="sr-only">
        Feed The Obsession BBQ — Veteran-Owned Wood-Smoked Barbecue in DeLand, FL
      </h1>
      {/* BIKE WEEK - uncomment for next bike week */}
      {/* <BikeWeekModal /> */}
      <Header overlayLogo />
      <LogoOverlay />
      <Carousel />
      <FindTheSmoke />
      <MenuWrapper />
      <CustomSmokers />
      <Footer />
      <CartWidget />
    </div>
    </CartProvider>
  );
}
