import Header from "./components/Header";
import Carousel from "./components/Carousel";
import MenuWrapper from "./components/MenuWrapper";
import CustomSmokers from "./components/CustomSmokers";
import BookTable from "./components/BookTable";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <Carousel />
      <MenuWrapper />
      <CustomSmokers />
      <BookTable />
      <Footer />
    </div>
  );
}
