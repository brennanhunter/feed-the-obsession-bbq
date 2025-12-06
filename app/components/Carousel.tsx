"use client";

import Image from "next/image";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function Carousel() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 8000,
    appendDots: (dots: any) => (
      <div>
        <ul className="flex justify-start w-full">{dots}</ul>
      </div>
    ),
    customPaging: () => (
      <div className="w-3 h-3 border bg-white rounded-full mt-10"></div>
    ),
  };

  return (
    <div className="h-screen w-full container mx-auto -mt-[5.5rem] relative">
      <Slider {...settings} className="h-full">
        <div className="h-screen relative">
          <div className="absolute top-0 left-0 w-full h-full">
            <Image
              src="/pictures/business/ScooterCookingInGrass.jpg"
              alt="BBQ Setup"
              fill
              priority
              className="object-cover"
            />
          </div>
          <div className="relative z-10 mt-48 flex flex-col items-start gap-y-10 px-6">
            <div className="bg-black/60 backdrop-blur-sm p-8 border-2 border-white/20 hover:border-red-600/80 hover:shadow-[0_0_40px_rgba(220,38,38,0.6),0_0_80px_rgba(220,38,38,0.3)] transition-all duration-700">
              <h1 className="text-6xl font-display tracking-wider text-white">FEED THE OBSESSION</h1>
              <p className="text-sm sm:w-2/3 w-full mt-6 text-white/90">
                Veteran owned BBQ serving authentic wood-smoked meats. Giant smokers, 
                high quality ingredients, and a passion for great BBQ.
              </p>
              <button className="text-white px-[30px] py-[8px] rounded-3xl bg-red-600 cursor-pointer hover:opacity-70 transition-all mt-6">
                Order Now
              </button>
            </div>
          </div>
        </div>
        <div className="h-screen relative">
          <div className="absolute top-0 left-0 w-full h-full">
            <Image
              src="/pictures/business/FullSetupSmokerAndTent.jpg"
              alt="Full BBQ Setup"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative z-10 mt-48 flex flex-col items-start gap-y-10 px-6">
            <div className="bg-black/60 backdrop-blur-sm p-8 border-2 border-white/20 hover:border-red-600/80 hover:shadow-[0_0_40px_rgba(220,38,38,0.6),0_0_80px_rgba(220,38,38,0.3)] transition-all duration-700">
              <h1 className="text-6xl font-display tracking-wider text-white">WOOD SMOKED BBQ</h1>
              <p className="text-sm sm:w-2/3 w-full mt-6 text-white/90">
                Giant smokers. Authentic technique. From brisket to ribs, pulled pork to smoked chicken.
                Every plate comes with two sides.
              </p>
              <button className="text-white px-[30px] py-[8px] rounded-3xl bg-red-600 cursor-pointer hover:opacity-70 transition-all mt-6">
                See Menu
              </button>
            </div>
          </div>
        </div>
      </Slider>
    </div>
  );
}
