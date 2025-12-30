import { useNavigate } from 'react-router-dom';
import { Ship, Compass, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePartnerModules } from '@/hooks/usePartnerModules';
import { useUserRole } from '@/hooks/useUserRole';
import { useEffect } from 'react';

const ModuleSelector = () => {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const { activeModules, loading: modulesLoading } = usePartnerModules();

  // Store last choice
  const handleSelectModule = (module: 'boat' | 'activity') => {
    localStorage.setItem('lastModuleChoice', module);
    if (module === 'boat') {
      navigate('/dashboard');
    } else {
      navigate('/activity-dashboard');
    }
  };

  // Auto-redirect if only one module or admin
  useEffect(() => {
    if (roleLoading || modulesLoading) return;

    if (role === 'admin') {
      navigate('/admin');
      return;
    }

    if (activeModules.length === 1) {
      if (activeModules[0] === 'boat') {
        navigate('/dashboard');
      } else {
        navigate('/activity-dashboard');
      }
      return;
    }

    // Check for last choice if both modules active
    if (activeModules.length === 2) {
      const lastChoice = localStorage.getItem('lastModuleChoice');
      if (lastChoice === 'boat' && activeModules.includes('boat')) {
        navigate('/dashboard');
      } else if (lastChoice === 'activity' && activeModules.includes('activity')) {
        navigate('/activity-dashboard');
      }
    }
  }, [role, activeModules, roleLoading, modulesLoading, navigate]);

  if (roleLoading || modulesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show pending message if no active modules
  if (activeModules.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle>Module Pending Approval</CardTitle>
            <CardDescription>
              Your partner account is awaiting admin approval. You'll receive access once approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Choose Your Dashboard</h1>
          <p className="text-muted-foreground">Select which module you'd like to access</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {activeModules.includes('boat') && (
            <Card 
              className="cursor-pointer hover:border-primary transition-all hover:shadow-lg group"
              onClick={() => handleSelectModule('boat')}
            >
              <CardHeader className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-ocean flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Ship className="w-10 h-10 text-primary-foreground" />
                </div>
                <CardTitle>Boat Dashboard</CardTitle>
                <CardDescription>
                  Manage your fastboat operations, routes, schedules, and bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="hero" className="w-full">
                  Enter Boat Dashboard
                </Button>
              </CardContent>
            </Card>
          )}

          {activeModules.includes('activity') && (
            <Card 
              className="cursor-pointer hover:border-primary transition-all hover:shadow-lg group"
              onClick={() => handleSelectModule('activity')}
            >
              <CardHeader className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Compass className="w-10 h-10 text-white" />
                </div>
                <CardTitle>Activity Dashboard</CardTitle>
                <CardDescription>
                  Manage your tours, activities, excursions, and experience bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                  Enter Activity Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModuleSelector;
