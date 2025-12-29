import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Search, MapPin, CalendarDays, Users, ChevronDown, Loader2 } from 'lucide-react';

interface Port {
  id: string;
  name: string;
}

interface WidgetBarViewProps {
  ports: Port[];
  selectedOrigin: string | null;
  selectedDestination: string | null;
  selectedDate: string | null;
  paxAdult: number;
  paxChild: number;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onDateChange: (date: string) => void;
  onPaxChange: (adult: number, child: number) => void;
  availableDestinations: Port[];
  onSearch: () => void;
  isSearching?: boolean;
  themeConfig?: {
    primary_color?: string;
    background_color?: string;
    text_color?: string;
    button_text_color?: string;
    border_color?: string;
  };
}

const WidgetBarView = ({
  ports,
  selectedOrigin,
  selectedDestination,
  selectedDate,
  paxAdult,
  paxChild,
  onOriginChange,
  onDestinationChange,
  onDateChange,
  onPaxChange,
  availableDestinations,
  onSearch,
  isSearching = false,
  themeConfig,
}: WidgetBarViewProps) => {
  const [originOpen, setOriginOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [paxOpen, setPaxOpen] = useState(false);

  const primaryColor = themeConfig?.primary_color || '#f43f5e';
  const backgroundColor = themeConfig?.background_color || '#ffffff';
  const textColor = themeConfig?.text_color || '#1e293b';
  const buttonTextColor = themeConfig?.button_text_color || '#ffffff';
  const borderColor = themeConfig?.border_color || '#e2e8f0';

  const selectedOriginPort = ports.find(p => p.id === selectedOrigin);
  const selectedDestPort = ports.find(p => p.id === selectedDestination);
  const totalPax = paxAdult + paxChild;
  const parsedDate = selectedDate ? new Date(selectedDate) : null;

  const canSearch = selectedOrigin && selectedDestination && selectedDate;

  return (
    <div 
      className="w-full py-3 px-4"
      style={{ backgroundColor }}
    >
      <div 
        className="flex items-center rounded-full shadow-lg border overflow-hidden max-w-4xl mx-auto"
        style={{ borderColor, backgroundColor }}
      >
        {/* Destination Field */}
        <Popover open={originOpen} onOpenChange={setOriginOpen}>
          <PopoverTrigger asChild>
            <button 
              className="flex-1 flex flex-col items-start px-4 py-2 hover:bg-muted/50 transition-colors border-r min-w-0"
              style={{ borderColor }}
            >
              <span className="text-xs font-medium" style={{ color: textColor }}>
                Destination
              </span>
              <span className="text-sm truncate w-full text-left" style={{ color: selectedOriginPort ? textColor : '#94a3b8' }}>
                {selectedOriginPort?.name || 'Rechercher une destination'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                Sélectionner l'origine
              </p>
              {ports.map((port) => (
                <button
                  key={port.id}
                  onClick={() => {
                    onOriginChange(port.id);
                    setOriginOpen(false);
                    if (selectedDestination === port.id) {
                      onDestinationChange('');
                    }
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedOrigin === port.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <MapPin className="w-4 h-4 inline mr-2" />
                  {port.name}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Dates Field */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <button 
              className="flex-1 flex flex-col items-start px-4 py-2 hover:bg-muted/50 transition-colors border-r min-w-0"
              style={{ borderColor }}
            >
              <span className="text-xs font-medium" style={{ color: textColor }}>
                Dates
              </span>
              <span className="text-sm truncate w-full text-left" style={{ color: parsedDate ? textColor : '#94a3b8' }}>
                {parsedDate ? format(parsedDate, 'dd MMM yyyy') : 'Quand ?'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={parsedDate || undefined}
              onSelect={(date) => {
                if (date) {
                  onDateChange(date.toISOString().split('T')[0]);
                }
                setDateOpen(false);
              }}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Passengers Field */}
        <Popover open={paxOpen} onOpenChange={setPaxOpen}>
          <PopoverTrigger asChild>
            <button 
              className="flex-1 flex flex-col items-start px-4 py-2 hover:bg-muted/50 transition-colors min-w-0"
            >
              <span className="text-xs font-medium" style={{ color: textColor }}>
                Voyageurs
              </span>
              <span className="text-sm truncate w-full text-left" style={{ color: totalPax > 0 ? textColor : '#94a3b8' }}>
                {totalPax > 0 ? `${totalPax} voyageur${totalPax > 1 ? 's' : ''}` : 'Ajouter des...'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Adultes</p>
                  <p className="text-xs text-muted-foreground">12 ans et plus</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => onPaxChange(Math.max(1, paxAdult - 1), paxChild)}
                    disabled={paxAdult <= 1}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center font-medium">{paxAdult}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => onPaxChange(paxAdult + 1, paxChild)}
                  >
                    +
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enfants</p>
                  <p className="text-xs text-muted-foreground">2-11 ans</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => onPaxChange(paxAdult, Math.max(0, paxChild - 1))}
                    disabled={paxChild <= 0}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center font-medium">{paxChild}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => onPaxChange(paxAdult, paxChild + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Search Button */}
        <div className="pr-2">
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-md"
            style={{ 
              backgroundColor: primaryColor, 
              color: buttonTextColor,
            }}
            onClick={onSearch}
            disabled={!canSearch || isSearching}
          >
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WidgetBarView;
