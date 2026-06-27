import Link from "next/link";
import Image from "next/image";
import { FaFacebookF, FaPhone } from 'react-icons/fa';

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-brand-secondary flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-3xl">
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="FTO Barbeque Logo"
            width={100}
            height={100}
            className="w-24 h-24 object-contain mx-auto"
          />
        </div>
        <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6">
          Online Ordering Coming Soon
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 mb-12">
          We're working on bringing online ordering to you. For now, find us in person!
        </p>
        
        <div className="bg-black/40 border-2 border-brand-primary/50 rounded-lg p-8 mb-8">
          <h2 className="text-3xl font-display tracking-wider mb-6 text-white">
            🔥 FIND THE SMOKE 🔥
          </h2>
          
          <p className="text-lg mb-6 text-white/90">
            We move with the community - bike rallies, events, and wherever the road takes us.
          </p>
          
          <div className="flex flex-col gap-4 items-center mb-6">
            <div className="flex items-center gap-3 text-lg">
              <FaFacebookF className="text-brand-primary text-xl" />
              <a 
                href="https://www.facebook.com/profile.php?id=61573454007742" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-brand-primary transition-all underline text-white"
              >
                Follow us on Facebook for daily drops
              </a>
            </div>
            
            <div className="flex items-center gap-3 text-lg text-white flex-wrap justify-center">
              <FaPhone className="text-brand-primary text-xl" />
              <span>Call </span>
              <a 
                href="tel:812-205-0559" 
                className="text-brand-primary font-bold text-xl hover:text-brand-primary transition-all"
              >
                812-205-0559
              </a>
              <span> - we'll tell you where to find us</span>
            </div>
          </div>

          <p className="text-lg italic text-white/70">
            Part of the adventure is the chase.
          </p>
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/#menu">
            <button className="text-white px-8 py-3 rounded-3xl bg-brand-primary cursor-pointer hover:opacity-70 transition-all">
              View Our Menu
            </button>
          </Link>
          <Link href="/">
            <button className="text-white px-8 py-3 rounded-3xl bg-gray-700 cursor-pointer hover:opacity-70 transition-all">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
