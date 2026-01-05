import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MapPin, Calendar, ArrowRight, Edit, ArrowLeftRight, ArrowRightCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Port {
  id: string;
  name: string;
  area: string;
}

interface BookingStepRouteProps {
  ports: Port[];
  selectedOrigin: string;
  selectedDestination: string;
  selectedDate: string;
  onOriginChange: (id: string) => void;
  onDestinationChange: (id: string) => void;
  onDateChange: (date: string) => void;
  availableDestinations: Port[];
  onContinue: () => void;
  // Round trip props
  tripType?: 'one-way' | 'round-trip';
  returnDate?: string;
  onTripTypeChange?: (type: 'one-way' | 'round-trip') => void;
  onReturnDateChange?: (date: string) => void;
}

export const BookingStepRoute = ({
  ports,
  selectedOrigin,
  selectedDestination,
  selectedDate,
  onOriginChange,
  onDestinationChange,
  onDateChange,
  availableDestinations,
  onContinue,
  tripType = 'one-way',
  returnDate = '',
  onTripTypeChange,
  onReturnDateChange,
}: BookingStepRouteProps) => {
  const navigate = useNavigate();
  const canContinue = selectedOrigin && selectedDestination && selectedDate && 
    (tripType === 'one-way' || (tripType === 'round-trip' && returnDate));
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select Your Route
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trip Type Toggle */}
        {onTripTypeChange && (
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={() => onTripTypeChange('one-way')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                tripType === 'one-way'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowRightCircle className="h-4 w-4" />
              One Way
            </button>
            <button
              onClick={() => onTripTypeChange('round-trip')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                tripType === 'round-trip'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowLeftRight className="h-4 w-4" />
              Round Trip
            </button>
          </div>
        )}

        <div>
          <Label htmlFor="origin">From</Label>
          <Select value={selectedOrigin} onValueChange={onOriginChange}>
            <SelectTrigger id="origin" className="mt-1">
              <SelectValue placeholder="Select departure port" />
            </SelectTrigger>
            <SelectContent>
              {ports.map(port => (
                <SelectItem key={port.id} value={port.id}>
                  {port.name} {port.area && `(${port.area})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="destination">To</Label>
          <Select 
            value={selectedDestination} 
            onValueChange={onDestinationChange}
            disabled={!selectedOrigin}
          >
            <SelectTrigger id="destination" className="mt-1">
              <SelectValue placeholder={selectedOrigin ? "Select destination" : "Select origin first"} />
            </SelectTrigger>
            <SelectContent>
              {availableDestinations.map(port => (
                <SelectItem key={port.id} value={port.id}>
                  {port.name} {port.area && `(${port.area})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={tripType === 'round-trip' ? 'grid grid-cols-2 gap-4' : ''}>
          <div>
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {tripType === 'round-trip' ? 'Departure Date' : 'Travel Date'}
            </Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              min={minDate}
              className="mt-1"
            />
          </div>

          {tripType === 'round-trip' && onReturnDateChange && (
            <div>
              <Label htmlFor="returnDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Return Date
              </Label>
              <Input
                id="returnDate"
                type="date"
                value={returnDate}
                onChange={(e) => onReturnDateChange(e.target.value)}
                min={selectedDate || minDate}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <Button 
          className="w-full" 
          size="lg"
          onClick={onContinue}
          disabled={!canContinue}
        >
          Find Departures
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Button 
          variant="outline"
          className="w-full" 
          size="lg"
          onClick={() => navigate('/modify-ticket')}
        >
          <Edit className="h-4 w-4 mr-2" />
          Modify My Ticket
        </Button>
      </CardContent>
    </Card>
  );
};
