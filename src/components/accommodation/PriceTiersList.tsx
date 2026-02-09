import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Save, TrendingDown } from 'lucide-react';
import { useAccommodationPriceTiersData, PriceTierInput } from '@/hooks/useAccommodationPriceTiersData';
import { toast } from 'sonner';

interface PriceTiersListProps {
  accommodationId: string;
  roomId?: string | null;
  basePrice: number;
  currency: string;
}

export const PriceTiersList = ({ accommodationId, roomId, basePrice, currency }: PriceTiersListProps) => {
  const { tiers, loading, saveTiers } = useAccommodationPriceTiersData(accommodationId, roomId);
  const [localTiers, setLocalTiers] = useState<PriceTierInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (tiers.length > 0) {
      setLocalTiers(tiers.map(t => ({ min_nights: t.min_nights, price_per_night: t.price_per_night, currency: t.currency })));
    } else {
      setLocalTiers([]);
    }
    setDirty(false);
  }, [tiers]);

  const addTier = () => {
    const lastMinNights = localTiers.length > 0 ? Math.max(...localTiers.map(t => t.min_nights)) : 0;
    setLocalTiers(prev => [...prev, { min_nights: lastMinNights + 7, price_per_night: Math.round(basePrice * 0.9), currency }]);
    setDirty(true);
  };

  const removeTier = (index: number) => {
    setLocalTiers(prev => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const updateTier = (index: number, field: keyof PriceTierInput, value: number) => {
    setLocalTiers(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
    setDirty(true);
  };

  const handleSave = async () => {
    const sorted = [...localTiers].sort((a, b) => a.min_nights - b.min_nights);
    const uniqueNights = new Set(sorted.map(t => t.min_nights));
    if (uniqueNights.size !== sorted.length) { toast.error('Each tier must have a unique minimum nights value'); return; }
    if (sorted.some(t => t.min_nights < 2)) { toast.error('Minimum nights must be at least 2'); return; }
    if (sorted.some(t => t.price_per_night <= 0)) { toast.error('Price must be greater than 0'); return; }
    setSaving(true);
    try {
      await saveTiers(accommodationId, roomId || null, sorted);
      toast.success('Price tiers saved');
      setDirty(false);
    } catch (err: any) {
      toast.error(err.message || 'Error saving tiers');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Price Tiers (Degressive Pricing)
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addTier}>
              <Plus className="h-4 w-4 mr-1" /> Add Tier
            </Button>
            {dirty && (
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Base price: <strong>{currency} {basePrice.toLocaleString()}/night</strong> (1+ nights).
          Add tiers to offer lower prices for longer stays.
        </p>
        {localTiers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No price tiers. All stays use the base price.</p>
        ) : (
          <div className="space-y-2">
            {localTiers
              .sort((a, b) => a.min_nights - b.min_nights)
              .map((tier, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">From</span>
                    <Input type="number" min={2} value={tier.min_nights} onChange={e => updateTier(index, 'min_nights', Number(e.target.value))} className="w-20" />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">nights →</span>
                    <Input type="number" min={1} value={tier.price_per_night} onChange={e => updateTier(index, 'price_per_night', Number(e.target.value))} className="w-32" />
                    <span className="text-sm text-muted-foreground">{currency}/night</span>
                    {basePrice > 0 && tier.price_per_night < basePrice && (
                      <span className="text-xs text-green-600 font-medium">-{Math.round((1 - tier.price_per_night / basePrice) * 100)}%</span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeTier(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
