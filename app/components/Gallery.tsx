"use client";

import Image from "next/image";
import { motion } from "framer-motion";

// Build-out photos: the team renovating the DeLand location by hand before opening.
const photos = [
  { src: "/gallery/painting-open1.jpg", w: 600, h: 450 },
  { src: "/gallery/painting-open6.jpg", w: 600, h: 398 },
  { src: "/gallery/painting-open3.jpg", w: 450, h: 600 },
  { src: "/gallery/painting-open5.jpg", w: 450, h: 600 },
  { src: "/gallery/painting-open2.jpg", w: 600, h: 450 },
  { src: "/gallery/painting-open4.jpg", w: 450, h: 600 },
  { src: "/gallery/painting-open7.jpg", w: 427, h: 600 },
  { src: "/gallery/painting-open8.jpg", w: 413, h: 600 },
];

export default function Gallery() {
  return (
    <div id="gallery" className="bg-black py-20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-brand-primary font-semibold tracking-[0.3em] uppercase mb-2">Grand Opening</p>
          <h2 className="text-[40px] font-display tracking-wider">BUILDING THE OBSESSION</h2>
          <p className="mt-4 text-white/60 max-w-xl mx-auto">
            Veteran-owned and family-built — we renovated our DeLand spot by hand. Come see it.
          </p>
        </motion.div>

        <div className="columns-2 md:columns-3 gap-4 [&>*]:mb-4">
          {photos.map((p, i) => (
            <div key={p.src} className="break-inside-avoid overflow-hidden rounded-xl">
              <Image
                src={p.src}
                alt={`Feed The Obsession BBQ — building out our DeLand location (${i + 1})`}
                width={p.w}
                height={p.h}
                sizes="(max-width: 768px) 50vw, 33vw"
                className="w-full h-auto hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
