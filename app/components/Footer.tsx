import { FaFacebookF, FaInstagram, FaPhone, FaEnvelope } from 'react-icons/fa';

export default function Footer() {
  return (
    <div className="bg-[#222831] text-white">
      <div className="container mx-auto pt-16 pb-6">
        <div className="flex md:justify-between justify-center text-center flex-wrap md:gap-y-0 gap-y-6">
          {/* Contact Us */}
          <div className="md:flex-1">
            <h3 className="text-[30px] font-display tracking-wider">CONTACT US</h3>
            <div className="flex flex-col gap-y-2 mt-3 text-white/80">
              <div className="flex items-center justify-center gap-2">
                <FaPhone className="text-red-600" />
                <a
                  className="hover:text-red-600 transition-all"
                  href="tel:812-205-0559"
                >
                  812-205-0559
                </a>
              </div>
              <a href="mailto:contact@ftobbq.com" className="hover:text-red-600 transition-all flex items-center justify-center gap-2">
                <FaEnvelope className="text-red-600" />
                <span>contact@ftobbq.com</span>
              </a>
            </div>
          </div>

          {/* About */}
          <div className="md:flex-1">
            <h3 className="text-[38px] font-display tracking-wider">FEED THE OBSESSION</h3>
            <p className="mt-3 text-white/70 max-w-md mx-auto">
              Veteran-owned BBQ supporting the biking community. Authentic wood-smoked meats, 
              custom smoker builds, and a passion for great food.
            </p>
            <div className="flex items-center justify-center mt-5 gap-x-3">
              <a
                href="https://www.facebook.com/profile.php?id=61573454007742"
                className="w-10 h-10 grid place-content-center bg-white text-[#222831] rounded-full hover:text-white hover:bg-red-600 transition-all transform hover:scale-110"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <FaFacebookF size={20} />
              </a>
              <a
                href="https://www.instagram.com/feed_the_obsession_outdoors/"
                className="w-10 h-10 grid place-content-center bg-white text-[#222831] rounded-full hover:text-white hover:bg-red-600 transition-all transform hover:scale-110"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <FaInstagram size={20} />
              </a>
            </div>
          </div>

          {/* Follow Us */}
          <div className="md:flex-1">
            <h3 className="text-[30px] font-display tracking-wider">FOLLOW US</h3>
            <div className="flex flex-col gap-y-2 mt-3 text-white/80">
              <p className="text-lg">
                Check Facebook daily for our current location and hours
              </p>
              <a 
                href="https://www.facebook.com/profile.php?id=61573454007742"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:text-red-500 transition-all text-xl font-bold mt-2"
              >
                Find Us on Facebook →
              </a>
            </div>
          </div>
        </div>
        <p className="text-center mt-10 text-white/50">
          © 2025 Feed The Obsession BBQ. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
