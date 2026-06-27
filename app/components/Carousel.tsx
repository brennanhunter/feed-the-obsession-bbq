"use client";

import Image from "next/image";
import Slider from "react-slick";
import { motion } from "framer-motion";
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
          {/* Oversized background logo */}
          <div className="absolute inset-0 flex items-center justify-end opacity-10 pointer-events-none z-5">
            <Image
              src="/logo.png"
              alt="FTO Logo Background"
              width={800}
              height={800}
              className="w-[800px] h-[800px] object-contain"
            />
          </div>
          <div className="relative z-10 mt-48 flex flex-col items-start gap-y-10 px-6">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="cursor-pointer group"
            >
              <h1 className="text-6xl font-display tracking-wider text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] relative overflow-hidden">
                <span className="relative z-10 group-hover:text-brand-primary transition-colors duration-300">
                  FEED THE OBSESSION
                </span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"></span>
              </h1>
              <p className="text-sm sm:w-2/3 w-full mt-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                Veteran owned BBQ serving authentic wood-smoked meats. Giant smokers, 
                high quality ingredients, and a passion for great BBQ.
              </p>
              <a href="/coming-soon">
                <button className="text-white px-[30px] py-[8px] rounded-3xl bg-brand-primary cursor-pointer hover:bg-brand-primary hover:scale-105 transition-all mt-6">
                  Order Now
                </button>
              </a>
            </motion.div>
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
          {/* Oversized background logo */}
          <div className="absolute inset-0 flex items-center justify-end opacity-10 pointer-events-none z-5">
            <Image
              src="/logo.png"
              alt="FTO Logo Background"
              width={800}
              height={800}
              className="w-[800px] h-[800px] object-contain"
            />
          </div>
          <div className="relative z-10 mt-48 flex flex-col items-start gap-y-10 px-6">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="cursor-pointer group"
            >
              <h1 className="text-6xl font-display tracking-wider text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] relative overflow-hidden">
                <span className="relative z-10 group-hover:text-brand-primary transition-colors duration-300">
                  WOOD SMOKED BBQ
                </span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"></span>
              </h1>
              <p className="text-sm sm:w-2/3 w-full mt-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                Giant smokers. Authentic technique. From brisket to ribs, pulled pork to smoked chicken.
                Every plate comes with two sides.
              </p>
              <a href="#menu" onClick={(e) => {
                e.preventDefault();
                const menuElement = document.getElementById('menu');
                if (menuElement) {
                  menuElement.scrollIntoView({ behavior: 'smooth' });
                }
                setTimeout(() => {
                  const bbqButton = document.querySelector('[data-category="BBQ Plates"]') as HTMLButtonElement;
                  if (bbqButton) {
                    bbqButton.click();
                  }
                }, 500);
              }}>
                <button className="text-white px-[30px] py-[8px] rounded-3xl bg-brand-primary cursor-pointer hover:bg-brand-primary hover:scale-105 transition-all mt-6">
                  See Menu
                </button>
              </a>
            </motion.div>
          </div>
        </div>
        <div className="h-screen relative">
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black">
            <video
              className="h-full w-auto max-w-full object-contain"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src="/pictures/smoker-process/prepwork.mp4" type="video/mp4" />
            </video>
          </div>
          {/* Oversized background logo */}
          <div className="absolute inset-0 flex items-center justify-end opacity-10 pointer-events-none z-5">
            <Image
              src="/logo.png"
              alt="FTO Logo Background"
              width={800}
              height={800}
              className="w-[800px] h-[800px] object-contain"
            />
          </div>
          <div className="relative z-10 mt-48 flex flex-col items-start gap-y-10 px-6">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="cursor-pointer group"
            >
              <h1 className="text-6xl font-display tracking-wider text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] relative overflow-hidden">
                <span className="relative z-10 group-hover:text-brand-primary transition-colors duration-300">
                  AUTHENTIC PREP WORK
                </span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"></span>
              </h1>
              <p className="text-sm sm:w-2/3 w-full mt-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                Watch our process. Every brisket is carefully trimmed and prepped 
                before hitting the smoker for that perfect bark and tenderness.
              </p>
              <a href="#menu" onClick={(e) => {
                e.preventDefault();
                const menuElement = document.getElementById('menu');
                if (menuElement) {
                  menuElement.scrollIntoView({ behavior: 'smooth' });
                }
                setTimeout(() => {
                  const bbqButton = document.querySelector('[data-category="BBQ Plates"]') as HTMLButtonElement;
                  if (bbqButton) {
                    bbqButton.click();
                  }
                }, 500);
              }}>
                <button className="text-white px-[30px] py-[8px] rounded-3xl bg-brand-primary cursor-pointer hover:bg-brand-primary hover:scale-105 transition-all mt-6">
                  See Our Menu
                </button>
              </a>
            </motion.div>
          </div>
        </div>
      </Slider>
    </div>
  );
}
