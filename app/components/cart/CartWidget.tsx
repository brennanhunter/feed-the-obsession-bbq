"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useAnimationControls } from "framer-motion";
import { useCart } from "./CartContext";

// Floating "View Order" pill. Checkout itself lives on /order (a full page with
// the pickup details, order review and payment), not in a drawer.
export default function CartWidget() {
  const { count } = useCart();
  const pathname = usePathname();

  // Pop whenever the item count goes up, so adding is obvious.
  const controls = useAnimationControls();
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) {
      controls.start({ scale: [1, 1.35, 0.92, 1], rotate: [0, -6, 4, 0] }, { duration: 0.5, ease: "easeOut" });
    }
    prevCount.current = count;
  }, [count, controls]);

  if (count === 0 || pathname === "/order") return null;

  return (
    <motion.div
      animate={controls}
      whileHover={{ scale: 1.05 }}
      className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-6 z-[70]"
    >
      <Link
        href="/order"
        className="flex items-center gap-2 px-5 py-3 rounded-full bg-brand-primary text-white font-bold shadow-lg"
      >
        🛒 View Order
        <motion.span
          key={count}
          initial={{ scale: 0.4 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 600, damping: 15 }}
          className="ml-1 bg-white text-brand-primary rounded-full px-2 text-sm font-bold"
        >
          {count}
        </motion.span>
      </Link>
    </motion.div>
  );
}
