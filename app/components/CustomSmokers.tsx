"use client";

import Image from "next/image";
import Slider from "react-slick";
import { useRef } from "react";

export default function CustomSmokers() {
  const sliderRef = useRef<any>(null);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: false,
    appendDots: (dots: any) => (
      <div>
        <ul className="flex justify-center gap-2 mt-6">{dots}</ul>
      </div>
    ),
    customPaging: () => (
      <div className="w-3 h-3 bg-white/30 rounded-full hover:bg-red-600 transition-all cursor-pointer"></div>
    ),
  };

  return (
    <div className="bg-[#222831] py-20">
      <div className="container mx-auto px-6">
        <div className="flex md:flex-row flex-col items-center gap-12">
          {/* Text Content */}
          <div className="md:w-1/2">
            <h2 className="text-[40px] font-display tracking-wider mb-6">CUSTOM SMOKERS</h2>
            <p className="text-lg mb-4 text-white/80">
              Want your own custom-built smoker? We design and fabricate professional-grade 
              smokers tailored to your needs.
            </p>
            <p className="text-base mb-6 text-white/70">
              From consultation to final delivery, we guide you through every step of the process. 
              Each smoker is hand-crafted with precision, built to last, and designed to deliver 
              authentic wood-smoked flavor.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-600 flex-shrink-0 grid place-content-center mt-0.5">
                  <span className="text-white text-sm">✓</span>
                </div>
                <p className="text-white/80">Custom design based on your specifications</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-600 flex-shrink-0 grid place-content-center mt-0.5">
                  <span className="text-white text-sm">✓</span>
                </div>
                <p className="text-white/80">Professional fabrication and welding</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-600 flex-shrink-0 grid place-content-center mt-0.5">
                  <span className="text-white text-sm">✓</span>
                </div>
                <p className="text-white/80">Built for commercial or personal use</p>
              </div>
            </div>
            <button className="text-white px-[30px] py-[8px] rounded-3xl bg-red-600 cursor-pointer hover:opacity-70 transition-all">
              Inquire About Custom Smokers
            </button>
          </div>

          {/* Media Carousel */}
          <div className="md:w-1/2 w-full">
            <div className="relative">
              <Slider ref={sliderRef} {...settings}>
                {/* Measuring */}
                <div className="px-2">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                    <Image
                      src="/pictures/smoker-process/MeasuringSmoker1.jpg"
                      alt="Measuring smoker dimensions"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Sawing */}
                <div className="px-2">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                    <Image
                      src="/pictures/smoker-process/SawingSmoker.jpg"
                      alt="Cutting smoker components"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Inside Sawed */}
                <div className="px-2">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                    <Image
                      src="/pictures/smoker-process/InsideSawed.jpg"
                      alt="Interior fabrication work"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Video 1 */}
                <div className="px-2">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video 
                      controls 
                      className="w-full h-full object-cover"
                      poster="/pictures/smoker-process/finished1.jpg"
                    >
                      <source src="/pictures/smoker-process/video1.mp4" type="video/mp4" />
                    </video>
                  </div>
                </div>

                {/* Video 2 */}
                <div className="px-2">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video 
                      controls 
                      className="w-full h-full object-cover"
                      poster="/pictures/smoker-process/finished2.jpg"
                    >
                      <source src="/pictures/smoker-process/video2.mp4" type="video/mp4" />
                    </video>
                  </div>
                </div>

                {/* Finished 1 */}
                <div className="px-2">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                    <Image
                      src="/pictures/smoker-process/finished1.jpg"
                      alt="Completed custom smoker"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Finished 2 */}
                <div className="px-2">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                    <Image
                      src="/pictures/smoker-process/finished2.jpg"
                      alt="Finished smoker build"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </Slider>

              {/* Navigation Arrows */}
              <button
                onClick={() => sliderRef.current?.slickPrev()}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-red-600 transition-all grid place-content-center"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => sliderRef.current?.slickNext()}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-red-600 transition-all grid place-content-center"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
