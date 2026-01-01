import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Linkedin } from "lucide-react";
import logo from "@/assets/sribooking-logo.jpg";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img src={logo} alt="SriBooking" className="h-10 w-auto rounded-lg" />
              <div>
                <span className="text-lg font-bold text-foreground">SriBooking</span>
                <span className="block text-xs text-muted-foreground">Reservation System</span>
              </div>
            </Link>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Products</h4>
            <ul className="space-y-3">
              {["Booking Engine System", "Channel Manager System", "Property Management System"].map((item) => (
                <li key={item}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Companies</h4>
            <ul className="space-y-3">
              {["About Us", "Partner With Us"].map((item) => (
                <li key={item}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-3">
              {["Updates", "Sitemap"].map((item) => (
                <li key={item}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>contact@sribooking.com</li>
              <li>+62 821-4478-6837</li>
              <li>SriBooking Bali</li>
            </ul>
            <div className="flex gap-3 mt-6">
              {[Facebook, Instagram, Youtube, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">© 2025 SriBooking Engine, Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
