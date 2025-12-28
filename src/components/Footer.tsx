import { Ship, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-ocean flex items-center justify-center">
                <Ship className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">
                Sri<span className="text-primary-glow">booking</span>
              </span>
            </a>
            <p className="text-background/60 text-sm leading-relaxed mb-4">
              The modern B2B booking engine for fastboat operators in Indonesia and beyond.
            </p>
            <div className="flex items-center gap-2 text-background/60 text-sm">
              <MapPin className="w-4 h-4" />
              <span>Bali, Indonesia</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-background mb-4">Product</h4>
            <ul className="space-y-3">
              {["Features", "Pricing", "Integrations", "Changelog"].map((item) => (
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
              {["About Us", "Partners", "Blog", "Careers"].map((item) => (
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
                <a href="tel:+62812345678" className="text-background/60 hover:text-background transition-colors text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  +62 812 345 678
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/40 text-sm">
            © 2024 Sribooking. All rights reserved.
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
