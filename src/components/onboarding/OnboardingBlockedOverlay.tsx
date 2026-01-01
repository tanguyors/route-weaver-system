import { Link } from 'react-router-dom';
import { Lock, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingBlockedOverlayProps {
  settingsPath: string;
}

const OnboardingBlockedOverlay = ({ settingsPath }: OnboardingBlockedOverlayProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="max-w-md mx-4 p-8 bg-card rounded-2xl shadow-xl border border-border text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Complete Your Setup
        </h2>
        
        <p className="text-muted-foreground mb-6">
          To access this feature, you need to complete your account configuration first. 
          Please fill in all required settings sections.
        </p>

        <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300 text-left">
            Configure Business, Payments, Cancellation, Tickets, Terms, and Notifications settings.
          </p>
        </div>

        <Button asChild size="lg" className="w-full">
          <Link to={settingsPath}>
            <Settings className="w-5 h-5 mr-2" />
            Go to Settings
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default OnboardingBlockedOverlay;
