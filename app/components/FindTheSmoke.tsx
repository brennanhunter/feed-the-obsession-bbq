"use client";

import { FaFacebookF, FaPhone } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function FindTheSmoke() {
  return (
    <div id="about" className="bg-black border-y-4 border-red-600 py-16">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-[50px] font-display tracking-wider mb-6">
            🔥 FIND THE SMOKE 🔥
          </h2>
          
          <p className="text-2xl mb-4 text-white">
            We move with the community - bike rallies, events, and wherever the road takes us.
          </p>
          
          <p className="text-3xl font-bold mb-8 text-red-600">
            We roam. You hunt. The BBQ is worth it.
          </p>

          <div className="flex flex-col gap-4 items-center mb-8">
            <div className="flex items-center gap-3 text-xl">
              <FaFacebookF className="text-red-600 text-2xl" />
              <a 
                href="https://www.facebook.com/profile.php?id=61573454007742" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-red-600 transition-all underline"
              >
                Follow us on Facebook for daily drops
              </a>
            </div>
            
            <div className="flex items-center gap-3 text-xl">
              <FaPhone className="text-red-600 text-2xl" />
              <span>Call </span>
              <a 
                href="tel:812-205-0559" 
                className="text-red-600 font-bold text-2xl hover:text-red-500 transition-all"
              >
                812-205-0559
              </a>
              <span> - we'll tell you where to find us</span>
            </div>
          </div>

          <p className="text-xl italic text-white/70">
            Part of the adventure is the chase.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
