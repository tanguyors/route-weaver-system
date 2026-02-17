import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type WidgetStep = 'search' | 'select-trip' | 'cart' | 'details' | 'payment' | 'payment-pending' | 'finish';

interface WidgetStepIndicatorProps {
  currentStep: WidgetStep;
  tripType?: 'one-way' | 'round-trip';
  primaryColor?: string;
}

const steps: { key: WidgetStep; label: string }[] = [
  { key: 'select-trip', label: 'Select Trip' },
  { key: 'cart', label: 'Booking Cart' },
  { key: 'details', label: 'Booking Details' },
  { key: 'payment', label: 'Payment' },
  { key: 'finish', label: 'Finish' },
];

const stepOrder: WidgetStep[] = ['search', 'select-trip', 'cart', 'details', 'payment', 'finish'];

export const WidgetStepIndicator = ({ 
  currentStep, 
  primaryColor = '#1B5E3B'
}: WidgetStepIndicatorProps) => {
  const currentIndex = stepOrder.indexOf(currentStep);

  // Don't show on search step
  if (currentStep === 'search') return null;

  return (
    <div className="bg-gray-100 py-2 sm:py-3 px-2 sm:px-4 mb-4 sm:mb-6 overflow-x-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-start sm:justify-center gap-0 min-w-max sm:min-w-0">
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
                      "text-[10px] sm:text-sm font-medium px-2 sm:px-4 py-1 sm:py-1.5 rounded-l-full flex items-center gap-1 sm:gap-2 whitespace-nowrap",
                      isActive && "text-gray-800",
                      isCompleted && "text-gray-600",
                      !isActive && !isCompleted && "text-gray-400"
                    )}
                  >
                    {step.label}
                    {isCompleted && (
                      <span 
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </span>
                    )}
                  </span>
                </div>
                
                {/* Arrow separator */}
                {index < steps.length - 1 && (
                  <div 
                    className="w-0 h-0 border-t-[10px] sm:border-t-[14px] border-b-[10px] sm:border-b-[14px] border-l-[7px] sm:border-l-[10px] border-t-transparent border-b-transparent shrink-0"
                    style={{ 
                      borderLeftColor: isCompleted || isActive ? '#e5e7eb' : '#f3f4f6'
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
