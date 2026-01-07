import { useState } from 'react';
import { MapPin, CalendarDays, Users, Baby, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Port {
  id: string;
  name: string;
  area?: string;
}

interface WidgetSearchFormProps {
  ports: Port[];
  availableDestinations: Port[];
  selectedOrigin: string;
  selectedDestination: string;
  departureDate: string;
  returnDate: string;
  tripType: 'one-way' | 'round-trip';
  paxAdult: number;
  paxChild: number;
  paxInfant: number;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onDepartureDateChange: (date: string) => void;
  onReturnDateChange: (date: string) => void;
  onTripTypeChange: (type: 'one-way' | 'round-trip') => void;
  onPaxChange: (adult: number, child: number, infant: number) => void;
  onSearch: () => void;
  isLoading?: boolean;
  primaryColor?: string;
  logoUrl?: string;
  tagline?: string;
}

export const WidgetSearchForm = ({
  ports,
  availableDestinations,
  selectedOrigin,
  selectedDestination,
  departureDate,
  returnDate,
  tripType,
  paxAdult,
  paxChild,
  paxInfant,
  onOriginChange,
  onDestinationChange,
  onDepartureDateChange,
  onReturnDateChange,
  onTripTypeChange,
  onPaxChange,
  onSearch,
  isLoading = false,
  primaryColor = '#22c55e',
  logoUrl,
  tagline,
}: WidgetSearchFormProps) => {
  const [departureDateOpen, setDepartureDateOpen] = useState(false);
  const [returnDateOpen, setReturnDateOpen] = useState(false);

  const parsedDepartureDate = departureDate ? new Date(departureDate) : null;
  const parsedReturnDate = returnDate ? new Date(returnDate) : null;

  const canSearch = selectedOrigin && selectedDestination && departureDate && 
    (tripType === 'one-way' || returnDate);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Field wrapper component
  const FieldWrapper = ({ 
    label, 
    icon: Icon, 
    children,
    className
  }: { 
    label: string; 
    icon: any; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={cn("relative", className)}>
      <div className="border rounded-lg bg-white hover:border-gray-400 transition-colors">
        <div className="flex items-start gap-3 p-3">
          <Icon className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: primaryColor }} />
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with optional banner */}
      <div 
        className="py-4 px-6 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            ▸ Book Tickets
          </h2>
          {tagline && (
            <p className="italic text-white/90">{tagline}</p>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Trip Type Toggle */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => onTripTypeChange('one-way')}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all border",
              tripType === 'one-way' 
                ? "text-gray-700 bg-gray-100 border-gray-300" 
                : "text-gray-500 bg-white border-gray-200 hover:bg-gray-50"
            )}
          >
            One-Way
          </button>
          <button
            onClick={() => onTripTypeChange('round-trip')}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all",
              tripType === 'round-trip' 
                ? "text-white shadow-md" 
                : "text-gray-500 bg-white border border-gray-200 hover:bg-gray-50"
            )}
            style={tripType === 'round-trip' ? { backgroundColor: primaryColor } : {}}
          >
            Round-Trip
          </button>
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-xs">i</span>
            Select voyage
          </span>
        </div>

        {/* Row 1: From, To, Dates */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* From */}
          <FieldWrapper label="From" icon={MapPin}>
            <select
              value={selectedOrigin}
              onChange={(e) => onOriginChange(e.target.value)}
              className="w-full bg-transparent text-gray-900 font-medium focus:outline-none cursor-pointer appearance-none"
            >
              <option value="">Select departure</option>
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name} {port.area ? `(${port.area})` : ''}
                </option>
              ))}
            </select>
          </FieldWrapper>

          {/* To */}
          <FieldWrapper label="To" icon={MapPin}>
            <select
              value={selectedDestination}
              onChange={(e) => onDestinationChange(e.target.value)}
              disabled={!selectedOrigin}
              className="w-full bg-transparent text-gray-900 font-medium focus:outline-none cursor-pointer appearance-none disabled:text-gray-400"
            >
              <option value="">Select destination</option>
              {availableDestinations.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name} {port.area ? `(${port.area})` : ''}
                </option>
              ))}
            </select>
          </FieldWrapper>

          {/* Depart Date */}
          <FieldWrapper label="Depart Date" icon={CalendarDays}>
            <Popover open={departureDateOpen} onOpenChange={setDepartureDateOpen}>
              <PopoverTrigger asChild>
                <button className="w-full text-left text-gray-900 font-medium focus:outline-none">
                  {parsedDepartureDate ? format(parsedDepartureDate, 'd MMM yyyy') : 'Select date'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={parsedDepartureDate || undefined}
                  onSelect={(date) => {
                    if (date) onDepartureDateChange(date.toISOString().split('T')[0]);
                    setDepartureDateOpen(false);
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </FieldWrapper>

          {/* Return Date */}
          <FieldWrapper label="Return Date" icon={CalendarDays}>
            <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
              <PopoverTrigger asChild>
                <button 
                  className={cn(
                    "w-full text-left font-medium focus:outline-none",
                    tripType === 'one-way' ? "text-gray-400 cursor-not-allowed" : "text-gray-900"
                  )}
                  disabled={tripType === 'one-way'}
                >
                  {parsedReturnDate ? format(parsedReturnDate, 'd MMM yyyy') : 'Select date'}
                </button>
              </PopoverTrigger>
              {tripType === 'round-trip' && (
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parsedReturnDate || undefined}
                    onSelect={(date) => {
                      if (date) onReturnDateChange(date.toISOString().split('T')[0]);
                      setReturnDateOpen(false);
                    }}
                    disabled={(date) => {
                      const minDate = parsedDepartureDate || new Date(new Date().setHours(0, 0, 0, 0));
                      return date < minDate;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              )}
            </Popover>
          </FieldWrapper>
        </div>

        {/* Row 2: Passengers */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Adult */}
          <FieldWrapper label="Adult(12+ years)" icon={Users}>
            <select
              value={paxAdult}
              onChange={(e) => onPaxChange(Number(e.target.value), paxChild, paxInfant)}
              className="w-full bg-transparent text-gray-900 font-medium focus:outline-none cursor-pointer appearance-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </FieldWrapper>

          {/* Child */}
          <FieldWrapper label="Child" icon={Users}>
            <select
              value={paxChild}
              onChange={(e) => onPaxChange(paxAdult, Number(e.target.value), paxInfant)}
              className="w-full bg-transparent text-gray-900 font-medium focus:outline-none cursor-pointer appearance-none"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </FieldWrapper>

          {/* Infants */}
          <FieldWrapper label="Infants(0-2 years)" icon={Baby}>
            <select
              value={paxInfant}
              onChange={(e) => onPaxChange(paxAdult, paxChild, Number(e.target.value))}
              className="w-full bg-transparent text-gray-900 font-medium focus:outline-none cursor-pointer appearance-none"
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </FieldWrapper>

          {/* Search Button */}
          <button
            onClick={onSearch}
            disabled={!canSearch || isLoading}
            className="h-full min-h-[60px] rounded-lg text-white font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: '#374151' }}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
    </div>
  );
};
