import React from 'react';
import { MapPin, Phone, Mail, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

const Footer: React.FC = () => {
  const { storeInfo } = useStore();
  const currentYear = 2026;

  const bgImage = 'https://kidsparadise.com.bd/wp-content/uploads/2025/09/footer-banner-2.png';
  const logoImage = 'https://kidsparadise.com.bd/wp-content/uploads/2025/08/cropped-kp-logo.png';
  const paymentImage = 'https://kidsparadise.com.bd/wp-content/uploads/2025/01/payment.png';
  const facebookUrl = storeInfo.socials?.facebook || 'https://www.facebook.com/kidsparadisebd';

  return (
    <footer 
      className="relative bg-cover bg-center text-white pt-14 md:pt-16 pb-8 overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Dark Overlay for rich contrast & readability */}
      <div className="absolute inset-0 bg-black/75 md:bg-black/70 backdrop-blur-[0.5px]"></div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        
        {/* Main 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 items-center">

          {/* Column 1: CONTACT US */}
          <div className="md:border-r md:border-white/20 md:pr-8 lg:pr-12 space-y-4">
            <h3 className="font-serif text-lg md:text-xl font-bold tracking-wider text-white mb-5 uppercase">
              CONTACT US
            </h3>

            <div className="space-y-3.5 text-xs md:text-[13.5px] text-gray-200">
              <div className="flex items-start gap-3">
                <MapPin className="text-gray-300 shrink-0 mt-0.5" size={17} />
                <span className="leading-relaxed">
                  {storeInfo.address || 'Jamuna Future Park, Shop#26-31, B#B, Level-1, North Court, Bashundhara, Dhaka.'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="text-gray-300 shrink-0" size={17} />
                <a 
                  href={`tel:${(storeInfo.phone || '+88 01726499168').replace(/\s+/g, '')}`}
                  className="hover:text-[#F0264C] transition-colors font-medium"
                >
                  {storeInfo.phone || '+88 01726499168'}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="text-gray-300 shrink-0" size={17} />
                <a 
                  href={`mailto:${storeInfo.email || 'info@kidsparadise.com.bd'}`}
                  className="hover:text-[#F0264C] transition-colors font-medium"
                >
                  {storeInfo.email || 'info@kidsparadise.com.bd'}
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: LOGO, TAGLINE, SOCIAL */}
          <div className="px-4 md:px-8 lg:px-12 text-center flex flex-col items-center justify-center">
            <Link to="/" className="inline-block mb-3.5 hover:opacity-95 transition-opacity">
              <img 
                src={logoImage} 
                alt="Kids Paradise" 
                className="h-16 md:h-20 w-auto object-contain mx-auto drop-shadow-md" 
              />
            </Link>

            <p className="text-xs md:text-[13px] text-gray-200 font-medium leading-relaxed max-w-md mx-auto mb-4">
              Kids Toy Shop, Baby Apparels, Baby Care, Baby Gear & Travel, Baby Furniture & Mother Needs
            </p>

            {/* Social Button */}
            <div className="flex justify-center">
              <a 
                href={facebookUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Facebook"
                className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white text-gray-900 hover:bg-[#F0264C] hover:text-white transition-all flex items-center justify-center shadow-md cursor-pointer"
              >
                <Facebook size={16} fill="currentColor" />
              </a>
            </div>
          </div>

          {/* Column 3: INFORMATION */}
          <div className="md:border-l md:border-white/20 md:pl-8 lg:pl-12 space-y-4">
            <h3 className="font-serif text-lg md:text-xl font-bold tracking-wider text-white mb-5 uppercase">
              INFORMATION
            </h3>

            <ul className="space-y-2.5 text-xs md:text-[13.5px] text-gray-200">
              <li>
                <Link to="/about-us" className="hover:text-[#F0264C] transition-colors block py-0.5">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact-us" className="hover:text-[#F0264C] transition-colors block py-0.5">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/my-account" className="hover:text-[#F0264C] transition-colors block py-0.5">
                  My account
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-[#F0264C] transition-colors block py-0.5">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Payment Badges */}
        <div className="border-t border-white/20 pt-6 mt-10 md:mt-12 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-xs text-gray-300 font-medium">
            © {currentYear} Kids Paradise. All rights reserved. Developed by:{' '}
            <a 
              href="https://shakilmahmud.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-[#F0264C] font-semibold transition-colors"
            >
              Shakil Mahmud
            </a>
          </p>

          <div>
            <img 
              src={paymentImage} 
              alt="Payment Methods: Visa, MasterCard, Amex, PayPal" 
              className="h-6 md:h-7 w-auto object-contain opacity-95" 
            />
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
