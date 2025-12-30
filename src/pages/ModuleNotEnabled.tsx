import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ModuleNotEnabledProps {
  moduleName: string;
}

const ModuleNotEnabled = ({ moduleName }: ModuleNotEnabledProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle>Module Not Enabled</CardTitle>
          <CardDescription>
            The {moduleName} module is not enabled for your account. Please contact your administrator to enable this feature.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button variant="hero" onClick={() => navigate('/select-module')}>
            Choose Another Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModuleNotEnabled;
