import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { usePartnerModules } from '@/hooks/usePartnerModules';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import OnboardingBanner from '@/components/onboarding/OnboardingBanner';
import OnboardingBlockedOverlay from '@/components/onboarding/OnboardingBlockedOverlay';
import {
  Sailboat,
  Ship,
  LayoutDashboard,
  Route,
  Calendar,
  Percent,
  BookOpen,
  CreditCard,
  QrCode,
  BarChart3,
  Code2,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Building2,
  Wallet,
  ArrowLeftRight,
  Lock,
  Anchor,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  ownerOnly?: boolean;
  alwaysAccessible?: boolean; // For settings - always accessible during onboarding
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Boats', href: '/dashboard/boats', icon: Sailboat, ownerOnly: true },
  { label: 'Private Boats', href: '/dashboard/private-boats', icon: Anchor, ownerOnly: true },
  { label: 'Routes & Trips', href: '/dashboard/trips', icon: Route },
  { label: 'Schedules', href: '/dashboard/schedules', icon: Calendar },
  { label: 'Add-ons', href: '/dashboard/addons', icon: Ship, ownerOnly: true },
  { label: 'Discounts', href: '/dashboard/discounts', icon: Percent },
  { label: 'Bookings', href: '/dashboard/bookings', icon: BookOpen },
  { label: 'Offline Booking', href: '/dashboard/offline-booking', icon: BookOpen },
  { label: 'Payment Links', href: '/dashboard/payment-links', icon: CreditCard, ownerOnly: true },
  { label: 'Check-in', href: '/dashboard/checkin', icon: QrCode },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Transactions', href: '/dashboard/transactions', icon: Wallet, ownerOnly: true },
  { label: 'Widget', href: '/dashboard/widget', icon: Code2, ownerOnly: true },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, ownerOnly: true, alwaysAccessible: true },
];

const adminNavItems: NavItem[] = [
  { label: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard, adminOnly: true },
  { label: 'All Bookings', href: '/admin/bookings', icon: BookOpen, adminOnly: true },
  { label: 'Commissions', href: '/admin/commissions', icon: Wallet, adminOnly: true },
  { label: 'Activity Commissions', href: '/admin/activity-commissions', icon: Percent, adminOnly: true },
  { label: 'Withdrawals', href: '/admin/withdrawals', icon: CreditCard, adminOnly: true },
  { label: 'Users', href: '/admin/users', icon: Users, adminOnly: true },
  { label: 'Ports', href: '/admin/ports', icon: Ship, adminOnly: true },
  { label: 'Settings', href: '/admin/settings', icon: Settings, adminOnly: true },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const { role, loading } = useUserRole();
  const { activeModules } = usePartnerModules();
  const { status: onboardingStatus, isComplete: onboardingComplete, completedCount, totalSections, loading: onboardingLoading } = useOnboarding();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const hasBothModules = activeModules.includes('boat') && activeModules.includes('activity');
  const isAdmin = role === 'admin';
  const isOnSettingsPage = location.pathname.startsWith('/dashboard/settings');

  // Check if current page is blocked (not settings and onboarding not complete)
  const isPageBlocked = !onboardingComplete && !isOnSettingsPage && !isAdmin && !onboardingLoading;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (href: string) => location.pathname === href;

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && role !== 'admin') return false;
    if (item.ownerOnly && role === 'partner_staff') return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-ocean flex items-center justify-center">
              <Ship className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">Sribooking</span>
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
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-ocean flex items-center justify-center">
                <Ship className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Sri<span className="text-gradient-ocean">booking</span>
              </span>
            </Link>
          </div>

          {/* Switch Module Button - only show if user has both modules */}
          {hasBothModules && (
            <div className="px-3 py-2 border-b border-border">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => navigate('/select-module')}
              >
                <ArrowLeftRight className="w-4 h-4" />
                Switch to Activity
              </Button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {isAdmin && (
              <>
                <div className="px-3 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Admin
                  </span>
                </div>
                {adminNavItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1',
                      isActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                ))}
                <div className="my-4 border-t border-border" />
              </>
            )}

            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isAdmin ? 'Partner View' : 'Menu'}
              </span>
            </div>
            {filteredNavItems.map((item) => {
              const isLocked = !onboardingComplete && !item.alwaysAccessible && !isAdmin;
              
              if (isLocked) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 text-muted-foreground/50 cursor-not-allowed"
                    title="Complete your settings to unlock"
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                    <Lock className="w-3 h-3 ml-auto" />
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1',
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
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

      {/* Blocked overlay when onboarding not complete */}
      {isPageBlocked && (
        <OnboardingBlockedOverlay settingsPath="/dashboard/settings" />
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Show onboarding banner on settings page if not complete */}
          {!onboardingComplete && isOnSettingsPage && !isAdmin && (
            <OnboardingBanner
              status={onboardingStatus}
              completedCount={completedCount}
              totalSections={totalSections}
              settingsPath="/dashboard/settings"
            />
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
