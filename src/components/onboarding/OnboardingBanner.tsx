import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { OnboardingStatus } from '@/hooks/useOnboardingStatus';

interface OnboardingBannerProps {
  status: OnboardingStatus;
  completedCount: number;
  totalSections: number;
  settingsPath: string;
}

const sectionLabels: Record<keyof OnboardingStatus, string> = {
  business: 'Business Info',
  payments: 'Payments',
  cancellation: 'Cancellation',
  tickets: 'Tickets',
  terms: 'Terms & Conditions',
  notifications: 'Notifications',
};

const OnboardingBanner = ({ status, completedCount, totalSections, settingsPath }: OnboardingBannerProps) => {
  const progressPercent = (completedCount / totalSections) * 100;
  const incompleteSections = Object.entries(status)
    .filter(([, completed]) => !completed)
    .map(([key]) => sectionLabels[key as keyof OnboardingStatus]);

  return (
    <Alert className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-800 dark:text-amber-200 font-semibold">
        Complete your account setup
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-amber-700 dark:text-amber-300 mb-3">
          Before you can access all features, please complete your settings configuration.
        </p>
        
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-amber-700 dark:text-amber-300">
              Progress: {completedCount}/{totalSections} sections completed
            </span>
            <span className="text-amber-600 font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(status).map(([key, completed]) => (
            <span
              key={key}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                completed
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              {completed ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              {sectionLabels[key as keyof OnboardingStatus]}
            </span>
          ))}
        </div>

        <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
          <Link to={settingsPath}>
            <Settings className="w-4 h-4 mr-2" />
            Go to Settings
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default OnboardingBanner;
