import { Menu, X, LayoutDashboard, ChevronDown, Shield, Anchor, Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { usePartnerModules } from "@/hooks/usePartnerModules";
import sribookingLogo from "@/assets/logo-sribooking.png";
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

  const navLinks = [
    { name: "Home", href: "#" },
    { name: "Our Product", href: "#products" },
    { name: "Pricing", href: "#pricing" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Contact Us", href: "#contact" },
  ];

  const dashboardItems = [
    ...(isAdmin ? [{ to: "/admin", icon: Shield, label: "Dashboard Admin" }] : []),
    { to: "/dashboard", icon: Anchor, label: "Dashboard Boat" },
    { to: "/activity-dashboard", icon: Compass, label: "Dashboard Activity" },
    { to: "/accommodation-dashboard", icon: Home, label: "Dashboard Accommodation" },
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
      <DropdownMenuContent align="end" className="w-56 bg-card border border-border shadow-lg z-50">
        {dashboardItems.map((item) => {
          const isActive = isAdmin && item.to === "/admin" 
            ? true 
            : activeModules.includes(
                item.to === "/dashboard" ? "boat" 
                : item.to === "/activity-dashboard" ? "activity" 
                : "accommodation"
              );
          return (
            <DropdownMenuItem key={item.to} asChild>
              <Link 
                to={item.to} 
                className={`flex items-center cursor-pointer ${!isActive ? "opacity-50" : ""}`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
                {!isActive && (
                  <span className="ml-auto text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                    Inactive
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
          );
        })}
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
              <a key={link.name} href={link.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              !roleLoading && !modulesLoading ? (
                <DashboardDropdown />
              ) : null
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
                  !roleLoading && !modulesLoading ? <DashboardDropdown isMobile /> : null
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
