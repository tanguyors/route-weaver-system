/// <reference types="@types/google.maps" />
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleMapsApiKey } from '@/hooks/useGoogleMapsApiKey';

// Extend Window interface for Google Maps
declare global {
  interface Window {
    initGooglePlaces?: () => void;
  }
}

export interface PlaceResult {
  formatted_address: string;
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name?: string;
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string, placeData?: PlaceResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  apiKey?: string;
  country?: string; // Restrict to specific country (e.g., 'id' for Indonesia)
}

export const GooglePlacesAutocomplete = ({
  value,
  onChange,
  placeholder = 'Enter address or hotel name',
  className,
  disabled,
  apiKey,
  country = 'id',
}: GooglePlacesAutocompleteProps) => {
  const { apiKey: fetchedApiKey, loading: keyLoading, error: keyError } = useGoogleMapsApiKey();

  const resolvedApiKey = useMemo(() => {
    return (apiKey || fetchedApiKey || '').trim();
  }, [apiKey, fetchedApiKey]);

  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps?.places) {
      setIsScriptLoaded(true);
      return;
    }

     // Don't inject script until we have a key.
     if (!resolvedApiKey) {
       setIsScriptLoaded(false);
       return;
     }

    const scriptId = 'google-maps-script';
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    const existingKey = existing?.getAttribute('data-api-key');

    // If script exists but for a different key, reload it.
    if (existing && existingKey && existingKey !== resolvedApiKey) {
      existing.remove();
    }

    if (document.getElementById(scriptId)) {
      // Script already loading
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          setIsScriptLoaded(true);
          setLoadError(null);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.setAttribute('data-api-key', resolvedApiKey);
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(resolvedApiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps?.places) {
        setIsScriptLoaded(true);
        setLoadError(null);
      } else {
        setIsScriptLoaded(false);
        setLoadError('Google Maps loaded, but Places library is unavailable.');
      }
    };
    script.onerror = () => {
      setIsScriptLoaded(false);
      setLoadError('Failed to load Google Maps. Check API key restrictions.');
    };
    document.head.appendChild(script);
  }, [resolvedApiKey]);

  // Initialize services when script is loaded
  useEffect(() => {
    if (isScriptLoaded && window.google?.maps?.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      // Create a temporary div for PlacesService (required by API)
      const tempDiv = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(tempDiv);
    }
  }, [isScriptLoaded]);

  // Handle input change and fetch suggestions
  const handleInputChange = useCallback(async (inputValue: string) => {
    onChange(inputValue);

    if (!inputValue || inputValue.length < 3 || !autocompleteServiceRef.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const request: google.maps.places.AutocompletionRequest = {
        input: inputValue,
        componentRestrictions: { country },
        types: ['establishment', 'geocode'],
      };

      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      });
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setIsLoading(false);
    }
  }, [onChange, country]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;

    setIsLoading(true);
    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['formatted_address', 'geometry', 'name', 'place_id'],
      },
      (place, status) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const placeData: PlaceResult = {
            formatted_address: place.formatted_address || prediction.description,
            place_id: prediction.place_id,
            geometry: {
              location: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
              },
            },
            name: place.name,
          };
          
          const displayValue = place.name 
            ? `${place.name}, ${place.formatted_address}`
            : place.formatted_address || prediction.description;
          
          onChange(displayValue, placeData);
        }
        setSuggestions([]);
        setShowSuggestions(false);
      }
    );
  }, [onChange]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={cn("pl-10 pr-10", className)}
          disabled={disabled}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-muted flex items-start gap-3 border-b last:border-b-0"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {suggestion.structured_formatting.main_text}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {suggestion.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {(keyError || loadError) && (
        <p className="text-xs text-destructive mt-1">
          Address search unavailable. Please type manually.
        </p>
      )}

      {!keyError && !loadError && (keyLoading || (resolvedApiKey && !isScriptLoaded)) && (
        <p className="text-xs text-muted-foreground mt-1">Loading address search...</p>
      )}
    </div>
  );
};
