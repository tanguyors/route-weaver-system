

# Fix: Pre-widget to Full Widget parameter forwarding

## Problem
When a user searches on the pre-widget (on the partner's homepage) and gets redirected to the partner's `/booking` page, the URL contains all search parameters (from, to, depart, etc.). However, these parameters are in the **parent page's URL**, not in the **iframe's URL** where the widget runs. If the partner's embed code doesn't forward those params to the iframe, the widget loads empty.

The current embed code includes a script that forwards params, but if the partner has an older version without it, the system breaks silently.

## Solution: Dual-channel parameter passing

Add a **postMessage-based fallback** so the widget can request params from the parent page even when they're not in the iframe URL.

### Changes

**1. WidgetBookingNew.tsx -- Add postMessage param request**
- On mount, if no prefill params are detected in the iframe URL, send a `postMessage` to the parent window: `{ type: 'sribooking-request-params' }`
- Listen for a response: `{ type: 'sribooking-params', params: { from, to, depart, ... } }`
- When received, apply those params the same way URL prefill works, then trigger auto-search

**2. useWidgetConfigData.ts -- Update Full Widget embed code**
- Add a `message` event listener in the generated embed script that listens for `sribooking-request-params` from the iframe
- When received, read `window.location.search` and respond with `{ type: 'sribooking-params', params: {...} }` back to the iframe
- This works regardless of whether the iframe src already has the params

**3. No partner action needed**
- The postMessage mechanism works automatically once both the embed code and widget are deployed
- **However**, the partner MUST re-copy the updated Full Widget embed code from the dashboard and paste it on their `/booking` page to get the listener. Without the listener on the parent page, the iframe cannot receive params from the parent URL.

### Technical detail

```text
Partner Homepage (pre-widget)
    |
    | window.top.location.href = "/booking?key=...&from=...&to=..."
    v
Partner /booking page (with embed code)
    |
    |-- iframe loads: book-new?key=... (no from/to/depart)
    |
    |   iframe sends postMessage: "sribooking-request-params"
    |   parent script reads window.location.search
    |   parent responds: { type: "sribooking-params", params: {from, to, depart,...} }
    |
    |   Widget receives params -> prefills -> auto-searches
    v
Results displayed automatically
```

### Important note for the partner
The partner **will need to re-copy the Full Widget embed code** from the Widget settings page and paste it on their `/booking` page. This is required to add the postMessage listener. After this one-time update, all future fixes will be automatic.

