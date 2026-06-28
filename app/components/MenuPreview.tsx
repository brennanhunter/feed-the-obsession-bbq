"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { menuItems } from "@/lib/menu";

// Home-page teaser: a few signature plates that drive to the full /menu page.
const featured = menuItems.filter((i) => i.category === "BBQ Plates");

export default function MenuPreview() {
  return (
    <div id="menu" className="container mx-auto mb-16 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center w-full text-center"
      >
        <h2 className="text-[40px] font-display tracking-wider">OUR MENU</h2>
        <p className="mt-4 text-white/60 max-w-xl">
          Wood-smoked plates and Southern sides, made fresh. Here&apos;s a taste — see the
          full menu and order online for pickup or dine-in.
        </p>
      </motion.div>

      <div className="mt-10 grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4">
        {featured.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="bg-brand-secondary rounded-3xl relative overflow-hidden"
          >
            <Link href="/menu" className="block group">
              <div className="w-full bg-white/10 h-[210px] grid place-content-center rounded-bl-[46px] rounded-tl-2xl rounded-tr-2xl">
                <div className="relative w-36 h-36 group-hover:scale-110 transition-all">
                  <Image src={item.image} alt={item.title} fill className="rounded-full object-cover" />
                </div>
              </div>
              <div className="p-[25px] text-white">
                <h4 className="text-xl font-semibold mb-3">{item.title}</h4>
                <p className="text-[15px] text-white/70">{item.description}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xl font-bold">${item.price}</span>
                  <span className="text-brand-primary font-semibold">Order →</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center mt-10">
        <Link
          href="/menu"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-3xl bg-brand-primary text-white font-bold hover:opacity-80 transition-all"
        >
          See Full Menu &amp; Order
        </Link>
      </div>
    </div>
  );
}
