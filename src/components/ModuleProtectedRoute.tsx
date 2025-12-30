import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { usePartnerModules, ModuleType } from '@/hooks/usePartnerModules';
import ModuleNotEnabled from '@/pages/ModuleNotEnabled';

interface ModuleProtectedRouteProps {
  children: ReactNode;
  requiredModule: ModuleType;
}

const ModuleProtectedRoute = ({ children, requiredModule }: ModuleProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { hasActiveModule, loading: modulesLoading } = usePartnerModules();

  const isLoading = authLoading || roleLoading || modulesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admins can access everything
  if (role === 'admin') {
    return <>{children}</>;
  }

  // Check if partner has the required active module
  if (!hasActiveModule(requiredModule)) {
    const moduleName = requiredModule === 'boat' ? 'Boat' : 'Activity';
    return <ModuleNotEnabled moduleName={moduleName} />;
  }

  return <>{children}</>;
};

export default ModuleProtectedRoute;
