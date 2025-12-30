import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Search, MapPin, CalendarDays, Users, ChevronDown, Loader2, Baby } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Port {
  id: string;
  name: string;
}

interface BarSelectionState {
  tripType: 'one-way' | 'round-trip';
  returnDate: string | null;
  paxInfant: number;
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
  barSelection?: BarSelectionState;
  onBarSelectionChange?: (selection: BarSelectionState) => void;
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
  barSelection,
  onBarSelectionChange,
}: WidgetBarViewProps) => {
  const [departureDateOpen, setDepartureDateOpen] = useState(false);
  const [returnDateOpen, setReturnDateOpen] = useState(false);

  const tripType = barSelection?.tripType || 'one-way';
  const returnDate = barSelection?.returnDate || null;
  const paxInfant = barSelection?.paxInfant || 0;

  const setTripType = (type: 'one-way' | 'round-trip') => {
    onBarSelectionChange?.({ tripType: type, returnDate, paxInfant });
  };
  const setReturnDate = (date: string | null) => {
    onBarSelectionChange?.({ tripType, returnDate: date, paxInfant });
  };
  const setPaxInfant = (count: number) => {
    onBarSelectionChange?.({ tripType, returnDate, paxInfant: count });
  };

  const primaryColor = themeConfig?.primary_color || '#6b21a8';
  const backgroundColor = themeConfig?.background_color || '#f8fafc';
  const textColor = themeConfig?.text_color || '#1e1b4b';
  const buttonTextColor = themeConfig?.button_text_color || '#ffffff';
  const borderColor = themeConfig?.border_color || '#e2e8f0';

  const selectedOriginPort = ports.find(p => p.id === selectedOrigin);
  const selectedDestPort = availableDestinations.find(p => p.id === selectedDestination);
  const parsedDate = selectedDate ? new Date(selectedDate) : null;
  const parsedReturnDate = returnDate ? new Date(returnDate) : null;

  const canSearch = selectedOrigin && selectedDestination && selectedDate && (tripType === 'one-way' || returnDate);

  return (
    <div 
      className="w-full p-6 rounded-2xl shadow-lg relative"
      style={{ backgroundColor }}
    >
      {/* Header */}
      <h2 
        className="text-2xl font-bold mb-6"
        style={{ color: primaryColor }}
      >
        Book Your Tickets!
      </h2>

      {/* Trip Type Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTripType('one-way')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            tripType === 'one-way' 
              ? 'text-white shadow-md' 
              : 'bg-white border text-gray-700 hover:bg-gray-50'
          }`}
          style={tripType === 'one-way' ? { backgroundColor: primaryColor } : { borderColor }}
        >
          One Way
        </button>
        <button
          onClick={() => setTripType('round-trip')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            tripType === 'round-trip' 
              ? 'text-white shadow-md' 
              : 'bg-white border text-gray-700 hover:bg-gray-50'
          }`}
          style={tripType === 'round-trip' ? { backgroundColor: primaryColor } : { borderColor }}
        >
          Round Trip
        </button>
      </div>

      {/* Row 1: Departure + Dates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Departure Field */}
        <div>
          <label 
            className="block text-sm font-semibold mb-2"
            style={{ color: primaryColor }}
          >
            Departure
          </label>
          <Select value={selectedOrigin || ''} onValueChange={onOriginChange}>
            <SelectTrigger 
              className="w-full h-12 bg-white rounded-lg border"
              style={{ borderColor }}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                <SelectValue placeholder="Choose Departure">
                  {selectedOriginPort?.name || 'Choose Departure'}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {ports.map((port) => (
                <SelectItem key={port.id} value={port.id}>
                  {port.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Departure Date */}
        <div>
          <label 
            className="block text-sm font-semibold mb-2"
            style={{ color: primaryColor }}
          >
            Departure Date
          </label>
          <Popover open={departureDateOpen} onOpenChange={setDepartureDateOpen}>
            <PopoverTrigger asChild>
              <button 
                className="w-full h-12 bg-white rounded-lg border flex items-center gap-2 px-3 text-left"
                style={{ borderColor }}
              >
                <CalendarDays className="w-5 h-5" style={{ color: primaryColor }} />
                <span style={{ color: parsedDate ? textColor : '#94a3b8' }}>
                  {parsedDate ? format(parsedDate, 'd MMM yyyy') : 'Select Date'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parsedDate || undefined}
                onSelect={(date) => {
                  if (date) {
                    onDateChange(date.toISOString().split('T')[0]);
                  }
                  setDepartureDateOpen(false);
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Return Date */}
        <div>
          <label 
            className="block text-sm font-semibold mb-2"
            style={{ color: primaryColor }}
          >
            Return Date
          </label>
          <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
            <PopoverTrigger asChild>
              <button 
                className={`w-full h-12 bg-white rounded-lg border flex items-center gap-2 px-3 text-left ${
                  tripType === 'one-way' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ borderColor }}
                disabled={tripType === 'one-way'}
              >
                <CalendarDays className="w-5 h-5" style={{ color: primaryColor }} />
                <span style={{ color: parsedReturnDate ? textColor : '#94a3b8' }}>
                  {parsedReturnDate ? format(parsedReturnDate, 'd MMM yyyy') : 'Select Date'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parsedReturnDate || undefined}
                onSelect={(date) => {
                  if (date) {
                    setReturnDate(date.toISOString().split('T')[0]);
                  }
                  setReturnDateOpen(false);
                }}
                disabled={(date) => {
                  const today = new Date(new Date().setHours(0, 0, 0, 0));
                  const departureMin = parsedDate || today;
                  return date < departureMin;
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Row 2: Destination + Passengers + Search */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Destination Field */}
          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: primaryColor }}
            >
              Destination
            </label>
            <Select 
              value={selectedDestination || ''} 
              onValueChange={onDestinationChange}
              disabled={!selectedOrigin}
            >
              <SelectTrigger 
                className="w-full h-12 bg-white rounded-lg border"
                style={{ borderColor }}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                  <SelectValue placeholder="Choose Destination">
                    {selectedDestPort?.name || 'Choose Destination'}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {availableDestinations.map((port) => (
                  <SelectItem key={port.id} value={port.id}>
                    {port.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Adult */}
          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: primaryColor }}
            >
              Adult
            </label>
            <Select value={String(paxAdult)} onValueChange={(v) => onPaxChange(Number(v), paxChild)}>
              <SelectTrigger 
                className="w-full h-12 bg-white rounded-lg border"
                style={{ borderColor }}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" style={{ color: primaryColor }} />
                  <SelectValue>{paxAdult}</SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs mt-1 block" style={{ color: primaryColor }}>
              10 Years Old +
            </span>
          </div>

          {/* Child */}
          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: primaryColor }}
            >
              Child
            </label>
            <Select value={String(paxChild)} onValueChange={(v) => onPaxChange(paxAdult, Number(v))}>
              <SelectTrigger 
                className="w-full h-12 bg-white rounded-lg border"
                style={{ borderColor }}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" style={{ color: primaryColor }} />
                  <Users className="w-4 h-4 -ml-2" style={{ color: primaryColor }} />
                  <SelectValue>{paxChild}</SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs mt-1 block" style={{ color: primaryColor }}>
              3 - 10 Years Old
            </span>
          </div>

          {/* Infants */}
          <div>
            <label 
              className="block text-sm font-semibold mb-2"
              style={{ color: primaryColor }}
            >
              Infants
            </label>
            <Select value={String(paxInfant)} onValueChange={(v) => setPaxInfant(Number(v))}>
              <SelectTrigger 
                className="w-full h-12 bg-white rounded-lg border"
                style={{ borderColor }}
              >
                <div className="flex items-center gap-2">
                  <Baby className="w-5 h-5" style={{ color: primaryColor }} />
                  <SelectValue>{paxInfant}</SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs mt-1 block" style={{ color: primaryColor }}>
              0-2 Years Old
            </span>
          </div>
        </div>

        {/* Search Button */}
        <Button
          className="h-12 px-8 rounded-lg shadow-md font-semibold gap-2"
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
            <>
              Search
              <Search className="h-5 w-5" />
            </>
          )}
        </Button>
      </div>

      {/* Powered By Tag */}
      <div className="absolute bottom-2 right-4">
        <span className="text-xs text-gray-400">
          By <a href="https://sribooking.com" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: primaryColor }}>SriBooking.com</a>
        </span>
      </div>
    </div>
  );
};

export default WidgetBarView;
