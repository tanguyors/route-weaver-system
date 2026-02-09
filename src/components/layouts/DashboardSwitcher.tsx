import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { usePartnerModules, type ModuleType } from '@/hooks/usePartnerModules';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeftRight, Ship, Compass, Home, ShieldCheck } from 'lucide-react';

interface DashboardOption {
  label: string;
  href: string;
  icon: React.ElementType;
  module?: ModuleType;
  adminOnly?: boolean;
}

const allDashboards: DashboardOption[] = [
  { label: 'Boat Dashboard', href: '/dashboard', icon: Ship, module: 'boat' },
  { label: 'Activity Dashboard', href: '/activity-dashboard', icon: Compass, module: 'activity' },
  { label: 'Accommodation Dashboard', href: '/accommodation-dashboard', icon: Home, module: 'accommodation' },
  { label: 'Admin Panel', href: '/admin', icon: ShieldCheck, adminOnly: true },
];

const DashboardSwitcher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useUserRole();
  const { activeModules } = usePartnerModules();
  const isAdmin = role === 'admin';

  const availableDashboards = allDashboards.filter((d) => {
    if (d.adminOnly) return isAdmin;
    return activeModules.includes(d.module!);
  });

  // Don't show if only one dashboard available
  if (availableDashboards.length <= 1) return null;

  // Determine current dashboard
  const currentPath = location.pathname;
  const current = availableDashboards.find((d) =>
    currentPath.startsWith(d.href)
  );

  const otherDashboards = availableDashboards.filter((d) => d !== current);

  if (otherDashboards.length === 0) return null;

  return (
    <div className="px-3 py-2 border-b border-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            Switch Dashboard
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {otherDashboards.map((d) => (
            <DropdownMenuItem
              key={d.href}
              onClick={() => navigate(d.href)}
              className="gap-2 cursor-pointer"
            >
              <d.icon className="w-4 h-4" />
              {d.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DashboardSwitcher;
