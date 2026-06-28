"use client";

import Link from "next/link";
import Logo from "./Logo";
import { useState } from "react";

export default function Header({ overlayLogo = false }: { overlayLogo?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="h-[5.5rem] sticky top-0 z-50 w-full bg-brand-secondary">
      <div className="container mx-auto text-white flex justify-between items-center h-full px-6">
        {/* Home shows the big adaptive logo via <LogoOverlay/> (it overflows the header),
            so there we just reserve its slot. Every other page gets a normal header logo. */}
        {overlayLogo ? (
          <div aria-hidden className="w-[8.6rem]" />
        ) : (
          <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
            <Logo className="h-14 aspect-[2718/2896] text-white" />
          </Link>
        )}

        {/* Desktop Navigation */}
        <nav className="sm:flex hidden">
          <ul className="flex gap-x-2 items-center">
            <li className="px-[5px] py-[10px] uppercase hover:text-brand-primary cursor-pointer transition-all">
              <Link href="/">Home</Link>
            </li>
            <li className="px-[5px] py-[10px] uppercase hover:text-brand-primary cursor-pointer transition-all">
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
              }}>Menu</a>
            </li>
            <li className="px-[5px] py-[10px] uppercase hover:text-brand-primary cursor-pointer transition-all">
              <a href="#about" onClick={(e) => {
                e.preventDefault();
                const aboutElement = document.getElementById('about');
                if (aboutElement) {
                  aboutElement.scrollIntoView({ behavior: 'smooth' });
                }
              }}>About</a>
            </li>
            <li className="px-[5px] py-[10px] uppercase hover:text-brand-primary cursor-pointer transition-all">
              <a href="#menu" onClick={(e) => {
                e.preventDefault();
                const menuElement = document.getElementById('menu');
                if (menuElement) {
                  menuElement.scrollIntoView({ behavior: 'smooth' });
                }
                setTimeout(() => {
                  const cateringButton = document.querySelector('[data-category="Catering"]') as HTMLButtonElement;
                  if (cateringButton) {
                    cateringButton.click();
                  }
                }, 500);
              }}>Catering</a>
            </li>
          </ul>
        </nav>

        {/* Right Side */}
        <div className="flex gap-x-4 items-center">
          {/* BIKE WEEK - uncomment for next bike week
          <button
            onClick={() => window.dispatchEvent(new Event('open-bike-week-modal'))}
            className="hidden sm:inline-block px-7 py-3 border-2 border-yellow-400 bg-gradient-to-r from-red-700 via-orange-500 to-yellow-400 text-white font-hellsrider text-base uppercase tracking-widest cursor-pointer hover:from-red-800 hover:via-orange-600 hover:to-yellow-500 transition-all duration-200 shadow-[0_0_15px_rgba(250,204,21,0.5)] hover:shadow-[0_0_25px_rgba(250,204,21,0.8)]"
          >
            Bike Week Menus
          </button>
          */}

          <button 
            className="sm:hidden inline-block hover:text-brand-primary transition-all"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <nav className="sm:hidden absolute top-0 left-0 w-full h-screen bg-white text-black z-50 grid place-content-center">
          <button 
            className="absolute top-4 right-4 z-50 text-2xl"
            onClick={() => setIsMenuOpen(false)}
          >
            ✕
          </button>
          <ul className="flex flex-col items-center gap-4">
            <li className="px-[5px] py-[10px] uppercase hover:text-brand-primary cursor-pointer" onClick={() => setIsMenuOpen(false)}>
              <Link href="/">Home</Link>
            </li>
            <li className="px-[5px] py-[10px] uppercase hover:text-brand-primary cursor-pointer" onClick={() => {
              setIsMenuOpen(false);
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
              <a href="#menu">Menu</a>
            </li>
            <li className="px-[5px] py-[10px] uppercase hover:text-brand-primary cursor-pointer" onClick={() => {
              setIsMenuOpen(false);
              const aboutElement = document.getElementById('about');
              if (aboutElement) {
                aboutElement.scrollIntoView({ behavior: 'smooth' });
              }
            }}>
              <a href="#about">About</a>
            </li>
            <li className="px-[5px] py-[10px] uppercase hover:text-brand-primary cursor-pointer" onClick={() => {
              setIsMenuOpen(false);
              const menuElement = document.getElementById('menu');
              if (menuElement) {
                menuElement.scrollIntoView({ behavior: 'smooth' });
              }
              setTimeout(() => {
                const cateringButton = document.querySelector('[data-category="Catering"]') as HTMLButtonElement;
                if (cateringButton) {
                  cateringButton.click();
                }
              }, 500);
            }}>
              <a href="#menu">Catering</a>
            </li>
            {/* BIKE WEEK - uncomment for next bike week
            <li className="mt-4" onClick={() => {
              setIsMenuOpen(false);
              window.dispatchEvent(new Event('open-bike-week-modal'));
            }}>
              <button className="px-7 py-3 border-2 border-yellow-400 bg-gradient-to-r from-red-700 via-orange-500 to-yellow-400 text-white font-hellsrider text-base uppercase tracking-widest cursor-pointer hover:from-red-800 hover:via-orange-600 hover:to-yellow-500 transition-all duration-200 shadow-[0_0_15px_rgba(250,204,21,0.5)] hover:shadow-[0_0_25px_rgba(250,204,21,0.8)]">
                Bike Week Menus
              </button>
            </li>
            */}
          </ul>
        </nav>
      )}
    </header>
  );
}
