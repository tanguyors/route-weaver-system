import { Ship, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-ocean flex items-center justify-center shadow-sm group-hover:shadow-glow transition-shadow duration-300">
              <Ship className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Sri<span className="text-gradient-ocean">booking</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Features
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              How It Works
            </a>
            <a href="#partners" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Partners
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Pricing
            </a>
          </div>

{/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Login</Link>
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/auth">Become a Partner</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-up">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2">
                Features
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2">
                How It Works
              </a>
              <a href="#partners" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2">
                Partners
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium py-2">
                Pricing
              </a>
<div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/auth">Login</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/auth">Become a Partner</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
