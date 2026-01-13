import { Globe, Coins } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  useWidgetLanguage, 
  useWidgetCurrency,
  LANGUAGE_OPTIONS, 
  CURRENCY_CONFIG,
  SupportedLanguage,
  SupportedCurrency 
} from '@/contexts/WidgetLanguageContext';

interface WidgetLanguageSelectorProps {
  primaryColor?: string;
}

export const WidgetLanguageSelector = ({ primaryColor = '#1B5E3B' }: WidgetLanguageSelectorProps) => {
  const { language, setLanguage } = useWidgetLanguage();
  const { currency, setCurrency, getCurrencyConfig } = useWidgetCurrency();
  
  const currentLanguage = LANGUAGE_OPTIONS.find(l => l.code === language) || LANGUAGE_OPTIONS[0];
  const currentCurrency = getCurrencyConfig();

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Currency Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 sm:gap-2 border-gray-300 hover:border-gray-400 px-2 sm:px-3"
          >
            <span className="text-sm sm:text-lg leading-none">{currentCurrency.flag}</span>
            <span className="text-xs sm:text-sm font-medium">{currentCurrency.code}</span>
            <Coins className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          {CURRENCY_CONFIG.map((option) => (
            <DropdownMenuItem
              key={option.code}
              onClick={() => setCurrency(option.code as SupportedCurrency)}
              className={`cursor-pointer gap-2 ${currency === option.code ? 'bg-gray-100 font-medium' : ''}`}
            >
              <span className="text-lg leading-none">{option.flag}</span>
              <span className="flex-1">{option.code}</span>
              <span className="text-gray-500 text-xs">{option.symbol}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Language Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 sm:gap-2 border-gray-300 hover:border-gray-400 px-2 sm:px-3"
          >
            <span className="text-sm sm:text-lg leading-none">{currentLanguage.flag}</span>
            <span className="hidden sm:inline text-sm">{currentLanguage.label}</span>
            <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[150px]">
          {LANGUAGE_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.code}
              onClick={() => setLanguage(option.code as SupportedLanguage)}
              className={`cursor-pointer gap-2 ${language === option.code ? 'bg-gray-100 font-medium' : ''}`}
            >
              <span className="text-lg leading-none">{option.flag}</span>
              <span>{option.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
