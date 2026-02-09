

# Fix: Accommodation Widget Not Working

## Problems Identified

Two issues are preventing the widget from working:

### Problem 1: Backend functions not deployed
The two backend functions that power the accommodation widget (`accommodation-widget-data` and `create-accommodation-booking`) exist in the code but were not deployed. When the widget preview tries to load data, it gets a "not found" error instead of property data.

### Problem 2: No test properties
The accommodations database is empty -- there are no properties to display. Even after fixing the deployment, the widget will show "No properties available" until at least one property is created.

---

## Fix Plan

### Step 1: Deploy the backend functions
Force-deploy the two edge functions so the widget can fetch data properly.

### Step 2: Add safe error handling in the widget hook
Update `src/hooks/useAccommodationWidgetData.ts` to validate that the response is JSON before parsing (prevents cryptic errors if the backend returns HTML/error pages). This follows the Content-Type validation pattern recommended for widget-facing API calls.

### Step 3: Improve the preview display on the dashboard config page
Update `src/pages/accommodation-dashboard/AccommodationWidgetPage.tsx` to show a helpful message when the preview cannot load (e.g. no properties yet) instead of a blank or broken iframe.

---

## Technical Details

### Files modified (2)

**`src/hooks/useAccommodationWidgetData.ts`**
- Add Content-Type check before `response.json()` to catch HTML error pages
- Better error messages when the backend is unreachable

**`src/pages/accommodation-dashboard/AccommodationWidgetPage.tsx`**
- Add a notice above the preview iframe when no accommodations exist, guiding the partner to create properties first

### Edge functions deployed (2)
- `accommodation-widget-data`
- `create-accommodation-booking`

