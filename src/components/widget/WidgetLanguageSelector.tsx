import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useWidgetLanguage, LANGUAGE_OPTIONS, SupportedLanguage } from '@/contexts/WidgetLanguageContext';

interface WidgetLanguageSelectorProps {
  primaryColor?: string;
}

export const WidgetLanguageSelector = ({ primaryColor = '#1B5E3B' }: WidgetLanguageSelectorProps) => {
  const { language, setLanguage } = useWidgetLanguage();
  
  const currentLanguage = LANGUAGE_OPTIONS.find(l => l.code === language) || LANGUAGE_OPTIONS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-gray-300 hover:border-gray-400"
        >
          <span className="text-lg leading-none">{currentLanguage.flag}</span>
          <span className="hidden sm:inline text-sm">{currentLanguage.label}</span>
          <Globe className="h-4 w-4 text-gray-500" />
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
  );
};
