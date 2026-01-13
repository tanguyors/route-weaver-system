import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export type WidgetStep = 'search' | 'select-trip' | 'cart' | 'details' | 'payment' | 'finish';

interface WidgetStepIndicatorProps {
  currentStep: WidgetStep;
  tripType?: 'one-way' | 'round-trip';
  primaryColor?: string;
  languageSelector?: ReactNode;
}

const steps: { key: WidgetStep; label: string }[] = [
  { key: 'select-trip', label: 'Select Trip' },
  { key: 'cart', label: 'Shopping Cart' },
  { key: 'details', label: 'Booking Details' },
  { key: 'payment', label: 'Payment' },
  { key: 'finish', label: 'Finish' },
];

const stepOrder: WidgetStep[] = ['search', 'select-trip', 'cart', 'details', 'payment', 'finish'];

export const WidgetStepIndicator = ({ 
  currentStep, 
  primaryColor = '#1B5E3B',
  languageSelector
}: WidgetStepIndicatorProps) => {
  const currentIndex = stepOrder.indexOf(currentStep);

  // On search step, show only the header with language selector
  if (currentStep === 'search') {
    return (
      <div className="py-3 px-4 mb-6" style={{ backgroundColor: primaryColor }}>
        <div className="max-w-4xl mx-auto flex items-center justify-end">
          {languageSelector}
        </div>
      </div>
    );
  }

  return (
    <div className="py-3 px-4 mb-6" style={{ backgroundColor: primaryColor }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center gap-0 flex-1">
            {steps.map((step, index) => {
              const stepIndex = stepOrder.indexOf(step.key);
              const isActive = currentStep === step.key;
              const isCompleted = currentIndex > stepIndex;
              
              return (
                <div key={step.key} className="flex items-center">
                  {/* Step */}
                  <div className="flex items-center">
                    <span
                      className={cn(
                        "text-sm font-medium px-4 py-1.5 rounded-l-full flex items-center gap-2",
                        isActive && "text-white",
                        isCompleted && "text-white/80",
                        !isActive && !isCompleted && "text-white/50"
                      )}
                    >
                      {step.label}
                      {isCompleted && (
                        <span className="w-5 h-5 rounded-full flex items-center justify-center bg-white/20">
                          <Check className="w-3 h-3 text-white" />
                        </span>
                      )}
                    </span>
                  </div>
                  
                  {/* Arrow separator */}
                  {index < steps.length - 1 && (
                    <div 
                      className="w-0 h-0 border-t-[14px] border-b-[14px] border-l-[10px] border-t-transparent border-b-transparent border-l-white/20"
                    />
                  )}
                </div>
              );
            })}
          </div>
          {languageSelector}
        </div>
      </div>
    </div>
  );
};
