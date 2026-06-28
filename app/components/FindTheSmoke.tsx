"use client";

import { FaFacebookF, FaPhone, FaMapMarkerAlt, FaDirections, FaGoogle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { business } from '@/lib/business';

export default function FindTheSmoke() {
  return (
    <div id="about" className="bg-black border-y-4 border-brand-primary py-16">
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
            The chase is over — we&apos;ve planted the smoker in DeLand. Pull up, come hungry.
          </p>

          <p className="text-3xl font-bold mb-8 text-brand-primary">
            Dine in or grab it to go.
          </p>

          {/* Address — tappable, opens directions */}
          <a
            href={business.maps.directions}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 text-2xl font-bold mb-3 hover:text-brand-primary transition-all"
          >
            <FaMapMarkerAlt className="text-brand-primary text-2xl" />
            {business.address.street}, {business.address.city}, {business.address.state} {business.address.zip}
          </a>

          <p className="text-xl text-brand-primary font-bold mb-8">{business.hoursDisplay}</p>

          {/* Primary actions */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <a
              href={business.maps.directions}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-3xl bg-brand-primary text-white font-bold hover:opacity-80 transition-all"
            >
              <FaDirections className="text-xl" />
              Get Directions
            </a>
            <a
              href={business.maps.profile}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-3xl border border-white/30 text-white font-bold hover:border-brand-primary hover:text-brand-primary transition-all"
            >
              <FaGoogle className="text-xl" />
              Hours &amp; Reviews
            </a>
          </div>

          {/* Secondary contact */}
          <div className="flex flex-col gap-4 items-center mb-8">
            <div className="flex items-center gap-3 text-xl">
              <FaPhone className="text-brand-primary text-2xl" />
              <span>Call </span>
              <a
                href={business.phoneHref}
                className="text-brand-primary font-bold text-2xl hover:opacity-80 transition-all"
              >
                {business.phone}
              </a>
            </div>

            <div className="flex items-center gap-3 text-xl">
              <FaFacebookF className="text-brand-primary text-2xl" />
              <a
                href={business.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-primary transition-all underline"
              >
                Follow us on Facebook for daily specials
              </a>
            </div>
          </div>

          <p className="text-xl italic text-white/70">
            Veteran-owned. Wood-smoked. Worth the trip.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
