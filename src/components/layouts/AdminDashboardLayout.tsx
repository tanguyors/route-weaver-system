import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { usePartnerModules } from '@/hooks/usePartnerModules';
import { Button } from '@/components/ui/button';
import {
  Ship,
  LayoutDashboard,
  BookOpen,
  CreditCard,
  Users,
  LogOut,
  Menu,
  X,
  Building2,
  Wallet,
  Settings,
  Wrench,
  Home,
  ShieldCheck,
  Compass,
  Anchor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardSwitcher from '@/components/layouts/DashboardSwitcher';

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

const adminNavGroups: NavGroup[] = [
  {
    label: 'Global',
    icon: ShieldCheck,
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Partners', href: '/admin/partners', icon: Building2 },
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Withdrawals', href: '/admin/withdrawals', icon: CreditCard },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
  {
    label: 'Boat',
    icon: Ship,
    items: [
      { label: 'Bookings', href: '/admin/bookings', icon: BookOpen },
      { label: 'Commissions', href: '/admin/commissions', icon: Wallet },
      { label: 'Ports', href: '/admin/ports', icon: Anchor },
      { label: 'Facilities', href: '/admin/facilities', icon: Wrench },
    ],
  },
  {
    label: 'Activity',
    icon: Compass,
    items: [
      { label: 'Commissions', href: '/admin/activity-commissions', icon: Wallet },
      { label: 'Invoices', href: '/admin/activity-invoices', icon: BookOpen },
      { label: 'Payouts', href: '/admin/activity-payouts', icon: CreditCard },
    ],
  },
  {
    label: 'Accommodation',
    icon: Home,
    items: [
      { label: 'Bookings', href: '/admin/accommodation-bookings', icon: BookOpen },
      { label: 'Commissions', href: '/admin/accommodation-commissions', icon: Wallet },
    ],
  },
];

const AdminDashboardLayout = ({ children }: AdminDashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const { activeModules } = usePartnerModules();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (href: string) => location.pathname === href;

  // Determine which partner dashboards are available for switching
  const canSwitchToBoat = activeModules.includes('boat');
  const canSwitchToActivity = activeModules.includes('activity');
  const canSwitchToAccommodation = activeModules.includes('accommodation');
  const hasAnyPartnerModule = canSwitchToBoat || canSwitchToActivity || canSwitchToAccommodation;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Admin</span>
          </Link>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-full w-64 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-border">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Admin <span className="text-amber-600">Panel</span>
              </span>
            </Link>
          </div>

          {/* Dashboard Switcher */}
          <DashboardSwitcher />

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {adminNavGroups.map((group) => (
              <div key={group.label} className="mb-4">
                <div className="flex items-center gap-2 px-3 mb-2">
                  <group.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.label}
                  </span>
                </div>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5',
                      isActive(item.href)
                        ? 'bg-amber-600 text-white'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-600/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-amber-600">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {role?.replace('_', ' ') || 'User'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardLayout;
