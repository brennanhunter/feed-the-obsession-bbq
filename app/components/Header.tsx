"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="h-[5.5rem] sticky top-0 z-50 w-full bg-[#222831]">
      <div className="container mx-auto text-white flex justify-between items-center h-full px-6">
        {/* Logo */}
        <Link href="/" className="text-[2rem] font-display font-bold cursor-pointer">
          FTO BBQ
        </Link>

        {/* Desktop Navigation */}
        <nav className="sm:flex hidden">
          <ul className="flex gap-x-2 items-center">
            <li className="px-[5px] py-[10px] uppercase hover:text-red-600 cursor-pointer transition-all">
              <Link href="/">Home</Link>
            </li>
            <li className="px-[5px] py-[10px] uppercase hover:text-red-600 cursor-pointer transition-all">
              <Link href="#menu">Menu</Link>
            </li>
            <li className="px-[5px] py-[10px] uppercase hover:text-red-600 cursor-pointer transition-all">
              <Link href="#about">About</Link>
            </li>
            <li className="px-[5px] py-[10px] uppercase hover:text-red-600 cursor-pointer transition-all">
              <Link href="#catering">Catering</Link>
            </li>
          </ul>
        </nav>

        {/* Right Side Icons */}
        <div className="flex gap-x-4 items-center">
          <Link href="#contact">
            <span className="hover:text-red-600 transition-all cursor-pointer">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
            </span>
          </Link>

          <Link href="#order">
            <span className="relative hover:text-red-600 transition-all cursor-pointer">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              <span className="w-4 h-4 text-xs grid place-content-center rounded-full bg-red-700 absolute -top-2 -right-3 text-white font-bold">
                0
              </span>
            </span>
          </Link>

          <button className="hover:text-red-600 transition-all cursor-pointer">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>

          <a href="#order" className="md:inline-block hidden">
            <button className="text-white px-[30px] py-[8px] rounded-3xl bg-red-600 cursor-pointer hover:opacity-70 transition-all">
              Order Online
            </button>
          </a>

          <button 
            className="sm:hidden inline-block hover:text-red-600 transition-all"
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
            <li className="px-[5px] py-[10px] uppercase hover:text-red-600 cursor-pointer" onClick={() => setIsMenuOpen(false)}>
              <Link href="/">Home</Link>
            </li>
            <li className="px-[5px] py-[10px] uppercase hover:text-red-600 cursor-pointer" onClick={() => setIsMenuOpen(false)}>
              <Link href="#menu">Menu</Link>
            </li>
            <li className="px-[5px] py-[10px] uppercase hover:text-red-600 cursor-pointer" onClick={() => setIsMenuOpen(false)}>
              <Link href="#about">About</Link>
            </li>
            <li className="px-[5px] py-[10px] uppercase hover:text-red-600 cursor-pointer" onClick={() => setIsMenuOpen(false)}>
              <Link href="#catering">Catering</Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
