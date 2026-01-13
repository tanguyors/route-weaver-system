import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type WidgetStep = 'search' | 'select-trip' | 'cart' | 'details' | 'payment' | 'finish';

interface WidgetStepIndicatorProps {
  currentStep: WidgetStep;
  tripType?: 'one-way' | 'round-trip';
  primaryColor?: string;
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
  primaryColor = '#1B5E3B' 
}: WidgetStepIndicatorProps) => {
  const currentIndex = stepOrder.indexOf(currentStep);

  // Don't show on search step
  if (currentStep === 'search') return null;

  return (
    <div className="bg-gray-100 py-3 px-4 mb-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center gap-0">
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
                      isActive && "text-gray-800",
                      isCompleted && "text-gray-600",
                      !isActive && !isCompleted && "text-gray-400"
                    )}
                  >
                    {step.label}
                    {isCompleted && (
                      <span 
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </span>
                </div>
                
                {/* Arrow separator */}
                {index < steps.length - 1 && (
                  <div 
                    className="w-0 h-0 border-t-[14px] border-b-[14px] border-l-[10px] border-t-transparent border-b-transparent"
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
