import { Mail, MapPin, Phone } from "lucide-react";
import sribookingLogo from "@/assets/sribooking-logo.jpg";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-4">
              <img 
                src={sribookingLogo} 
                alt="SriBooking.com" 
                className="h-12 w-auto object-contain brightness-0 invert"
              />
            </a>
            <p className="text-background/60 text-sm leading-relaxed mb-4">
              The complete reservation system for tourism operators in Sri Lanka. Boats, tours, and activities - all in one platform.
            </p>
            <div className="flex items-center gap-2 text-background/60 text-sm">
              <MapPin className="w-4 h-4" />
              <span>Sri Lanka</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-background mb-4">Product</h4>
            <ul className="space-y-3">
              {["Boat Bookings", "Tours & Activities", "Pricing", "API Documentation"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-background/60 hover:text-background transition-colors text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-background mb-4">Company</h4>
            <ul className="space-y-3">
              {["About Us", "Partners", "Blog", "Contact"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-background/60 hover:text-background transition-colors text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-background mb-4">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:hello@sribooking.com" className="text-background/60 hover:text-background transition-colors text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  hello@sribooking.com
                </a>
              </li>
              <li>
                <a href="tel:+94112345678" className="text-background/60 hover:text-background transition-colors text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  +94 11 234 5678
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/40 text-sm">
            © 2025 SriBooking.com. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-background/40 hover:text-background transition-colors text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-background/40 hover:text-background transition-colors text-sm">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
