import { Menu, X, LayoutDashboard, ChevronDown, Shield, Anchor, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { usePartnerModules } from "@/hooks/usePartnerModules";
import sribookingLogo from "@/assets/sribooking-logo.jpg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { activeModules, loading: modulesLoading } = usePartnerModules();

  const isAdmin = role === 'admin';
  const hasBoatModule = activeModules.includes('boat');
  const hasActivityModule = activeModules.includes('activity');
  const hasDashboardAccess = isAdmin || hasBoatModule || hasActivityModule;

  const navLinks = [
    { name: "Home", href: "#" },
    { name: "Our Product", href: "#products", badge: "Must See" },
    { name: "Pricing", href: "#pricing" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Contact Us", href: "#contact" },
  ];

  const DashboardDropdown = ({ isMobile = false }: { isMobile?: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className={`rounded-full ${isMobile ? "w-full justify-between" : ""}`}>
          <span className="flex items-center">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-card border border-border shadow-lg z-50">
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin" className="flex items-center cursor-pointer">
              <Shield className="w-4 h-4 mr-2" />
              Dashboard Admin
            </Link>
          </DropdownMenuItem>
        )}
        {hasBoatModule && (
          <DropdownMenuItem asChild>
            <Link to="/dashboard" className="flex items-center cursor-pointer">
              <Anchor className="w-4 h-4 mr-2" />
              Dashboard Boat
            </Link>
          </DropdownMenuItem>
        )}
        {hasActivityModule && (
          <DropdownMenuItem asChild>
            <Link to="/activity-dashboard" className="flex items-center cursor-pointer">
              <Compass className="w-4 h-4 mr-2" />
              Dashboard Activity
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3">
            <img src={sribookingLogo} alt="SriBooking" className="h-12 w-auto rounded-lg" />
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-foreground">SriBooking</span>
              <span className="block text-xs text-muted-foreground">Reservation System</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {link.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full">
                    {link.badge}
                  </span>
                )}
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              hasDashboardAccess && !roleLoading && !modulesLoading ? (
                <DashboardDropdown />
              ) : (
                <Button className="rounded-full px-6" asChild>
                  <Link to="/select-module"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</Link>
                </Button>
              )
            ) : (
              <>
                <Button variant="outline" className="rounded-full px-6" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button className="rounded-full px-6" asChild>
                  <Link to="/auth">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          <button className="lg:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} className="text-muted-foreground hover:text-foreground transition-colors py-2" onClick={() => setMobileMenuOpen(false)}>
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {user ? (
                  hasDashboardAccess && !roleLoading && !modulesLoading ? <DashboardDropdown isMobile /> : (
                    <Button asChild><Link to="/select-module">Dashboard</Link></Button>
                  )
                ) : (
                  <>
                    <Button variant="outline" asChild><Link to="/auth">Sign In</Link></Button>
                    <Button asChild><Link to="/auth">Sign Up</Link></Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
