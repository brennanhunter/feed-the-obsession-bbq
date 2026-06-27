import Logo from './Logo';
import { FaFacebookF, FaInstagram, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { business } from '@/lib/business';

export default function Footer() {
  return (
    <div className="bg-brand-secondary text-white">
      <div className="container mx-auto pt-16 pb-6">
        {/* Logo Section */}
        <div className="flex justify-center mb-12">
          <Logo className="h-28 aspect-[2718/2896] text-white" />
        </div>
        <div className="flex md:justify-between justify-center text-center flex-wrap md:gap-y-0 gap-y-6">
          {/* Contact Us */}
          <div className="md:flex-1">
            <h3 className="text-[30px] font-display tracking-wider">CONTACT US</h3>
            <div className="flex flex-col gap-y-2 mt-3 text-white/80">
              <div className="flex items-center justify-center gap-2">
                <FaPhone className="text-brand-primary" />
                <a
                  className="hover:text-brand-primary transition-all"
                  href={business.phoneHref}
                >
                  {business.phone}
                </a>
              </div>
              <a href={business.emailHref} className="hover:text-brand-primary transition-all flex items-center justify-center gap-2">
                <FaEnvelope className="text-brand-primary" />
                <span>{business.email}</span>
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
                href={business.social.facebook}
                className="w-10 h-10 grid place-content-center bg-white text-brand-secondary rounded-full hover:text-white hover:bg-brand-primary transition-all transform hover:scale-110"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <FaFacebookF size={20} />
              </a>
              <a
                href={business.social.instagram}
                className="w-10 h-10 grid place-content-center bg-white text-brand-secondary rounded-full hover:text-white hover:bg-brand-primary transition-all transform hover:scale-110"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <FaInstagram size={20} />
              </a>
            </div>
          </div>

          {/* Visit Us */}
          <div className="md:flex-1">
            <h3 className="text-[30px] font-display tracking-wider">VISIT US</h3>
            <div className="flex flex-col gap-y-2 mt-3 text-white/80">
              <a
                href={business.maps.directions}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-primary transition-all flex items-center justify-center gap-2"
              >
                <FaMapMarkerAlt className="text-brand-primary" />
                <span>{business.address.street}, {business.address.city}, {business.address.state} {business.address.zip}</span>
              </a>
              <a
                href={business.maps.directions}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary hover:opacity-80 transition-all text-xl font-bold mt-2"
              >
                Get Directions →
              </a>
              <a
                href={business.maps.profile}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-primary transition-all"
              >
                Hours &amp; reviews on Google →
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
