import Header from "./components/Header";
import LogoOverlay from "./components/LogoOverlay";
import Carousel from "./components/Carousel";
import FindTheSmoke from "./components/FindTheSmoke";
import MenuWrapper from "./components/MenuWrapper";
import CustomSmokers from "./components/CustomSmokers";
import BookTable from "./components/BookTable";
import Footer from "./components/Footer";
// BIKE WEEK - uncomment for next bike week
// import BikeWeekModal from "./components/BikeWeekModal";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* BIKE WEEK - uncomment for next bike week */}
      {/* <BikeWeekModal /> */}
      <Header />
      <LogoOverlay />
      <Carousel />
      <FindTheSmoke />
      <MenuWrapper />
      <CustomSmokers />
      <BookTable />
      <Footer />
    </div>
  );
}
