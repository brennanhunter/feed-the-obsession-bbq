"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

const categories = ["BBQ Plates", "Sides", "Catering"];

const menuItems = [
  {
    id: 1,
    title: "Brisket Plate",
    description: "Slow-smoked beef brisket with two sides of your choice",
    price: 20,
    image: "/pictures/food/ribs.png",
    category: "BBQ Plates"
  },
  {
    id: 2,
    title: "Ribs Plate",
    description: "Fall-off-the-bone ribs with two sides",
    price: 20,
    image: "/pictures/food/ribs.png",
    category: "BBQ Plates"
  },
  {
    id: 3,
    title: "Pulled Pork Plate",
    description: "Tender pulled pork with two sides",
    price: 15,
    image: "/pictures/food/pulled-pork-transparent.png",
    category: "BBQ Plates"
  },
  {
    id: 4,
    title: "Smoked German Potatoes",
    description: "Creamy potatoes with a smoky finish",
    price: 5,
    image: "/pictures/food/german-potatoes-transparent.png",
    category: "Sides"
  },
  {
    id: 5,
    title: "Smoked Baked Beans",
    description: "Sweet and savory beans with bacon",
    price: 5,
    image: "/pictures/food/ribs.png",
    category: "Sides"
  },
  {
    id: 6,
    title: "Coleslaw",
    description: "Fresh and tangy cabbage slaw",
    price: 4,
    image: "/pictures/food/ribs.png",
    category: "Sides"
  },
  {
    id: 7,
    title: "Black Eyed Peas",
    description: "Southern-style black eyed peas",
    price: 5,
    image: "/pictures/food/ribs.png",
    category: "Sides"
  },
  {
    id: 8,
    title: "Cabbage and Ham",
    description: "Tender cabbage with smoked ham",
    price: 5,
    image: "/pictures/food/ribs.png",
    category: "Sides"
  },
  {
    id: 9,
    title: "Corn Salad",
    description: "Sweet corn with fresh vegetables",
    price: 4,
    image: "/pictures/food/ribs.png",
    category: "Sides"
  },
  {
    id: 10,
    title: "Cucumber Salad",
    description: "Fresh cucumber salad with herbs",
    price: 4,
    image: "/pictures/food/cucumber-transparent.png",
    category: "Sides"
  },
];

export default function MenuWrapper() {
  const [active, setActive] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOpacity, setVideoOpacity] = useState(1);

  useEffect(() => {
    const handleShowCatering = () => {
      console.log('Catering event received!'); // Debug log
      setActive(2); // Switch to Catering tab
    };
    
    window.addEventListener('showCatering', handleShowCatering);
    
    return () => {
      window.removeEventListener('showCatering', handleShowCatering);
    };
  }, []);

  useEffect(() => {
    // When Catering tab is active, play video with sound
    if (active === 2 && videoRef.current) {
      setVideoOpacity(1); // Reset opacity
      videoRef.current.currentTime = 0; // Reset to start
      videoRef.current.muted = false;
      videoRef.current.play().catch(err => {
        console.log('Video autoplay failed:', err);
        // If autoplay with sound fails, try with mute
        videoRef.current!.muted = true;
        videoRef.current!.play();
      });
    }
  }, [active]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const timeRemaining = video.duration - video.currentTime;
      
      // Start fading out 2 seconds before the end
      if (timeRemaining <= 2 && timeRemaining > 0) {
        setVideoOpacity(timeRemaining / 2);
      }
    }
  };

  const handleVideoEnded = () => {
    setVideoOpacity(0);
    // Scroll to top of menu section
    const menuElement = document.getElementById('menu');
    if (menuElement) {
      menuElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredItems = menuItems.filter(
    (item) => item.category === categories[active]
  );

  return (
    <div id="menu" className="container mx-auto mb-16 py-20">
      <div className="flex flex-col items-center w-full">
        <h2 className="text-[40px] font-display tracking-wider">OUR MENU</h2>
        <p className="mt-4 text-center text-white/60 max-w-xl">
          Our menu varies week to week based on what we're smoking. Follow us for weekly updates.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          {categories.map((category, index) => (
            <button
              key={category}
              data-category={category}
              className={`px-6 py-2 rounded-3xl transition-all ${
                index === active
                  ? "bg-[#222831] text-white"
                  : "bg-transparent border border-white/20 hover:border-red-600"
              }`}
              onClick={() => {
                setActive(index);
                const menuElement = document.getElementById('menu');
                if (menuElement) {
                  menuElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4 min-h-[450px]">
        {active === 2 ? (
          // Catering Section
          <div className="col-span-full">
            <div className="bg-[#222831] rounded-3xl p-12 text-center border-2 border-white/10">
              <h3 className="text-4xl md:text-5xl font-display tracking-wider mb-6">CATERING AVAILABLE</h3>
              
              {/* Video Section */}
              <div className="mb-8 max-w-md mx-auto">
                <video
                  ref={videoRef}
                  className="w-full h-auto rounded-lg"
                  style={{ 
                    opacity: videoOpacity,
                    transition: 'opacity 0.5s ease-out',
                    display: videoOpacity === 0 ? 'none' : 'block'
                  }}
                  controls
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnded}
                >
                  <source src="/pictures/smoker-process/advertisement.mp4" type="video/mp4" />
                </video>
              </div>

              <p className="text-xl mb-8 text-white/80">
                Parties • Weddings • Corporate Events • Special Occasions
              </p>
              <p className="text-lg mb-8 max-w-2xl mx-auto text-white/70">
                Let us bring authentic wood-smoked BBQ to your next event. From intimate gatherings 
                to large celebrations, we've got you covered with our full-service catering.
              </p>
              <div className="mb-8">
                <p className="text-2xl font-bold mb-4">Call for Pricing & Availability</p>
                <a 
                  href="tel:812-205-0559" 
                  className="text-4xl md:text-5xl font-display text-red-600 hover:text-red-500 transition-all tracking-wider"
                >
                  812-205-0559
                </a>
              </div>
              <div className="grid md:grid-cols-3 gap-6 mt-10 text-left">
                <div className="bg-black/30 p-6 rounded-xl">
                  <h4 className="font-bold text-lg mb-2">Party Platters</h4>
                  <p className="text-white/70">Perfect for game days, family gatherings, and celebrations</p>
                </div>
                <div className="bg-black/30 p-6 rounded-xl">
                  <h4 className="font-bold text-lg mb-2">Wedding Catering</h4>
                  <p className="text-white/70">Full-service catering for your special day</p>
                </div>
                <div className="bg-black/30 p-6 rounded-xl">
                  <h4 className="font-bold text-lg mb-2">Corporate Events</h4>
                  <p className="text-white/70">Impress your team and clients with authentic BBQ</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Menu Items
          filteredItems.map((item) => (
            <div key={item.id} className="bg-[#222831] rounded-3xl relative overflow-hidden group">
              <div className="w-full bg-white/10 h-[210px] grid place-content-center rounded-bl-[46px] rounded-tl-2xl rounded-tr-2xl">
                <div className="relative w-36 h-36 hover:scale-110 transition-all">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="p-[25px] text-white">
                <h4 className="text-xl font-semibold mb-3">{item.title}</h4>
                <p className="text-[15px] text-white/70">{item.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xl font-bold">${item.price}</span>
                  <button className="w-10 h-10 rounded-full bg-red-600 grid place-content-center hover:opacity-70 transition-all">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
