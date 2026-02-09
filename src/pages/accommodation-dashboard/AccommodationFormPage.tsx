import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AccommodationDashboardLayout from '@/components/layouts/AccommodationDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useAccommodationsData } from '@/hooks/useAccommodationsData';
import { useUserRole } from '@/hooks/useUserRole';
import { AccommodationImageGallery } from '@/components/accommodation/AccommodationImageGallery';
import { toast } from 'sonner';

const AMENITIES_OPTIONS = [
  'WiFi', 'AC', 'Pool', 'Kitchen', 'Parking', 'Hot Water',
  'TV', 'Garden', 'Washer', 'Dryer', 'BBQ', 'Gym',
  'Beach Access', 'Mountain View', 'Balcony', 'Terrace',
];

const AccommodationFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id && id !== 'new';
  const { accommodations, loading, createAccommodation, updateAccommodation } = useAccommodationsData();
  const { partnerId } = useUserRole();

  const [form, setForm] = useState({
    name: '', type: 'villa', description: '', capacity: 2, bedrooms: 1, bathrooms: 1,
    amenities: [] as string[], address: '', city: '', country: 'Indonesia',
    price_per_night: 0, currency: 'IDR', minimum_nights: 1,
    checkin_time: '14:00', checkout_time: '11:00', status: 'draft',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && accommodations.length > 0) {
      const acc = accommodations.find(a => a.id === id);
      if (acc) {
        setForm({
          name: acc.name, type: acc.type, description: acc.description || '',
          capacity: acc.capacity, bedrooms: acc.bedrooms, bathrooms: acc.bathrooms,
          amenities: (acc.amenities as string[]) || [],
          address: acc.address || '', city: acc.city || '', country: acc.country || 'Indonesia',
          price_per_night: Number(acc.price_per_night), currency: acc.currency,
          minimum_nights: acc.minimum_nights,
          checkin_time: acc.checkin_time || '14:00', checkout_time: acc.checkout_time || '11:00',
          status: acc.status,
        });
      }
    }
  }, [isEdit, id, accommodations]);

  const handleAmenityToggle = (amenity: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await updateAccommodation(id!, form);
        toast.success('Accommodation updated');
      } else {
        await createAccommodation(form);
        toast.success('Accommodation created');
      }
      navigate('/accommodation-dashboard/list');
    } catch (err: any) {
      toast.error(err.message || 'Error saving accommodation');
    } finally {
      setSaving(false);
    }
  };

  if (loading && isEdit) {
    return (
      <AccommodationDashboardLayout>
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AccommodationDashboardLayout>
    );
  }

  return (
    <AccommodationDashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/accommodation-dashboard/list')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? 'Edit Accommodation' : 'New Accommodation'}</h1>
            <p className="text-muted-foreground">{isEdit ? 'Update property details' : 'Add a new property'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photos - only in edit mode */}
          {isEdit && (
            <AccommodationImageGallery accommodationId={id} partnerId={partnerId || undefined} />
          )}

          {/* General Info */}
          <Card>
            <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Villa Paradise" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="guesthouse">Guesthouse</SelectItem>
                      <SelectItem value="homestay">Homestay</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} placeholder="Describe your accommodation..." />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Capacity */}
          <Card>
            <CardHeader><CardTitle>Capacity</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Max Guests</Label>
                  <Input type="number" min={1} value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <Input type="number" min={0} value={form.bedrooms} onChange={e => setForm(p => ({ ...p, bedrooms: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <Input type="number" min={0} value={form.bathrooms} onChange={e => setForm(p => ({ ...p, bathrooms: Number(e.target.value) }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AMENITIES_OPTIONS.map(amenity => (
                  <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={form.amenities.includes(amenity)} onCheckedChange={() => handleAmenityToggle(amenity)} />
                    <span className="text-sm">{amenity}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader><CardTitle>Location</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Street address" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="Ubud, Bali" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader><CardTitle>Pricing & Rules</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Price / Night</Label>
                  <Input type="number" min={0} value={form.price_per_night} onChange={e => setForm(p => ({ ...p, price_per_night: Number(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">IDR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Min. Nights</Label>
                  <Input type="number" min={1} value={form.minimum_nights} onChange={e => setForm(p => ({ ...p, minimum_nights: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Check-in Time</Label>
                  <Input type="time" value={form.checkin_time} onChange={e => setForm(p => ({ ...p, checkin_time: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Check-out Time</Label>
                  <Input type="time" value={form.checkout_time} onChange={e => setForm(p => ({ ...p, checkout_time: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/accommodation-dashboard/list')}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-2" />{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Accommodation'}
            </Button>
          </div>
        </form>
      </div>
    </AccommodationDashboardLayout>
  );
};

export default AccommodationFormPage;
