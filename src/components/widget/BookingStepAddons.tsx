import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WidgetAddon, SelectedAddon, PickupZone } from '@/hooks/useWidgetBooking';
import { ArrowLeft, ArrowRight, MapPin, Package, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GooglePlacesAutocomplete, PlaceResult } from './GooglePlacesAutocomplete';

// Google Maps API key - this is a public key that can be in frontend code
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
interface BookingStepAddonsProps {
  addons: WidgetAddon[];
  paxTotal: number;
  onConfirm: (selectedAddons: SelectedAddon[]) => void;
  onBack: () => void;
}

interface AddonSelection {
  addon: WidgetAddon;
  selected: boolean;
  selectedZoneId?: string;
  pickupInfo: {
    hotel_name?: string;
    address?: string;
    pickup_note?: string;
    latitude?: number;
    longitude?: number;
    place_id?: string;
  };
}

export const BookingStepAddons = ({ addons, paxTotal, onConfirm, onBack }: BookingStepAddonsProps) => {
  const [selections, setSelections] = useState<Map<string, AddonSelection>>(() => {
    const map = new Map<string, AddonSelection>();
    addons.forEach(addon => {
      map.set(addon.id, {
        addon,
        selected: addon.is_mandatory || false,
        selectedZoneId: undefined,
        pickupInfo: {},
      });
    });
    return map;
  });

  const toggleAddon = (addonId: string) => {
    const selection = selections.get(addonId);
    if (!selection || selection.addon.is_mandatory) return;
    
    setSelections(new Map(selections.set(addonId, {
      ...selection,
      selected: !selection.selected,
    })));
  };

  const setZone = (addonId: string, zoneId: string) => {
    const selection = selections.get(addonId);
    if (!selection) return;
    
    setSelections(new Map(selections.set(addonId, {
      ...selection,
      selectedZoneId: zoneId,
    })));
  };

  const setPickupInfo = (addonId: string, field: string, value: string) => {
    const selection = selections.get(addonId);
    if (!selection) return;
    
    setSelections(new Map(selections.set(addonId, {
      ...selection,
      pickupInfo: {
        ...selection.pickupInfo,
        [field]: value,
      },
    })));
  };

  const setPickupAddress = (addonId: string, address: string, placeData?: PlaceResult) => {
    const selection = selections.get(addonId);
    if (!selection) return;
    
    setSelections(new Map(selections.set(addonId, {
      ...selection,
      pickupInfo: {
        ...selection.pickupInfo,
        address: address,
        latitude: placeData?.geometry?.location?.lat,
        longitude: placeData?.geometry?.location?.lng,
        place_id: placeData?.place_id,
      },
    })));
  };

  const calculateAddonPrice = (addon: WidgetAddon, zoneId?: string): number => {
    if (zoneId && addon.pickup_zones.length > 0) {
      const zone = addon.pickup_zones.find(z => z.id === zoneId);
      if (zone && zone.price_override !== null) {
        return zone.price_override;
      }
    }
    return addon.price;
  };

  const calculateTotal = (): number => {
    let total = 0;
    selections.forEach((selection) => {
      if (selection.selected) {
        const price = calculateAddonPrice(selection.addon, selection.selectedZoneId);
        const qty = selection.addon.pricing_model === 'per_person' ? paxTotal : 1;
        total += price * qty;
      }
    });
    return total;
  };

  const handleConfirm = () => {
    const selectedAddons: SelectedAddon[] = [];
    
    selections.forEach((selection) => {
      if (selection.selected) {
        const price = calculateAddonPrice(selection.addon, selection.selectedZoneId);
        const qty = selection.addon.pricing_model === 'per_person' ? paxTotal : 1;
        const zone = selection.selectedZoneId 
          ? selection.addon.pickup_zones.find(z => z.id === selection.selectedZoneId)
          : undefined;
        
        selectedAddons.push({
          addon_id: selection.addon.id,
          name: selection.addon.name,
          price,
          qty,
          total: price * qty,
          pickup_zone_id: selection.selectedZoneId,
          pickup_zone_name: zone?.zone_name,
          pickup_info: Object.keys(selection.pickupInfo).length > 0 ? selection.pickupInfo : undefined,
        });
      }
    });
    
    onConfirm(selectedAddons);
  };

  const isValid = (): boolean => {
    let valid = true;
    selections.forEach((selection) => {
      if (selection.selected && selection.addon.type === 'pickup') {
        // Check if zone is required and selected
        if (selection.addon.enable_pickup_zones && selection.addon.pickup_zones.length > 0 && !selection.selectedZoneId) {
          valid = false;
        }
        // Check required pickup info
        const requiredInfo = selection.addon.pickup_required_info;
        if (requiredInfo) {
          if (requiredInfo.hotel_name && !selection.pickupInfo.hotel_name) valid = false;
          if (requiredInfo.address && !selection.pickupInfo.address) valid = false;
        }
      }
    });
    return valid;
  };

  if (addons.length === 0) {
    onConfirm([]);
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Add-ons & Extras
        </CardTitle>
        <CardDescription>
          Enhance your trip with optional services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {addons.map((addon) => {
          const selection = selections.get(addon.id);
          if (!selection) return null;
          
          const price = calculateAddonPrice(addon, selection.selectedZoneId);
          const qty = addon.pricing_model === 'per_person' ? paxTotal : 1;
          const subtotal = selection.selected ? price * qty : 0;

          return (
            <div
              key={addon.id}
              className={`border rounded-lg p-4 transition-colors ${
                selection.selected ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`addon-${addon.id}`}
                  checked={selection.selected}
                  onCheckedChange={() => toggleAddon(addon.id)}
                  disabled={addon.is_mandatory || false}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {addon.type === 'pickup' ? (
                      <MapPin className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Package className="h-4 w-4 text-purple-500" />
                    )}
                    <label htmlFor={`addon-${addon.id}`} className="font-medium cursor-pointer">
                      {addon.name}
                    </label>
                    {addon.is_mandatory && (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                  </div>
                  {addon.description && (
                    <p className="text-sm text-muted-foreground mt-1">{addon.description}</p>
                  )}
                  <div className="text-sm text-muted-foreground mt-1">
                    IDR {price.toLocaleString()} {addon.pricing_model === 'per_person' ? '/ person' : '/ booking'}
                    {selection.selected && (
                      <span className="ml-2 font-medium text-foreground">
                        = IDR {subtotal.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Pickup Zone Selection */}
                  {selection.selected && addon.type === 'pickup' && addon.enable_pickup_zones && addon.pickup_zones.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <Label>Select Pickup Zone</Label>
                      <Select
                        value={selection.selectedZoneId || ''}
                        onValueChange={(value) => setZone(addon.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose pickup zone..." />
                        </SelectTrigger>
                        <SelectContent>
                          {addon.pickup_zones.map((zone) => (
                            <SelectItem key={zone.id} value={zone.id}>
                              {zone.zone_name}
                              {zone.price_override !== null && (
                                <span className="ml-2 text-muted-foreground">
                                  (IDR {zone.price_override.toLocaleString()})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Pickup Info Fields */}
                  {selection.selected && addon.type === 'pickup' && addon.pickup_required_info && (
                    <div className="mt-3 space-y-3">
                      {addon.pickup_required_info.hotel_name && (
                        <div>
                          <Label htmlFor={`hotel-${addon.id}`}>Hotel Name *</Label>
                          {GOOGLE_MAPS_API_KEY ? (
                            <GooglePlacesAutocomplete
                              value={selection.pickupInfo.hotel_name || ''}
                              onChange={(value, placeData) => {
                                setPickupInfo(addon.id, 'hotel_name', value);
                                if (placeData) {
                                  // Also update address with precise coordinates
                                  setPickupAddress(addon.id, placeData.formatted_address, placeData);
                                }
                              }}
                              placeholder="Search hotel or address..."
                              apiKey={GOOGLE_MAPS_API_KEY}
                              country="id"
                            />
                          ) : (
                            <Input
                              id={`hotel-${addon.id}`}
                              placeholder="Enter hotel name"
                              value={selection.pickupInfo.hotel_name || ''}
                              onChange={(e) => setPickupInfo(addon.id, 'hotel_name', e.target.value)}
                            />
                          )}
                        </div>
                      )}
                      {addon.pickup_required_info.address && (
                        <div>
                          <Label htmlFor={`address-${addon.id}`}>Address *</Label>
                          {GOOGLE_MAPS_API_KEY ? (
                            <GooglePlacesAutocomplete
                              value={selection.pickupInfo.address || ''}
                              onChange={(value, placeData) => setPickupAddress(addon.id, value, placeData)}
                              placeholder="Search pickup address..."
                              apiKey={GOOGLE_MAPS_API_KEY}
                              country="id"
                            />
                          ) : (
                            <Input
                              id={`address-${addon.id}`}
                              placeholder="Enter pickup address"
                              value={selection.pickupInfo.address || ''}
                              onChange={(e) => setPickupInfo(addon.id, 'address', e.target.value)}
                            />
                          )}
                          {selection.pickupInfo.latitude && selection.pickupInfo.longitude && (
                            <p className="text-xs text-muted-foreground mt-1">
                              📍 GPS: {selection.pickupInfo.latitude.toFixed(6)}, {selection.pickupInfo.longitude.toFixed(6)}
                            </p>
                          )}
                        </div>
                      )}
                      {addon.pickup_required_info.pickup_note && (
                        <div>
                          <Label htmlFor={`note-${addon.id}`}>Pickup Note</Label>
                          <Input
                            id={`note-${addon.id}`}
                            placeholder="Any special instructions"
                            value={selection.pickupInfo.pickup_note || ''}
                            onChange={(e) => setPickupInfo(addon.id, 'pickup_note', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Total */}
        {calculateTotal() > 0 && (
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Add-ons Total</span>
              <span>IDR {calculateTotal().toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Validation Warning */}
        {!isValid() && (
          <div className="flex items-center gap-2 text-amber-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Please complete all required fields for selected add-ons</span>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid()} className="flex-1">
            Continue
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
