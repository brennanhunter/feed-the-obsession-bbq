"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { MenuItem } from "@/lib/catalog";

// Home-page teaser: a few signature plates that drive to the full /menu page.
export default function MenuPreview({ items }: { items: MenuItem[] }) {
  const featured = items.filter((i) => i.section === "Plates").slice(0, 5);
  return (
    <div id="menu" className="container mx-auto max-w-3xl px-4 mb-16 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center w-full text-center"
      >
        <h2 className="text-[40px] font-display tracking-wider">OUR MENU</h2>
        <p className="mt-4 text-white/60 max-w-xl">
          Wood-smoked plates and Southern sides, made fresh. Here&apos;s a taste — see the full menu and
          order online for pickup or dine-in.
        </p>
      </motion.div>

      <div className="mt-10">
        {featured.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="py-3 border-b border-white/10"
          >
            <div className="flex items-baseline gap-3">
              <span className="font-semibold text-lg text-white shrink-0">{item.title}</span>
              <span className="flex-1 border-b border-dotted border-white/25 translate-y-[-4px]" />
              <span className="font-bold text-lg text-brand-primary shrink-0">
                ${item.price.toFixed(2)}
              </span>
            </div>
            {item.description && <p className="mt-1 text-sm text-white/50">{item.description}</p>}
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
