

# Implementation: Room Types, Degressive Pricing, and Widget Upgrade

The database migration is already complete (3 new tables + 2 columns added). This plan covers all the code changes needed to bring the module to Booking.com level.

---

## Phase 1: New Data Hooks

### 1.1 - Create `useAccommodationRoomsData.ts`
Full CRUD hook for `accommodation_rooms` table, following the same pattern as `useAccommodationsData`:
- `fetchRooms(accommodationId)` - list all room types for an accommodation
- `createRoom(input)` - create a new room type
- `updateRoom(id, input)` - update a room type
- `deleteRoom(id)` - delete a room type (with cascade check)
- Room type interface: name, description, capacity, bed_type, quantity, price_per_night, currency, minimum_nights, amenities, status, display_order

### 1.2 - Create `useAccommodationPriceTiersData.ts`
CRUD hook for `accommodation_price_tiers` table:
- `fetchTiers(accommodationId, roomId?)` - list price tiers
- `saveTiers(accommodationId, roomId, tiers[])` - bulk save/replace tiers
- `getEffectivePrice(accommodationId, roomId, nights)` - returns the best applicable price/night based on stay duration
- Tier interface: min_nights, price_per_night, currency

---

## Phase 2: Accommodation Form Page Update

### 2.2 - Update `AccommodationFormPage.tsx`
Add two new sections that appear **only in edit mode** (after save):

**Room Types section (visible when type = "hotel"):**
- Inline list of existing room types with edit/delete
- "Add Room Type" button opening an inline form
- Each room type shows: name, bed type, capacity, quantity (stock), price/night, status
- Room-specific image gallery (reusing the AccommodationImageGallery pattern but for room images via a new `RoomImageGallery` component)

**Price Tiers section (visible for all types):**
- Editable table of pricing tiers
- Columns: Min. Nights | Price/Night | Currency
- Add/remove tier rows
- Pre-populated with the base price as default tier (1 night = accommodation price)
- For hotels: ability to set tiers per room type

---

## Phase 3: Booking Logic Updates

### 3.1 - Update `useAccommodationBookingsData.ts`
- Add `room_id` to `AccommodationBooking` interface and `CreateBookingInput`
- Update `createBooking()`: include `room_id` in insert, include `room_id` in calendar entries
- Update availability check for hotels: instead of checking if dates are blocked, count active bookings for the room type and compare against `quantity`
- Update `fetchBookings()` query: join `accommodation_rooms` to get room name

### 3.2 - Update `useAccommodationCalendarData.ts`
- Add `room_id` to `CalendarEntry` interface
- Update `fetchCalendar` to also return room_id
- Update `toggleBlock` to handle room-specific blocking

---

## Phase 4: Dashboard Bookings Page Update

### 4.1 - Update `AccommodationBookingsPage.tsx`
- Add "Room" column in the bookings table (shows room name for hotels, empty for villas)
- In the New Booking dialog: when the selected accommodation is a hotel, show a room type selector after accommodation selection
- Auto-calculate price from the room's price_per_night (with degressive tiers)
- Show available stock for the selected room type and dates

---

## Phase 5: Edge Functions Update

### 5.1 - Update `accommodation-widget-data/index.ts`
Add parallel queries for:
- `accommodation_rooms` (active rooms for each accommodation)
- `accommodation_room_images` (images for rooms)
- `accommodation_price_tiers` (active tiers)
Build response with rooms nested under each accommodation (only for hotels), including per-room availability calculation based on quantity vs active bookings

### 5.2 - Update `create-accommodation-booking/index.ts`
- Accept `room_id` in request body
- For hotels: validate room exists, check stock availability (quantity vs concurrent bookings per date)
- Compute effective price using price tiers: find the tier where `min_nights <= stay_duration` with the highest `min_nights` value
- Apply pricing priority: Tier price -> Auto discounts -> Promo code
- Include `room_id` in booking insert and calendar entries

---

## Phase 6: Public Widget Upgrade

### 6.1 - Update `useAccommodationWidgetData.ts`
- Add `rooms`, `room_images`, and `price_tiers` to `AccommodationItem` interface
- Update `isDateAvailable` and `isRangeAvailable` to accept optional `roomId`
- For hotels with rooms: availability = `quantity - booked_count_for_date`
- Update `calculatePrice` to use price tiers when available
- Add `room_id` to `createBooking` params

### 6.2 - Update `AccommodationWidgetPage.tsx`
New booking flow for hotels:
1. Property list (unchanged for villas)
2. For hotels: after selecting the hotel, show room type cards with photos, price, capacity, bed type, and available stock
3. After selecting a room type, show the calendar with room-specific availability
4. Price tier info displayed next to calendar ("Stay 7+ nights: save 20%")
5. Enhanced booking summary showing: base price, tier discount, auto discount, promo code, final total
6. Rest of flow (guest form, confirmation) stays the same

---

## Technical Details

### Files Created (2)
- `src/hooks/useAccommodationRoomsData.ts`
- `src/hooks/useAccommodationPriceTiersData.ts`

### Files Modified (7)
- `src/pages/accommodation-dashboard/AccommodationFormPage.tsx`
- `src/pages/accommodation-dashboard/AccommodationBookingsPage.tsx`
- `src/pages/accommodation-widget/AccommodationWidgetPage.tsx`
- `src/hooks/useAccommodationWidgetData.ts`
- `src/hooks/useAccommodationBookingsData.ts`
- `supabase/functions/accommodation-widget-data/index.ts`
- `supabase/functions/create-accommodation-booking/index.ts`

### Backward Compatibility
- `room_id` is nullable everywhere, so existing villas work exactly as before
- Price tiers are optional: if none defined, the base `price_per_night` from the accommodation/room is used
- Calendar entries without `room_id` (existing data) continue to work for villas

