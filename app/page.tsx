import Header from "./components/Header";
import LogoOverlay from "./components/LogoOverlay";
import Carousel from "./components/Carousel";
import FindTheSmoke from "./components/FindTheSmoke";
import MenuPreview from "./components/MenuPreview";
import Reviews from "./components/Reviews";
import CustomSmokers from "./components/CustomSmokers";
import Gallery from "./components/Gallery";
import Footer from "./components/Footer";
import { getMenu } from "@/lib/catalog";

export const revalidate = 60;

export default async function Home() {
  const menu = await getMenu();
  return (
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
      <MenuPreview items={menu} />
      <Reviews />
      <CustomSmokers />
      <Gallery />
      <Footer />
    </div>
  );
}
