import Header from "./components/Header";
import LogoOverlay from "./components/LogoOverlay";
import Hero from "./components/home/Hero";
import InfoStrip, { type TodaySpecial } from "./components/home/InfoStrip";
import Favorites from "./components/home/Favorites";
import Reviews from "./components/Reviews";
import Story from "./components/home/Story";
import SmokerStrip from "./components/home/SmokerStrip";
import Footer from "./components/Footer";
import { getMenu } from "@/lib/catalog";
import { getOpenStatus } from "@/lib/hours";
import { isSpecialAvailable } from "@/lib/specials";

export const revalidate = 60;

export default async function Home() {
  const menu = await getMenu();
  const status = getOpenStatus();
  const todays = menu.find((i) => i.special && !i.soldOut && isSpecialAvailable(i.special));
  const special: TodaySpecial = todays
    ? { name: todays.title.replace(/^\w+day special\s*/i, ""), price: todays.price }
    : null;

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
      <Hero status={status} />
      <InfoStrip status={status} special={special} />
      <Favorites items={menu} />
      <Reviews />
      <Story />
      <SmokerStrip />
      <Footer />
    </div>
  );
}
