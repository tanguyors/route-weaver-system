import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';

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
}: BookingStepRouteProps) => {
  const canContinue = selectedOrigin && selectedDestination && selectedDate;
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

        <div>
          <Label htmlFor="date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Travel Date
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

        <Button 
          className="w-full" 
          size="lg"
          onClick={onContinue}
          disabled={!canContinue}
        >
          Find Departures
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};
