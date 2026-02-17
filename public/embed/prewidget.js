/**
 * SriBooking Pre-Widget - Native search bar (no iframe)
 * Exact same visual style as the main widget WidgetSearchForm
 * Includes custom unified calendar picker (single field for one-way/round-trip)
 * Embed on partner's homepage, redirects to dedicated booking page with params
 */
(function() {
  'use strict';

  // Derive the widget base URL from this script's own src
  var widgetBaseUrl = '';
  try {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.indexOf('prewidget.js') !== -1) {
        var su = new URL(scripts[i].src);
        widgetBaseUrl = su.origin;
        break;
      }
    }
  } catch (e) {}

  // === Auto-patch: If this script loads on a page with URL params AND an iframe pointing to
  // our widget, inject the params into the iframe src. This ensures params are forwarded
  // even if the partner uses old embed code without param forwarding.
  // If NO iframe is found at all, auto-create one (so partner only needs this ONE script). ===
  (function autoPatchOrCreateIframe() {
    try {
      // Try to get URL search params from multiple sources
      var qs = window.location.search;
      if (!qs || qs.length < 2) {
        try { qs = window.top.location.search; } catch(e) {}
      }
      if (!qs || qs.length < 2) {
        try { qs = window.parent.location.search; } catch(e) {}
      }
      // Fallback: read params from cookie (set by prewidget on homepage before redirect)
      // This works even in sandboxed sub-iframes on Hostinger/Zyro
      if (!qs || qs.length < 2) {
        try {
          var cookies = document.cookie.split(';');
          for (var ci = 0; ci < cookies.length; ci++) {
            var c = cookies[ci].trim();
            if (c.indexOf('sribooking_params=') === 0) {
              qs = '?' + decodeURIComponent(c.substring('sribooking_params='.length));
              // Clear the cookie after reading (one-time use)
              document.cookie = 'sribooking_params=;path=/;max-age=0;SameSite=Lax';
              break;
            }
          }
        } catch(e) {}
      }
      if (!qs || qs.length < 2) return; // No params to forward

      var currentParams = new URLSearchParams(qs);
      var relevantKeys = ['key','from','to','depart','return','ad','ch','inf','trip','currency','lang'];
      var hasRelevant = false;
      for (var k = 0; k < relevantKeys.length; k++) {
        if (currentParams.get(relevantKeys[k])) { hasRelevant = true; break; }
      }
      if (!hasRelevant) return;

      // Check if there's a prewidget container on this page — if so, don't auto-create
      // (the prewidget search bar will handle things)
      var hasPrewidgetContainer = !!document.getElementById('sribooking-prewidget');

      var foundAndPatched = false;

      // Wait for DOM to be ready, then find and patch iframes
      function patchIframes() {
        var iframes = document.querySelectorAll('iframe');
        for (var i = 0; i < iframes.length; i++) {
          var src = iframes[i].src || '';
          // Only patch iframes pointing to our widget
          if (src.indexOf('/book-new') !== -1 || src.indexOf('/book?') !== -1 || src.indexOf('sribooking') !== -1) {
            try {
              var iframeUrl = new URL(src);
              var patched = false;
              for (var j = 0; j < relevantKeys.length; j++) {
                var val = currentParams.get(relevantKeys[j]);
                if (val && !iframeUrl.searchParams.get(relevantKeys[j])) {
                  iframeUrl.searchParams.set(relevantKeys[j], val);
                  patched = true;
                }
              }
              if (patched) {
                iframes[i].src = iframeUrl.toString();
              }
              foundAndPatched = true;
            } catch (e) {}
          }
        }
        return foundAndPatched;
      }

      // Auto-create iframe if none found (so partner only needs ONE script tag)
      function createIframeIfNeeded() {
        if (foundAndPatched) return;
        if (hasPrewidgetContainer) return; // Don't create on homepage
        // Check again for iframes (might have been added dynamically)
        if (patchIframes()) return;

        // No SriBooking iframe found — create one with all params
        var widgetUrl = widgetBaseUrl + '/book-new';
        var url = new URL(widgetUrl);
        for (var j = 0; j < relevantKeys.length; j++) {
          var val = currentParams.get(relevantKeys[j]);
          if (val) url.searchParams.set(relevantKeys[j], val);
        }

        var iframeId = 'sribooking-widget-auto';
        var iframe = document.createElement('iframe');
        iframe.id = iframeId;
        iframe.src = url.toString();
        iframe.style.cssText = 'width:100%;min-height:calc(100dvh - 200px);border:0;display:block;transition:height 0.2s ease;';
        iframe.setAttribute('allow', 'payment');
        iframe.setAttribute('title', 'SriBooking');

        // Try to find a main content area, otherwise append to body
        var target = document.querySelector('main') || document.querySelector('[role="main"]') || document.querySelector('.page-content') || document.querySelector('#content') || document.body;
        target.appendChild(iframe);

        // Auto-resize listener
        window.addEventListener('message', function(e) {
          if (!e || !e.data || e.data.type !== 'sribooking-resize') return;
          if (e.source !== iframe.contentWindow) return;
          var h = Number(e.data.height);
          if (!isFinite(h) || h <= 0) return;
          iframe.style.height = Math.max(400, Math.round(h)) + 'px';
        });
        iframe.addEventListener('load', function() {
          try { iframe.contentWindow.postMessage({ type: 'sribooking-request-resize' }, '*'); } catch(e){}
          setTimeout(function(){ try { iframe.contentWindow.postMessage({ type: 'sribooking-request-resize' }, '*'); } catch(e){} }, 500);
        });
      }

      // Patch on DOMContentLoaded and also after a delay (for dynamically injected iframes)
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          patchIframes();
          setTimeout(createIframeIfNeeded, 500);
        });
      } else {
        patchIframes();
      }
      // Also retry after delays for JS-rendered pages (Vue, React, Astro, etc.)
      setTimeout(function() { patchIframes(); }, 500);
      setTimeout(function() { patchIframes(); }, 1000);
      setTimeout(function() { patchIframes(); }, 1500);
      setTimeout(function() { patchIframes(); }, 2500);
      // Final attempt: if no iframe found after 3s, create one
      setTimeout(createIframeIfNeeded, 3000);
    } catch (e) {}
  })();

  // Also listen for postMessage param requests from the iframe (dual-channel)
  // AND proactively broadcast params to iframes on load
  var __srb_getPageParams = function() {
    var searchStr = window.location.search;
    if (!searchStr || searchStr.length < 2) {
      try { searchStr = window.top.location.search; } catch(e) {}
    }
    if (!searchStr || searchStr.length < 2) {
      try { searchStr = window.parent.location.search; } catch(e) {}
    }
    // Fallback: read from cookie
    if (!searchStr || searchStr.length < 2) {
      try {
        var cookies = document.cookie.split(';');
        for (var ci = 0; ci < cookies.length; ci++) {
          var c = cookies[ci].trim();
          if (c.indexOf('sribooking_params=') === 0) {
            searchStr = '?' + decodeURIComponent(c.substring('sribooking_params='.length));
            break;
          }
        }
      } catch(e) {}
    }
    if (!searchStr || searchStr.length < 2) return null;
    var params = {};
    var qs = searchStr.substring(1).split('&');
    for (var i = 0; i < qs.length; i++) {
      var pair = qs[i].split('=');
      if (pair[0]) params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return params;
  };

  try {
    window.addEventListener('message', function(e) {
      if (!e || !e.data || e.data.type !== 'sribooking-request-params') return;
      try {
        var params = __srb_getPageParams() || {};
        e.source.postMessage({ type: 'sribooking-params', params: params }, '*');
      } catch (ex) {}
    });
  } catch (e) {}

  // Proactively broadcast params to any sribooking iframes after they load
  function proactiveBroadcast() {
    var params = __srb_getPageParams();
    if (!params || (!params.from && !params.to && !params.depart)) return;
    var iframes = document.querySelectorAll('iframe');
    for (var i = 0; i < iframes.length; i++) {
      var src = iframes[i].src || '';
      if (src.indexOf('book-new') !== -1 || src.indexOf('sribooking') !== -1) {
        try {
          iframes[i].contentWindow.postMessage({ type: 'sribooking-params', params: params }, '*');
        } catch(e) {}
      }
    }
  }
  // Broadcast after delays to catch iframes that load asynchronously
  setTimeout(proactiveBroadcast, 1000);
  setTimeout(proactiveBroadcast, 2000);
  setTimeout(proactiveBroadcast, 4000);
  setTimeout(proactiveBroadcast, 6000);

  // Find the container
  var container = document.getElementById('sribooking-prewidget');
  if (!container) {
    // No pre-widget on this page (might be the /booking page) — that's fine, 
    // the auto-patch and postMessage listener above still work
    return;
  }

  // Read config from data attributes
  var widgetKey = container.getAttribute('data-key');
  var redirectPath = container.getAttribute('data-redirect') || '/booking';
  var lang = container.getAttribute('data-lang') || 'en';
  var theme = container.getAttribute('data-theme') || 'light';
  var primaryColor = container.getAttribute('data-primary-color') || '#1B5E3B';
  var logoUrl = container.getAttribute('data-logo') || '';
  var tagline = container.getAttribute('data-tagline') || '';

  if (!widgetKey) {
    container.innerHTML = '<p style="color:red;">Missing data-key attribute</p>';
    return;
  }

  // Translations - same as widget
  var translations = {
    en: { 
      bookTickets: 'bookTickets',
      sharedBoat: 'Shared Boat',
      privateBoat: 'Private Boat',
      oneWay: 'One Way',
      roundTrip: 'Round Trip',
      selectVoyage: 'Select Voyage',
      from: 'From',
      to: 'To',
      selectOrigin: 'Select origin',
      selectDestination: 'Select destination',
      dates: 'Dates',
      departureDate: 'Departure Date',
      returnDate: 'Return Date',
      selectDate: 'Select Date',
      adultAge: 'Adult',
      child: 'Child',
      infantAge: 'Infant',
      searchTrips: 'Search Trips',
      loading: 'Loading...',
      poweredBy: 'By'
    },
    fr: { 
      bookTickets: 'Réserver',
      sharedBoat: 'Bateau Partagé',
      privateBoat: 'Bateau Privé',
      oneWay: 'Aller Simple',
      roundTrip: 'Aller-Retour',
      selectVoyage: 'Sélectionner',
      from: 'De',
      to: 'Vers',
      selectOrigin: 'Origine',
      selectDestination: 'Destination',
      dates: 'Dates',
      departureDate: 'Date Départ',
      returnDate: 'Date Retour',
      selectDate: 'Choisir',
      adultAge: 'Adulte',
      child: 'Enfant',
      infantAge: 'Bébé',
      searchTrips: 'Rechercher',
      loading: 'Chargement...',
      poweredBy: 'Par'
    },
    id: { 
      bookTickets: 'Pesan Tiket',
      sharedBoat: 'Kapal Bersama',
      privateBoat: 'Kapal Pribadi',
      oneWay: 'Sekali Jalan',
      roundTrip: 'Pulang Pergi',
      selectVoyage: 'Pilih',
      from: 'Dari',
      to: 'Ke',
      selectOrigin: 'Pilih asal',
      selectDestination: 'Pilih tujuan',
      dates: 'Tanggal',
      departureDate: 'Tanggal Berangkat',
      returnDate: 'Tanggal Kembali',
      selectDate: 'Pilih Tanggal',
      adultAge: 'Dewasa',
      child: 'Anak',
      infantAge: 'Bayi',
      searchTrips: 'Cari Perjalanan',
      loading: 'Memuat...',
      poweredBy: 'Oleh'
    },
  };
  var t = translations[lang] || translations.en;

  // Day names for calendar
  var dayNames = {
    en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    fr: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
    id: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
  };
  var monthNames = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  };
  var monthNamesShort = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  };

  // State
  var state = {
    ports: [],
    routes: [],
    privateBoats: [],
    serviceType: 'public-ferry', // 'public-ferry' | 'private-boat'
    tripType: 'oneway', // 'oneway' | 'roundtrip'
    from: '',
    to: '',
    departDate: '',
    returnDate: '',
    adults: 1,
    children: 0,
    infants: 0,
    loading: true,
    error: null,
    // Calendar state - separate for departure and return
    departCalendarOpen: false,
    returnCalendarOpen: false,
    departCalendarViewDate: new Date(),
    returnCalendarViewDate: new Date(),
    // Private boat state
    selectedBoatId: '',
    selectedRouteId: '',
    privateDate: '',
    privateTime: '',
    privatePax: 1,
    privateDateCalendarOpen: false,
    privateDateCalendarViewDate: new Date()
  };

  // Supabase Edge Function URL (hardcoded to avoid CORS issues)
  var SUPABASE_URL = 'https://lefmdwcvddkrksggwnad.supabase.co';

  // Check if dark theme
  var isDark = theme === 'dark';
  var bgColor = isDark ? '#1f2937' : '#ffffff';
  var textColor = isDark ? '#f9fafb' : '#1f2937';
  var mutedColor = isDark ? '#9ca3af' : '#6b7280';
  var borderColor = isDark ? '#374151' : '#e5e7eb';
  var inputBg = isDark ? '#374151' : '#ffffff';
  var fieldBorderColor = isDark ? '#4b5563' : '#e5e7eb';

  // Inject scoped styles (matching WidgetSearchForm exactly)
  var styleId = 'srb-prewidget-styles';
  if (!document.getElementById(styleId)) {
    var styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      .srb-pw {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: transparent;
        max-width: 100%;
      }
      .srb-pw * { box-sizing: border-box; margin: 0; padding: 0; }
      
      .srb-pw-card {
        background: ${bgColor};
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
        overflow: hidden;
      }
      
      /* Header with primary color */
      .srb-pw-header {
        padding: 12px 16px;
        color: white;
      }
      @media (min-width: 640px) {
        .srb-pw-header { padding: 16px 24px; }
      }
      .srb-pw-header h2 {
        font-size: 16px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
      }
      @media (min-width: 640px) {
        .srb-pw-header h2 { font-size: 20px; gap: 8px; }
      }
      .srb-pw-header-tagline {
        font-style: italic;
        opacity: 0.9;
        font-weight: 400;
        font-size: 14px;
      }
      @media (min-width: 640px) {
        .srb-pw-header-tagline { font-size: 16px; }
      }
      
      /* Body */
      .srb-pw-body {
        padding: 16px;
        color: ${textColor};
        position: relative;
      }
      @media (min-width: 640px) {
        .srb-pw-body { padding: 24px; }
      }
      
      /* Trip type toggle (pill buttons) */
      .srb-pw-trip-toggle {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
      }
      @media (min-width: 640px) {
        .srb-pw-trip-toggle { gap: 16px; margin-bottom: 24px; }
      }
      .srb-pw-trip-btn {
        padding: 8px 16px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 500;
        border: 1px solid ${borderColor};
        background: ${bgColor};
        color: ${mutedColor};
        cursor: pointer;
        transition: all 0.2s;
      }
      @media (min-width: 640px) {
        .srb-pw-trip-btn { padding: 8px 24px; font-size: 14px; }
      }
      .srb-pw-trip-btn:hover {
        background: ${isDark ? '#374151' : '#f9fafb'};
      }
      .srb-pw-trip-btn.active-oneway {
        background: ${isDark ? '#374151' : '#f3f4f6'};
        border-color: ${isDark ? '#4b5563' : '#d1d5db'};
        color: ${textColor};
      }
      .srb-pw-trip-btn.active-round {
        color: white;
        border: none;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      }
      .srb-pw-trip-info {
        display: none;
        font-size: 14px;
        color: ${mutedColor};
        align-items: center;
        gap: 4px;
      }
      @media (min-width: 640px) {
        .srb-pw-trip-info { display: flex; }
      }
      .srb-pw-trip-info-icon {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 1px solid ${borderColor};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
      }
      
      /* Field grid */
      .srb-pw-fields-row {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        margin-bottom: 12px;
      }
      @media (min-width: 640px) {
        .srb-pw-fields-row { grid-template-columns: repeat(2, 1fr); }
      }
      @media (min-width: 768px) {
        .srb-pw-fields-row { gap: 16px; margin-bottom: 16px; }
      }
      
      /* Field wrapper (icon + label + input) */
      .srb-pw-field {
        border: 1px solid ${fieldBorderColor};
        border-radius: 8px;
        background: ${inputBg};
        transition: border-color 0.2s;
        position: relative;
      }
      .srb-pw-field:hover {
        border-color: ${isDark ? '#6b7280' : '#9ca3af'};
      }
      .srb-pw-field-inner {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
      }
      .srb-pw-field-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-top: 4px;
      }
      .srb-pw-field-icon svg {
        width: 100%;
        height: 100%;
      }
      .srb-pw-field-content {
        flex: 1;
        min-width: 0;
      }
      .srb-pw-field-label {
        display: block;
        font-size: 11px;
        color: ${mutedColor};
        margin-bottom: 2px;
      }
      .srb-pw-field select {
        width: 100%;
        background: transparent;
        border: none;
        color: ${textColor};
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
      }
      .srb-pw-field select:disabled {
        color: ${mutedColor};
        cursor: not-allowed;
      }
      
      /* Date field button (clickable) */
      .srb-pw-date-btn {
        width: 100%;
        background: transparent;
        border: none;
        color: ${textColor};
        font-weight: 500;
        font-size: 14px;
        cursor: pointer;
        outline: none;
        text-align: left;
        padding: 0;
      }
      .srb-pw-date-btn.placeholder {
        color: ${mutedColor};
      }
      
      /* Calendar Dropdown - positioned via JS */
      .srb-pw-calendar-dropdown {
        position: absolute;
        z-index: 1000;
        background: ${bgColor};
        border: 1px solid ${borderColor};
        border-radius: 8px;
        box-shadow: 0 -10px 25px rgba(0,0,0,0.15), 0 10px 25px rgba(0,0,0,0.15);
        padding: 12px;
        width: 300px;
        max-width: calc(100% - 32px);
      }
      
      .srb-pw-calendar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .srb-pw-calendar-title {
        font-weight: 600;
        font-size: 14px;
        color: ${textColor};
      }
      .srb-pw-calendar-nav {
        display: flex;
        gap: 4px;
      }
      .srb-pw-calendar-nav-btn {
        width: 28px;
        height: 28px;
        border: 1px solid ${borderColor};
        background: transparent;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${mutedColor};
        transition: all 0.15s;
      }
      .srb-pw-calendar-nav-btn:hover {
        background: ${isDark ? '#374151' : '#f3f4f6'};
        color: ${textColor};
      }
      
      .srb-pw-calendar-weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        margin-bottom: 4px;
      }
      .srb-pw-calendar-weekday {
        text-align: center;
        font-size: 11px;
        font-weight: 500;
        color: ${mutedColor};
        padding: 4px 0;
      }
      
      .srb-pw-calendar-days {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
      }
      .srb-pw-calendar-day {
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 400;
        color: ${textColor};
        transition: all 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .srb-pw-calendar-day:hover:not(:disabled):not(.selected):not(.in-range) {
        background: ${isDark ? '#374151' : '#f3f4f6'};
      }
      .srb-pw-calendar-day.outside {
        color: ${isDark ? '#4b5563' : '#d1d5db'};
      }
      .srb-pw-calendar-day.today {
        background: ${isDark ? '#374151' : '#f3f4f6'};
        font-weight: 600;
      }
      .srb-pw-calendar-day.selected {
        color: white;
        font-weight: 600;
      }
      .srb-pw-calendar-day.in-range {
        background: ${isDark ? '#374151' : '#e5e7eb'};
      }
      .srb-pw-calendar-day.range-start {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }
      .srb-pw-calendar-day.range-end {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }
      .srb-pw-calendar-day:disabled {
        color: ${isDark ? '#4b5563' : '#d1d5db'};
        cursor: not-allowed;
      }
      
      /* Calendar backdrop for mobile */
      .srb-pw-calendar-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999;
      }
      
      /* Passengers row */
      .srb-pw-pax-row {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        margin-bottom: 16px;
      }
      @media (min-width: 640px) {
        .srb-pw-pax-row { grid-template-columns: repeat(3, 1fr); }
      }
      @media (min-width: 768px) {
        .srb-pw-pax-row { grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
      }
      
      /* Search button */
      .srb-pw-search-btn {
        grid-column: span 3;
        min-height: 50px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        font-size: 16px;
        border: none;
        cursor: pointer;
        transition: opacity 0.2s;
        background: #374151;
      }
      @media (min-width: 768px) {
        .srb-pw-search-btn { grid-column: span 1; min-height: 60px; font-size: 18px; }
      }
      .srb-pw-search-btn:hover:not(:disabled) {
        opacity: 0.9;
      }
      .srb-pw-search-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      /* Branding */
      .srb-pw-branding {
        text-align: center;
        padding-top: 8px;
        font-size: 12px;
        color: ${isDark ? '#6b7280' : '#9ca3af'};
      }
      .srb-pw-branding a {
        text-decoration: none;
      }
      .srb-pw-branding a:hover {
        text-decoration: underline;
      }
      
      /* Loading / Error */
      .srb-pw-loading {
        text-align: center;
        padding: 60px 20px;
        color: ${mutedColor};
        font-size: 14px;
      }
      .srb-pw-error {
        color: #ef4444;
        font-size: 13px;
        margin-bottom: 12px;
        padding: 12px;
        background: ${isDark ? '#7f1d1d' : '#fef2f2'};
        border-radius: 8px;
      }

      /* Service type tabs */
      .srb-pw-service-tabs {
        display: flex;
        gap: 2px;
        padding: 4px;
        background: ${isDark ? '#374151' : '#f3f4f6'};
        border-radius: 8px;
        margin-bottom: 16px;
      }
      .srb-pw-service-tab {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px 12px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
        background: transparent;
        color: ${isDark ? '#9ca3af' : '#6b7280'};
      }
      .srb-pw-service-tab:hover:not(.active):not(:disabled) {
        color: ${textColor};
      }
      .srb-pw-service-tab:disabled {
        color: ${isDark ? '#4b5563' : '#d1d5db'};
        cursor: not-allowed;
      }
      .srb-pw-service-tab.active-ferry {
        background: ${isDark ? '#1f2937' : '#ffffff'};
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .srb-pw-service-tab.active-private {
        background: #d97706;
        color: #ffffff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .srb-pw-service-tab svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
      
      /* Private boat cards */
      .srb-pw-boat-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        margin-bottom: 16px;
      }
      @media (min-width: 640px) {
        .srb-pw-boat-grid { grid-template-columns: repeat(2, 1fr); }
      }
      .srb-pw-boat-card {
        padding: 12px;
        border: 2px solid ${fieldBorderColor};
        border-radius: 8px;
        background: ${inputBg};
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
      }
      .srb-pw-boat-card:hover {
        border-color: #d97706;
      }
      .srb-pw-boat-card.selected {
        border-color: #d97706;
        background: ${isDark ? '#451a03' : '#fffbeb'};
      }
      .srb-pw-boat-img {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        object-fit: cover;
        flex-shrink: 0;
      }
      .srb-pw-boat-placeholder {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        background: ${isDark ? '#374151' : '#f3f4f6'};
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: ${mutedColor};
      }
      .srb-pw-boat-name {
        font-weight: 600;
        font-size: 14px;
        color: ${textColor};
      }
      .srb-pw-boat-pax {
        font-size: 12px;
        color: ${mutedColor};
      }
      
      /* Price summary bar */
      .srb-pw-price-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: ${isDark ? '#451a03' : '#fffbeb'};
        border: 1px solid ${isDark ? '#92400e' : '#fde68a'};
        border-radius: 8px;
        margin-top: 16px;
      }
      .srb-pw-price-label {
        font-size: 13px;
        color: ${mutedColor};
      }
      .srb-pw-price-amount {
        font-size: 22px;
        font-weight: 700;
        color: ${isDark ? '#fbbf24' : '#b45309'};
      }
      .srb-pw-book-btn {
        padding: 10px 28px;
        border-radius: 8px;
        background: #d97706;
        color: white;
        font-weight: 600;
        font-size: 15px;
        border: none;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .srb-pw-book-btn:hover:not(:disabled) {
        opacity: 0.9;
      }
      .srb-pw-book-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // SVG Icons (inline)
  var icons = {
    ship: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"></path><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"></path><path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"></path><path d="M12 10v-4"></path></svg>',
    anchor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"></circle><line x1="12" y1="22" x2="12" y2="8"></line><path d="M5 12H2a10 10 0 0 0 20 0h-3"></path></svg>',
    mapPin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    baby: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h.01"></path><path d="M15 12h.01"></path><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"></path><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"></path></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15,18 9,12 15,6"></polyline></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,18 15,12 9,6"></polyline></svg>',
  };

  // Date helpers
  function formatDisplayDate(dateStr) {
    if (!dateStr) return t.selectDate;
    var d = new Date(dateStr + 'T00:00:00');
    var months = monthNamesShort[lang] || monthNamesShort.en;
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  // Format departure date label
  function formatDepartDateLabel() {
    if (!state.departDate) return t.selectDate;
    return formatDisplayDate(state.departDate);
  }

  // Format return date label
  function formatReturnDateLabel() {
    if (!state.returnDate) return t.selectDate;
    return formatDisplayDate(state.returnDate);
  }

  function formatISODate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function getCalendarDays(year, month) {
    var firstDay = new Date(year, month, 1);
    var lastDay = new Date(year, month + 1, 0);
    var startWeekDay = firstDay.getDay();
    
    var days = [];
    
    // Previous month days
    var prevMonth = new Date(year, month, 0);
    for (var i = startWeekDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        outside: true
      });
    }
    
    // Current month days
    for (var d = 1; d <= lastDay.getDate(); d++) {
      days.push({
        date: new Date(year, month, d),
        outside: false
      });
    }
    
    // Next month days to fill grid (6 rows)
    var remaining = 42 - days.length;
    for (var n = 1; n <= remaining; n++) {
      days.push({
        date: new Date(year, month + 1, n),
        outside: true
      });
    }
    
    return days;
  }

  function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  function isToday(date) {
    return isSameDay(date, new Date());
  }

  function isDateDisabled(date) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  function isDateInRange(date, startDate, endDate) {
    if (!startDate || !endDate) return false;
    var start = new Date(startDate + 'T00:00:00');
    var end = new Date(endDate + 'T00:00:00');
    return date > start && date < end;
  }

  function isRangeStart(date, startDate) {
    if (!startDate) return false;
    var start = new Date(startDate + 'T00:00:00');
    return isSameDay(date, start);
  }

  function isRangeEnd(date, endDate) {
    if (!endDate) return false;
    var end = new Date(endDate + 'T00:00:00');
    return isSameDay(date, end);
  }

  // Build calendar HTML for a specific target ('depart', 'return', or 'private')
  function buildCalendarHTML(target) {
    var viewDate = target === 'return' ? state.returnCalendarViewDate 
      : target === 'private' ? state.privateDateCalendarViewDate 
      : state.departCalendarViewDate;
    var year = viewDate.getFullYear();
    var month = viewDate.getMonth();
    var months = monthNames[lang] || monthNames.en;
    var days = dayNames[lang] || dayNames.en;
    var calendarDays = getCalendarDays(year, month);
    
    var selectedDate = target === 'return' 
      ? (state.returnDate ? new Date(state.returnDate + 'T00:00:00') : null)
      : target === 'private'
      ? (state.privateDate ? new Date(state.privateDate + 'T00:00:00') : null)
      : (state.departDate ? new Date(state.departDate + 'T00:00:00') : null);
    
    var html = '<div class="srb-pw-calendar-header">' +
      '<span class="srb-pw-calendar-title">' + months[month] + ' ' + year + '</span>' +
      '<div class="srb-pw-calendar-nav">' +
        '<button type="button" class="srb-pw-calendar-nav-btn" data-action="prev" data-target="' + target + '">' + icons.chevronLeft + '</button>' +
        '<button type="button" class="srb-pw-calendar-nav-btn" data-action="next" data-target="' + target + '">' + icons.chevronRight + '</button>' +
      '</div>' +
    '</div>';
    
    html += '<div class="srb-pw-calendar-weekdays">';
    for (var i = 0; i < days.length; i++) {
      html += '<div class="srb-pw-calendar-weekday">' + days[i] + '</div>';
    }
    html += '</div>';
    
    // Determine min date for return calendar
    var minDisableDate = new Date();
    minDisableDate.setHours(0, 0, 0, 0);
    if (target === 'return' && state.departDate) {
      minDisableDate = new Date(state.departDate + 'T00:00:00');
    }
    
    html += '<div class="srb-pw-calendar-days">';
    for (var j = 0; j < calendarDays.length; j++) {
      var dayInfo = calendarDays[j];
      var dayDate = dayInfo.date;
      var dateStr = formatISODate(dayDate);
      var disabled = dayDate < minDisableDate || dayInfo.outside;
      
      var isSelected = selectedDate && isSameDay(dayDate, selectedDate);
      var isTodayDay = isToday(dayDate);
      
      var classes = 'srb-pw-calendar-day';
      if (dayInfo.outside) classes += ' outside';
      if (isTodayDay && !dayInfo.outside) classes += ' today';
      if (isSelected) classes += ' selected';
      
      var style = '';
      if (isSelected) {
        style = 'background-color: ' + primaryColor + ';';
      }
      
      html += '<button type="button" class="' + classes + '" data-date="' + dateStr + '" data-target="' + target + '" ' +
        (disabled ? 'disabled' : '') + 
        (style ? ' style="' + style + '"' : '') + '>' + 
        dayDate.getDate() + '</button>';
    }
    html += '</div>';
    
    return html;
  }

  // Handle day selection - simple single mode
  function handleDayClick(dateStr, target) {
    if (target === 'private') {
      state.privateDate = dateStr;
      state.privateDateCalendarOpen = false;
    } else if (target === 'return') {
      state.returnDate = dateStr;
      state.returnCalendarOpen = false;
    } else {
      state.departDate = dateStr;
      state.departCalendarOpen = false;
      // If return date is before new departure, clear it
      if (state.returnDate && state.returnDate < dateStr) {
        state.returnDate = '';
      }
    }
    render();
  }

  // Helper: get selected boat object
  function getSelectedBoat() {
    if (!state.selectedBoatId) return null;
    return state.privateBoats.find(function(b) { return b.id === state.selectedBoatId; }) || null;
  }

  // Helper: get selected route object
  function getSelectedRoute() {
    var boat = getSelectedBoat();
    if (!boat || !state.selectedRouteId) return null;
    return (boat.routes || []).find(function(r) { return r.id === state.selectedRouteId; }) || null;
  }

  // Helper: generate time slots for a boat
  function getTimeSlots(boat) {
    if (!boat) return [];
    var minH = 7, maxH = 18;
    if (boat.min_departure_time) {
      var parts = boat.min_departure_time.split(':');
      minH = parseInt(parts[0], 10) || 7;
    }
    if (boat.max_departure_time) {
      var parts2 = boat.max_departure_time.split(':');
      maxH = parseInt(parts2[0], 10) || 18;
    }
    var slots = [];
    for (var h = minH; h <= maxH; h++) {
      slots.push(String(h).padStart(2, '0') + ':00');
      if (h < maxH) slots.push(String(h).padStart(2, '0') + ':30');
    }
    return slots;
  }

  // Helper: format price
  function formatPrice(amount, currency) {
    currency = currency || 'IDR';
    if (currency === 'IDR') {
      return 'Rp ' + Number(amount).toLocaleString('id-ID');
    }
    return currency + ' ' + Number(amount).toLocaleString();
  }

  // Render function
  function render() {
    if (state.loading) {
      container.innerHTML = '<div class="srb-pw"><div class="srb-pw-card"><div class="srb-pw-loading">' + t.loading + '</div></div></div>';
      return;
    }

    if (state.error) {
      container.innerHTML = '<div class="srb-pw"><div class="srb-pw-card"><div class="srb-pw-body"><div class="srb-pw-error">' + state.error + '</div></div></div></div>';
      return;
    }

    var hasPrivateBoats = state.privateBoats.length > 0;
    var hasPublicFerry = state.ports.length > 0;
    var isPublicFerry = state.serviceType === 'public-ferry';
    var isRoundTrip = state.tripType === 'roundtrip';

    // Build port options for public ferry
    var fromOptions = '<option value="">' + t.selectOrigin + '</option>';
    var toOptions = '<option value="">' + t.selectDestination + '</option>';
    
    var origins = [];
    var originsSet = {};
    state.routes.forEach(function(r) {
      if (!originsSet[r.from]) {
        originsSet[r.from] = true;
        origins.push(r.from);
      }
    });

    origins.forEach(function(portId) {
      var port = state.ports.find(function(p) { return p.id === portId; });
      if (port) {
        var selected = state.from === portId ? ' selected' : '';
        fromOptions += '<option value="' + portId + '"' + selected + '>' + port.name + '</option>';
      }
    });

    if (state.from) {
      var dests = [];
      var destsSet = {};
      state.routes.forEach(function(r) {
        if (r.from === state.from && !destsSet[r.to]) {
          destsSet[r.to] = true;
          dests.push(r.to);
        }
      });
      dests.forEach(function(portId) {
        var port = state.ports.find(function(p) { return p.id === portId; });
        if (port) {
          var selected = state.to === portId ? ' selected' : '';
          toOptions += '<option value="' + portId + '"' + selected + '>' + port.name + '</option>';
        }
      });
    }

    // Build passenger options
    var adultOptions = '';
    for (var a = 1; a <= 10; a++) {
      adultOptions += '<option value="' + a + '"' + (state.adults === a ? ' selected' : '') + '>' + a + '</option>';
    }
    var childOptions = '';
    for (var c = 0; c <= 10; c++) {
      childOptions += '<option value="' + c + '"' + (state.children === c ? ' selected' : '') + '>' + c + '</option>';
    }
    var infantOptions = '';
    for (var inf = 0; inf <= 5; inf++) {
      infantOptions += '<option value="' + inf + '"' + (state.infants === inf ? ' selected' : '') + '>' + inf + '</option>';
    }

    // Service type tabs HTML (only show if private boats exist)
    var serviceTabsHTML = '';
    if (hasPrivateBoats) {
      serviceTabsHTML = '<div class="srb-pw-service-tabs">' +
        '<button type="button" class="srb-pw-service-tab' + (isPublicFerry ? ' active-ferry' : '') + '" data-service="public-ferry"' + (!hasPublicFerry ? ' disabled' : '') + ' style="' + (isPublicFerry ? 'color: ' + primaryColor + ';' : '') + '">' +
          icons.ship + '<span>' + t.sharedBoat + '</span>' +
        '</button>' +
        '<button type="button" class="srb-pw-service-tab' + (!isPublicFerry ? ' active-private' : '') + '" data-service="private-boat">' +
          icons.anchor + '<span>' + t.privateBoat + '</span>' +
        '</button>' +
      '</div>';
    }

    // Build private boat form HTML
    var privateBoatHTML = '';
    if (!isPublicFerry) {
      var selectedBoat = getSelectedBoat();
      var selectedRoute = getSelectedRoute();

      // Boat cards
      var boatCardsHTML = '<div class="srb-pw-boat-grid">';
      state.privateBoats.forEach(function(boat) {
        var isSelected = state.selectedBoatId === boat.id;
        var imgHTML = boat.image_url 
          ? '<img src="' + boat.image_url + '" alt="' + boat.name + '" class="srb-pw-boat-img"/>'
          : '<div class="srb-pw-boat-placeholder">' + icons.anchor + '</div>';
        boatCardsHTML += '<button type="button" class="srb-pw-boat-card' + (isSelected ? ' selected' : '') + '" data-boat="' + boat.id + '">' +
          imgHTML +
          '<div><div class="srb-pw-boat-name">' + boat.name + '</div>' +
          '<div class="srb-pw-boat-pax">' + (boat.min_capacity || 1) + '-' + (boat.max_capacity || boat.capacity) + ' pax</div></div>' +
        '</button>';
      });
      boatCardsHTML += '</div>';

      // Route + Date + Time + Passengers (only if boat selected)
      var boatFieldsHTML = '';
      if (selectedBoat) {
        // Route select
        var routeOptions = '<option value="">' + t.selectDestination + '</option>';
        (selectedBoat.routes || []).forEach(function(r) {
          var fromName = r.from_port ? r.from_port.name : '';
          var toName = r.to_port ? r.to_port.name : '';
          var label = fromName + ' → ' + toName + ' - ' + formatPrice(r.price, r.currency);
          var sel = state.selectedRouteId === r.id ? ' selected' : '';
          routeOptions += '<option value="' + r.id + '"' + sel + '>' + label + '</option>';
        });

        // Time select
        var timeSlots = getTimeSlots(selectedBoat);
        var timeOptions = '<option value="">Select time</option>';
        timeSlots.forEach(function(slot) {
          var sel = state.privateTime === slot ? ' selected' : '';
          timeOptions += '<option value="' + slot + '"' + sel + '>' + slot + '</option>';
        });

        // Pax select
        var minPax = selectedBoat.min_capacity || 1;
        var maxPax = selectedBoat.max_capacity || selectedBoat.capacity || 10;
        var paxOptions = '';
        for (var p = minPax; p <= maxPax; p++) {
          paxOptions += '<option value="' + p + '"' + (state.privatePax === p ? ' selected' : '') + '>' + p + ' pax</option>';
        }

        boatFieldsHTML = 
          '<div class="srb-pw-fields-row">' +
            '<div class="srb-pw-field" style="grid-column: span 2;">' +
              '<div class="srb-pw-field-inner">' +
                '<div class="srb-pw-field-icon" style="color: #d97706;">' + icons.mapPin + '</div>' +
                '<div class="srb-pw-field-content">' +
                  '<label class="srb-pw-field-label">Route</label>' +
                  '<select id="srb-private-route">' + routeOptions + '</select>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="srb-pw-fields-row" style="grid-template-columns: repeat(3, 1fr);">' +
            '<div class="srb-pw-field" id="srb-private-date-field">' +
              '<div class="srb-pw-field-inner">' +
                '<div class="srb-pw-field-icon" style="color: #d97706;">' + icons.calendar + '</div>' +
                '<div class="srb-pw-field-content">' +
                  '<label class="srb-pw-field-label">Date</label>' +
                  '<button type="button" class="srb-pw-date-btn' + (!state.privateDate ? ' placeholder' : '') + '" id="srb-private-date-btn">' +
                    (state.privateDate ? formatDisplayDate(state.privateDate) : t.selectDate) +
                  '</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="srb-pw-field">' +
              '<div class="srb-pw-field-inner">' +
                '<div class="srb-pw-field-icon" style="color: #d97706;">' + icons.clock + '</div>' +
                '<div class="srb-pw-field-content">' +
                  '<label class="srb-pw-field-label">Time</label>' +
                  '<select id="srb-private-time">' + timeOptions + '</select>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="srb-pw-field">' +
              '<div class="srb-pw-field-inner">' +
                '<div class="srb-pw-field-icon" style="color: #d97706;">' + icons.users + '</div>' +
                '<div class="srb-pw-field-content">' +
                  '<label class="srb-pw-field-label">Passengers</label>' +
                  '<select id="srb-private-pax">' + paxOptions + '</select>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          (state.privateDateCalendarOpen ? '<div class="srb-pw-calendar-dropdown" id="srb-private-calendar">' + buildCalendarHTML('private') + '</div>' : '');

        // Price bar + Book button
        if (selectedRoute) {
          boatFieldsHTML += '<div class="srb-pw-price-bar">' +
            '<div><div class="srb-pw-price-label">Charter Price</div>' +
            '<div class="srb-pw-price-amount">' + formatPrice(selectedRoute.price, selectedRoute.currency) + '</div></div>' +
            '<button type="button" class="srb-pw-book-btn" id="srb-private-search">Book Now</button>' +
          '</div>';
        }
      }

      privateBoatHTML = boatCardsHTML + boatFieldsHTML;
    }

    // Build public ferry form HTML
    var publicFerryHTML = '';
    if (isPublicFerry) {
      publicFerryHTML = 
        '<div class="srb-pw-trip-toggle">' +
          '<button type="button" class="srb-pw-trip-btn' + (state.tripType === 'oneway' ? ' active-oneway' : '') + '" data-trip="oneway">' + t.oneWay + '</button>' +
          '<button type="button" class="srb-pw-trip-btn' + (state.tripType === 'roundtrip' ? ' active-round' : '') + '" data-trip="roundtrip" style="' + (state.tripType === 'roundtrip' ? 'background-color: ' + primaryColor + ';' : '') + '">' + t.roundTrip + '</button>' +
          '<span class="srb-pw-trip-info"><span class="srb-pw-trip-info-icon">i</span>' + t.selectVoyage + '</span>' +
        '</div>' +
        '<div class="srb-pw-fields-row">' +
          '<div class="srb-pw-field">' +
            '<div class="srb-pw-field-inner">' +
              '<div class="srb-pw-field-icon" style="color: ' + primaryColor + ';">' + icons.mapPin + '</div>' +
              '<div class="srb-pw-field-content">' +
                '<label class="srb-pw-field-label">' + t.from + '</label>' +
                '<select id="srb-from">' + fromOptions + '</select>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="srb-pw-field">' +
            '<div class="srb-pw-field-inner">' +
              '<div class="srb-pw-field-icon" style="color: ' + primaryColor + ';">' + icons.mapPin + '</div>' +
              '<div class="srb-pw-field-content">' +
                '<label class="srb-pw-field-label">' + t.to + '</label>' +
                '<select id="srb-to"' + (!state.from ? ' disabled' : '') + '>' + toOptions + '</select>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="srb-pw-fields-row" style="grid-template-columns: ' + (isRoundTrip ? 'repeat(2, 1fr)' : '1fr') + ';">' +
          '<div class="srb-pw-field" id="srb-depart-date-field">' +
            '<div class="srb-pw-field-inner">' +
              '<div class="srb-pw-field-icon" style="color: ' + primaryColor + ';">' + icons.calendar + '</div>' +
              '<div class="srb-pw-field-content">' +
                '<label class="srb-pw-field-label">' + t.departureDate + '</label>' +
                '<button type="button" class="srb-pw-date-btn' + (!state.departDate ? ' placeholder' : '') + '" id="srb-depart-date-btn">' + 
                  formatDepartDateLabel() + 
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          (isRoundTrip ? (
            '<div class="srb-pw-field" id="srb-return-date-field">' +
              '<div class="srb-pw-field-inner">' +
                '<div class="srb-pw-field-icon" style="color: ' + primaryColor + ';">' + icons.calendar + '</div>' +
                '<div class="srb-pw-field-content">' +
                  '<label class="srb-pw-field-label">' + t.returnDate + '</label>' +
                  '<button type="button" class="srb-pw-date-btn' + (!state.returnDate ? ' placeholder' : '') + '" id="srb-return-date-btn">' + 
                    formatReturnDateLabel() + 
                  '</button>' +
                '</div>' +
              '</div>' +
            '</div>'
          ) : '') +
        '</div>' +
        (state.departCalendarOpen ? '<div class="srb-pw-calendar-dropdown" id="srb-depart-calendar">' + buildCalendarHTML('depart') + '</div>' : '') +
        (state.returnCalendarOpen ? '<div class="srb-pw-calendar-dropdown" id="srb-return-calendar">' + buildCalendarHTML('return') + '</div>' : '') +
        '<div class="srb-pw-pax-row">' +
          '<div class="srb-pw-field">' +
            '<div class="srb-pw-field-inner">' +
              '<div class="srb-pw-field-icon" style="color: ' + primaryColor + ';">' + icons.users + '</div>' +
              '<div class="srb-pw-field-content">' +
                '<label class="srb-pw-field-label">' + t.adultAge + '</label>' +
                '<select id="srb-adults">' + adultOptions + '</select>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="srb-pw-field">' +
            '<div class="srb-pw-field-inner">' +
              '<div class="srb-pw-field-icon" style="color: ' + primaryColor + ';">' + icons.users + '</div>' +
              '<div class="srb-pw-field-content">' +
                '<label class="srb-pw-field-label">' + t.child + '</label>' +
                '<select id="srb-children">' + childOptions + '</select>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="srb-pw-field">' +
            '<div class="srb-pw-field-inner">' +
              '<div class="srb-pw-field-icon" style="color: ' + primaryColor + ';">' + icons.baby + '</div>' +
              '<div class="srb-pw-field-content">' +
                '<label class="srb-pw-field-label">' + t.infantAge + '</label>' +
                '<select id="srb-infants">' + infantOptions + '</select>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="srb-pw-search-btn" id="srb-search" style="background-color: ' + primaryColor + ';">' + t.searchTrips + '</button>' +
        '</div>';
    }

    var html = '<div class="srb-pw">' +
      '<div class="srb-pw-card">' +
        '<div class="srb-pw-header" style="background-color: ' + primaryColor + ';">' +
          '<h2>' +
            '<span>▸ ' + t.bookTickets + '</span>' +
            (tagline ? '<span class="srb-pw-header-tagline">' + tagline + '</span>' : '') +
          '</h2>' +
        '</div>' +
        '<div class="srb-pw-body">' +
          serviceTabsHTML +
          (isPublicFerry ? publicFerryHTML : privateBoatHTML) +
          '<div class="srb-pw-branding">' +
            t.poweredBy + ' <a href="https://sribooking.com" target="_blank" rel="noopener noreferrer" style="color: ' + primaryColor + ';">SriBooking.com</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    if (state.departCalendarOpen || state.returnCalendarOpen || state.privateDateCalendarOpen) {
      html = '<div class="srb-pw-calendar-backdrop" id="srb-backdrop"></div>' + html;
    }

    container.innerHTML = html;
    bindEvents();
    positionCalendars();
  }

  function positionCalendars() {
    positionCalendarFor('srb-depart-calendar', 'srb-depart-date-btn');
    positionCalendarFor('srb-return-calendar', 'srb-return-date-btn');
    positionCalendarFor('srb-private-calendar', 'srb-private-date-btn');
  }

  function positionCalendarFor(calendarId, btnId) {
    var calendar = document.getElementById(calendarId);
    if (!calendar) return;
    var btn = document.getElementById(btnId);
    var body = container.querySelector('.srb-pw-body');
    if (!btn || !body) return;
    var btnRect = btn.getBoundingClientRect();
    var bodyRect = body.getBoundingClientRect();
    var calWidth = 300;
    var calHeight = calendar.offsetHeight || 320;
    var btnCenterX = btnRect.left + btnRect.width / 2 - bodyRect.left;
    var left = btnCenterX - calWidth / 2;
    var padding = 16;
    var maxLeft = bodyRect.width - calWidth - padding;
    left = Math.max(padding, Math.min(left, maxLeft));
    var btnCenterY = btnRect.top + btnRect.height / 2 - bodyRect.top;
    var top = btnCenterY - calHeight / 2;
    var maxTop = bodyRect.height - calHeight - padding;
    top = Math.max(padding, Math.min(top, maxTop));
    calendar.style.left = left + 'px';
    calendar.style.top = top + 'px';
    calendar.style.bottom = 'auto';
  }

  // Bind events
  function bindEvents() {
    // Backdrop click to close calendars
    var backdrop = document.getElementById('srb-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', function() {
        state.departCalendarOpen = false;
        state.returnCalendarOpen = false;
        state.privateDateCalendarOpen = false;
        render();
      });
    }

    // Service type tabs
    var serviceTabs = container.querySelectorAll('.srb-pw-service-tab');
    serviceTabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var svc = this.getAttribute('data-service');
        if (svc && !this.disabled) {
          state.serviceType = svc;
          render();
        }
      });
    });

    // Boat cards
    var boatCards = container.querySelectorAll('.srb-pw-boat-card');
    boatCards.forEach(function(card) {
      card.addEventListener('click', function() {
        var boatId = this.getAttribute('data-boat');
        state.selectedBoatId = boatId;
        state.selectedRouteId = '';
        state.privateTime = '';
        // Set default pax to min_capacity
        var boat = getSelectedBoat();
        if (boat) state.privatePax = boat.min_capacity || 1;
        render();
      });
    });

    // Trip type toggle
    var tripBtns = container.querySelectorAll('.srb-pw-trip-btn');
    tripBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var newType = this.getAttribute('data-trip');
        state.tripType = newType;
        if (newType === 'oneway') {
          state.returnDate = '';
          state.returnCalendarOpen = false;
        }
        render();
      });
    });

    // From select
    var fromSelect = document.getElementById('srb-from');
    if (fromSelect) {
      fromSelect.addEventListener('change', function() {
        state.from = this.value;
        state.to = '';
        render();
      });
    }

    // To select
    var toSelect = document.getElementById('srb-to');
    if (toSelect) {
      toSelect.addEventListener('change', function() {
        state.to = this.value;
      });
    }

    // Departure date button
    var departBtn = document.getElementById('srb-depart-date-btn');
    if (departBtn) {
      departBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        state.returnCalendarOpen = false;
        state.departCalendarOpen = !state.departCalendarOpen;
        if (state.departCalendarOpen) {
          state.departCalendarViewDate = state.departDate ? new Date(state.departDate + 'T00:00:00') : new Date();
        }
        render();
      });
    }

    // Return date button
    var returnBtn = document.getElementById('srb-return-date-btn');
    if (returnBtn) {
      returnBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        state.departCalendarOpen = false;
        state.returnCalendarOpen = !state.returnCalendarOpen;
        if (state.returnCalendarOpen) {
          state.returnCalendarViewDate = state.returnDate 
            ? new Date(state.returnDate + 'T00:00:00') 
            : (state.departDate ? new Date(state.departDate + 'T00:00:00') : new Date());
        }
        render();
      });
    }

    // Calendar navigation
    var calNavBtns = container.querySelectorAll('.srb-pw-calendar-nav-btn');
    calNavBtns.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var action = this.getAttribute('data-action');
        var target = this.getAttribute('data-target');
        var key = target === 'return' ? 'returnCalendarViewDate' : target === 'private' ? 'privateDateCalendarViewDate' : 'departCalendarViewDate';
        var current = state[key];
        if (action === 'prev') {
          state[key] = new Date(current.getFullYear(), current.getMonth() - 1, 1);
        } else {
          state[key] = new Date(current.getFullYear(), current.getMonth() + 1, 1);
        }
        render();
      });
    });

    // Calendar day clicks
    var calDays = container.querySelectorAll('.srb-pw-calendar-day:not([disabled])');
    calDays.forEach(function(dayBtn) {
      dayBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var dateStr = this.getAttribute('data-date');
        var target = this.getAttribute('data-target');
        handleDayClick(dateStr, target);
      });
    });

    // Passengers
    var adultsSelect = document.getElementById('srb-adults');
    if (adultsSelect) {
      adultsSelect.addEventListener('change', function() {
        state.adults = parseInt(this.value, 10) || 1;
      });
    }

    var childrenSelect = document.getElementById('srb-children');
    if (childrenSelect) {
      childrenSelect.addEventListener('change', function() {
        state.children = parseInt(this.value, 10) || 0;
      });
    }

    var infantsSelect = document.getElementById('srb-infants');
    if (infantsSelect) {
      infantsSelect.addEventListener('change', function() {
        state.infants = parseInt(this.value, 10) || 0;
      });
    }

    // Search button (public ferry)
    var searchBtn = document.getElementById('srb-search');
    if (searchBtn) {
      searchBtn.addEventListener('click', handleSearch);
    }

    // Private boat fields
    var privateRouteSelect = document.getElementById('srb-private-route');
    if (privateRouteSelect) {
      privateRouteSelect.addEventListener('change', function() {
        state.selectedRouteId = this.value;
        render();
      });
    }

    var privateDateBtn = document.getElementById('srb-private-date-btn');
    if (privateDateBtn) {
      privateDateBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        state.departCalendarOpen = false;
        state.returnCalendarOpen = false;
        state.privateDateCalendarOpen = !state.privateDateCalendarOpen;
        if (state.privateDateCalendarOpen) {
          state.privateDateCalendarViewDate = state.privateDate ? new Date(state.privateDate + 'T00:00:00') : new Date();
        }
        render();
      });
    }

    var privateTimeSelect = document.getElementById('srb-private-time');
    if (privateTimeSelect) {
      privateTimeSelect.addEventListener('change', function() {
        state.privateTime = this.value;
      });
    }

    var privatePaxSelect = document.getElementById('srb-private-pax');
    if (privatePaxSelect) {
      privatePaxSelect.addEventListener('change', function() {
        state.privatePax = parseInt(this.value, 10) || 1;
      });
    }

    // Private boat search/book button
    var privateSearchBtn = document.getElementById('srb-private-search');
    if (privateSearchBtn) {
      privateSearchBtn.addEventListener('click', handlePrivateSearch);
    }
  }

  // Handle search
  function handleSearch() {
    // Validate
    if (!state.from) {
      alert(t.selectOrigin);
      return;
    }
    if (!state.to) {
      alert(t.selectDestination);
      return;
    }
    if (!state.departDate) {
      alert(t.selectDate);
      return;
    }
    if (state.tripType === 'roundtrip' && !state.returnDate) {
      alert(t.returnDate + ' is required');
      return;
    }

    // Build redirect URL
    var params = new URLSearchParams();
    params.set('key', widgetKey);
    params.set('from', state.from);
    params.set('to', state.to);
    params.set('depart', state.departDate);
    if (state.tripType === 'roundtrip' && state.returnDate) {
      params.set('return', state.returnDate);
    }
    params.set('ad', state.adults);
    params.set('ch', state.children);
    params.set('inf', state.infants);
    params.set('trip', state.tripType === 'roundtrip' ? 'round' : 'oneway');
    if (lang && lang !== 'en') {
      params.set('lang', lang);
    }

    // Store params in a cookie so the booking page can read them
    // (bypasses Hostinger/Zyro sandboxing where window.top.location.search is inaccessible)
    try {
      document.cookie = 'sribooking_params=' + encodeURIComponent(params.toString()) +
        ';path=/;max-age=300;SameSite=Lax';
    } catch(e) {}

    // Redirect to partner's booking page
    var redirectUrl;
    try {
      var topOrigin = window.top.location.origin;
      redirectUrl = topOrigin + redirectPath + '?' + params.toString();
      window.top.location.href = redirectUrl;
    } catch (e) {
      try {
        var parentOrigin = window.parent.location.origin;
        redirectUrl = parentOrigin + redirectPath + '?' + params.toString();
        window.parent.location.href = redirectUrl;
      } catch (e2) {
        // Can't navigate partner page — redirect directly to widget URL
        redirectUrl = widgetBaseUrl + '/book-new?' + params.toString();
        try { window.location.href = redirectUrl; } catch(e3) {}
        try { window.open(redirectUrl, '_top'); } catch(e4) {
          window.open(redirectUrl, '_blank');
        }
      }
    }
  }

  // Handle private boat search/book
  function handlePrivateSearch() {
    if (!state.selectedBoatId) { alert('Please select a boat'); return; }
    if (!state.selectedRouteId) { alert('Please select a route'); return; }
    if (!state.privateDate) { alert(t.selectDate); return; }
    if (!state.privateTime) { alert('Please select a time'); return; }

    var route = getSelectedRoute();
    var params = new URLSearchParams();
    params.set('key', widgetKey);
    params.set('service', 'private');
    params.set('boat', state.selectedBoatId);
    params.set('route', state.selectedRouteId);
    params.set('depart', state.privateDate);
    params.set('time', state.privateTime);
    params.set('pax', state.privatePax);
    if (lang && lang !== 'en') {
      params.set('lang', lang);
    }

    // Store params in cookie
    try {
      document.cookie = 'sribooking_params=' + encodeURIComponent(params.toString()) +
        ';path=/;max-age=300;SameSite=Lax';
    } catch(e) {}

    // Redirect to partner's booking page
    var redirectUrl;
    try {
      var topOrigin = window.top.location.origin;
      redirectUrl = topOrigin + redirectPath + '?' + params.toString();
      window.top.location.href = redirectUrl;
    } catch (e) {
      try {
        var parentOrigin = window.parent.location.origin;
        redirectUrl = parentOrigin + redirectPath + '?' + params.toString();
        window.parent.location.href = redirectUrl;
      } catch (e2) {
        redirectUrl = widgetBaseUrl + '/book-new?' + params.toString();
        try { window.location.href = redirectUrl; } catch(e3) {}
        try { window.open(redirectUrl, '_top'); } catch(e4) {
          window.open(redirectUrl, '_blank');
        }
      }
    }
  }

  // Fetch ports
  function fetchPorts() {
    var url = SUPABASE_URL + '/functions/v1/widget-ports?key=' + encodeURIComponent(widgetKey);
    
    fetch(url)
      .then(function(res) {
        if (!res.ok) throw new Error('Failed to load ports');
        return res.json();
      })
      .then(function(data) {
        state.ports = data.ports || [];
        state.routes = data.routes || [];
        state.privateBoats = data.private_boats || [];
        // If no public ferry routes but has private boats, default to private tab
        if (state.ports.length === 0 && state.privateBoats.length > 0) {
          state.serviceType = 'private-boat';
        }
        state.loading = false;
        render();
      })
      .catch(function(err) {
        console.error('[SriBooking]', err);
        state.loading = false;
        state.error = 'Failed to load booking data';
        render();
      });
  }

  // Initialize
  render();
  fetchPorts();
})();
