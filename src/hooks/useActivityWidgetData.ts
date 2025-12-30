import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface WidgetProduct {
  id: string;
  name: string;
  short_description: string | null;
  full_description: string | null;
  highlights: string[] | null;
  location_name: string | null;
  product_type: 'activity' | 'time_slot' | 'rental';
  default_capacity: number | null;
  inventory_count: number | null;
  guest_form_enabled: boolean | null;
  guest_form_config: {
    name?: boolean;
    phone?: boolean;
    age?: boolean;
    custom_fields?: { label: string; required: boolean }[];
  } | null;
  guest_form_apply_to: 'per_booking' | 'per_participant' | null;
  images: { id: string; image_url: string; display_order: number }[];
  pricing: { id: string; tier_name: string; price: number; min_age: number | null; max_age: number | null }[];
  time_slots: { id: string; slot_time: string; capacity: number }[];
  rental_options: { id: string; duration_unit: 'hour' | 'day'; duration_value: number; price: number }[];
}

export interface WidgetAvailability {
  date: string;
  status: 'open' | 'closed';
  capacity?: number;
  slots?: { slot_time: string; status: 'open' | 'closed'; capacity: number }[];
}

export interface LineItem {
  tier_name?: string;
  duration_unit?: 'hour' | 'day';
  duration_value?: number;
  qty: number;
  price: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface BookingIntentResult {
  booking_id: string;
  expires_at: string;
  subtotal_amount: number;
  total_qty: number;
}

export interface BookingDetails {
  id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  booking_date: string;
  slot_time: string | null;
  status: string;
  currency: string;
  line_items: LineItem[];
  total_qty: number;
  subtotal_amount: number;
  customer: CustomerInfo | null;
  guest_data: unknown;
  expires_at: string;
  participants: { id: string; name: string | null; phone: string | null; age: number | null; custom_fields: unknown }[];
  is_expired: boolean;
}

export const useActivityWidgetData = (productId: string | undefined) => {
  // Fetch product details for widget
  const { data: product, isLoading: isLoadingProduct, error: productError } = useQuery({
    queryKey: ['widget-product', productId],
    queryFn: async (): Promise<WidgetProduct | null> => {
      if (!productId) return null;
      
      const { data, error } = await supabase.rpc('get_widget_product', {
        _product_id: productId,
      });
      
      if (error) throw error;
      return data as unknown as WidgetProduct;
    },
    enabled: !!productId,
  });

  // Fetch availability for a date range
  const fetchAvailability = async (startDate: string, endDate: string): Promise<WidgetAvailability[]> => {
    if (!productId) return [];
    
    const { data, error } = await supabase.rpc('get_product_availability', {
      _product_id: productId,
      _start_date: startDate,
      _end_date: endDate,
    });
    
    if (error) throw error;
    return (data as unknown as WidgetAvailability[]) || [];
  };

  // Create booking intent mutation
  const createBookingMutation = useMutation({
    mutationFn: async ({
      bookingDate,
      slotTime,
      lineItems,
      customer,
      guestData,
    }: {
      bookingDate: string;
      slotTime?: string | null;
      lineItems: LineItem[];
      customer?: CustomerInfo | null;
      guestData?: unknown;
    }): Promise<BookingIntentResult> => {
      if (!productId) throw new Error('Product ID required');
      
      const { data, error } = await supabase.rpc('create_activity_booking_intent', {
        _product_id: productId,
        _booking_date: bookingDate,
        _slot_time: slotTime || null,
        _line_items: lineItems as unknown as Record<string, unknown>[],
        _customer: customer as unknown as Record<string, unknown> || null,
        _guest_data: guestData as unknown as Record<string, unknown> || null,
      });
      
      if (error) throw error;
      return data as unknown as BookingIntentResult;
    },
  });

  return {
    product,
    isLoadingProduct,
    productError,
    fetchAvailability,
    createBooking: createBookingMutation.mutateAsync,
    isCreatingBooking: createBookingMutation.isPending,
    bookingError: createBookingMutation.error,
  };
};

export const useActivityBookingData = (bookingId: string | undefined) => {
  // Fetch booking details
  const { data: booking, isLoading, error, refetch } = useQuery({
    queryKey: ['activity-booking', bookingId],
    queryFn: async (): Promise<BookingDetails | null> => {
      if (!bookingId) return null;
      
      const { data, error } = await supabase.rpc('get_activity_booking', {
        _booking_id: bookingId,
      });
      
      if (error) throw error;
      return data as unknown as BookingDetails;
    },
    enabled: !!bookingId,
    refetchInterval: (query) => {
      // Refetch every 10 seconds if draft to update expiration countdown
      const data = query.state.data;
      if (data && data.status === 'draft' && !data.is_expired) {
        return 10000;
      }
      return false;
    },
  });

  // Confirm booking mutation
  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!bookingId) throw new Error('Booking ID required');
      
      const { data, error } = await supabase.rpc('confirm_activity_booking', {
        _booking_id: bookingId,
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetch();
    },
  });

  return {
    booking,
    isLoading,
    error,
    refetch,
    confirmBooking: confirmMutation.mutateAsync,
    isConfirming: confirmMutation.isPending,
    confirmError: confirmMutation.error,
  };
};
