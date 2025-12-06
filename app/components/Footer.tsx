export default function Footer() {
  return (
    <div className="bg-[#222831] text-white">
      <div className="container mx-auto pt-16 pb-6">
        <div className="flex md:justify-between justify-center text-center flex-wrap md:gap-y-0 gap-y-6">
          {/* Contact Us */}
          <div className="md:flex-1">
            <h3 className="text-[30px] font-display tracking-wider">CONTACT US</h3>
            <div className="flex flex-col gap-y-2 mt-3 text-white/80">
              <a 
                href="https://maps.google.com/?q=1750+N+Woodland+Blvd,+DeLand,+FL+32720" 
                target="_blank" 
                rel="noreferrer"
                className="hover:text-red-600 transition-all"
              >
                <i className="fa fa-map-marker"></i>
                <span className="inline-block ml-2">1750 N Woodland Blvd, DeLand, FL 32720</span>
              </a>
              <div>
                <i className="fa fa-phone"></i>
                <a
                  className="inline-block ml-2 hover:text-red-600 transition-all"
                  href="tel:555-BBQ-FOOD"
                >
                  (555) BBQ-FOOD
                </a>
              </div>
              <a href="mailto:contact@ftobbq.com" className="hover:text-red-600 transition-all">
                <i className="fa fa-envelope"></i>
                <span className="inline-block ml-2">contact@ftobbq.com</span>
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
            <div className="flex items-center justify-center mt-5 gap-x-2">
              <a
                href="https://facebook.com"
                className="w-8 h-8 grid place-content-center bg-white text-[#222831] rounded-full hover:text-white hover:bg-red-600 transition-all transform hover:scale-110"
                target="_blank"
                rel="noreferrer"
              >
                <i className="fa fa-facebook"></i>
              </a>
              <a
                href="https://instagram.com"
                className="w-8 h-8 grid place-content-center bg-white text-[#222831] rounded-full hover:text-white hover:bg-red-600 transition-all transform hover:scale-110"
                target="_blank"
                rel="noreferrer"
              >
                <i className="fa fa-instagram"></i>
              </a>
              <a
                href="https://twitter.com"
                className="w-8 h-8 grid place-content-center bg-white text-[#222831] rounded-full hover:text-white hover:bg-red-600 transition-all transform hover:scale-110"
                target="_blank"
                rel="noreferrer"
              >
                <i className="fa fa-twitter"></i>
              </a>
            </div>
          </div>

          {/* Opening Hours */}
          <div className="md:flex-1">
            <h3 className="text-[30px] font-display tracking-wider">OPENING HOURS</h3>
            <div className="flex flex-col gap-y-2 mt-3 text-white/80">
              <div>
                <span className="inline-block ml-2">Monday - Thursday</span>
              </div>
              <div>
                <span className="inline-block ml-2">11:00 AM - 8:00 PM</span>
              </div>
              <div className="mt-2">
                <span className="inline-block ml-2">Friday - Saturday</span>
              </div>
              <div>
                <span className="inline-block ml-2">11:00 AM - 10:00 PM</span>
              </div>
              <div className="mt-2">
                <span className="inline-block ml-2">Sunday</span>
              </div>
              <div>
                <span className="inline-block ml-2">12:00 PM - 7:00 PM</span>
              </div>
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
