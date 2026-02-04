/**
 * SriBooking Pre-Widget - Native search bar (no iframe)
 * Exact same visual style as the main widget WidgetSearchForm
 * Embed on partner's homepage, redirects to dedicated booking page with params
 */
(function() {
  'use strict';

  // Find the container
  var container = document.getElementById('sribooking-prewidget');
  if (!container) {
    console.error('[SriBooking] Pre-widget container not found');
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
      departureDate: 'Departure Date',
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
      departureDate: 'Date Départ',
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
      departureDate: 'Tanggal Berangkat',
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

  // State
  var state = {
    ports: [],
    routes: [],
    tripType: 'oneway',
    from: '',
    to: '',
    departDate: '',
    returnDate: '',
    adults: 1,
    children: 0,
    infants: 0,
    loading: true,
    error: null
  };

  // Get API base URL
  var apiBase = container.getAttribute('data-api') || '';
  if (!apiBase) {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('prewidget.js') !== -1) {
        apiBase = src.replace(/\/embed\/prewidget\.js.*$/, '');
        break;
      }
    }
  }
  if (!apiBase) {
    apiBase = window.location.origin;
  }

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
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        margin-bottom: 12px;
      }
      @media (min-width: 768px) {
        .srb-pw-fields-row { grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
      }
      
      /* Field wrapper (icon + label + input) */
      .srb-pw-field {
        border: 1px solid ${fieldBorderColor};
        border-radius: 8px;
        background: ${inputBg};
        transition: border-color 0.2s;
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
      .srb-pw-field select,
      .srb-pw-field input[type="date"] {
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
      
      /* Passengers row */
      .srb-pw-pax-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 16px;
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
    `;
    document.head.appendChild(styleEl);
  }

  // SVG Icons (inline)
  var icons = {
    mapPin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    baby: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h.01"></path><path d="M15 12h.01"></path><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"></path><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"></path></svg>',
  };

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

    var today = new Date().toISOString().split('T')[0];
    var isRoundTrip = state.tripType === 'roundtrip';

    // Build port options
    var fromOptions = '<option value="">' + t.selectOrigin + '</option>';
    var toOptions = '<option value="">' + t.selectDestination + '</option>';
    
    // Get valid origins
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

    // Get valid destinations for selected origin
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

    var html = '<div class="srb-pw">' +
      '<div class="srb-pw-card">' +
        // Header
        '<div class="srb-pw-header" style="background-color: ' + primaryColor + ';">' +
          '<h2>' +
            '<span>▸ ' + t.bookTickets + '</span>' +
            (tagline ? '<span class="srb-pw-header-tagline">' + tagline + '</span>' : '') +
          '</h2>' +
        '</div>' +
        // Body
        '<div class="srb-pw-body">' +
          // Trip type toggle
          '<div class="srb-pw-trip-toggle">' +
            '<button type="button" class="srb-pw-trip-btn' + (state.tripType === 'oneway' ? ' active-oneway' : '') + '" data-trip="oneway">' + t.oneWay + '</button>' +
            '<button type="button" class="srb-pw-trip-btn' + (state.tripType === 'roundtrip' ? ' active-round' : '') + '" data-trip="roundtrip" style="' + (state.tripType === 'roundtrip' ? 'background-color: ' + primaryColor + ';' : '') + '">' + t.roundTrip + '</button>' +
            '<span class="srb-pw-trip-info"><span class="srb-pw-trip-info-icon">i</span>' + t.selectVoyage + '</span>' +
          '</div>' +
          // Row 1: From, To, Date
          '<div class="srb-pw-fields-row">' +
            // From
            '<div class="srb-pw-field">' +
              '<div class="srb-pw-field-inner">' +
                '<div class="srb-pw-field-icon" style="color: ' + primaryColor + ';">' + icons.mapPin + '</div>' +
                '<div class="srb-pw-field-content">' +
                  '<label class="srb-pw-field-label">' + t.from + '</label>' +
                  '<select id="srb-from">' + fromOptions + '</select>' +
                '</div>' +
              '</div>' +
            '</div>' +
            // To
            '<div class="srb-pw-field">' +
              '<div class="srb-pw-field-inner">' +
                '<div class="srb-pw-field-icon" style="color: ' + primaryColor + ';">' + icons.mapPin + '</div>' +
                '<div class="srb-pw-field-content">' +
                  '<label class="srb-pw-field-label">' + t.to + '</label>' +
                  '<select id="srb-to"' + (!state.from ? ' disabled' : '') + '>' + toOptions + '</select>' +
                '</div>' +
              '</div>' +
            '</div>' +
            // Departure Date
            '<div class="srb-pw-field">' +
              '<div class="srb-pw-field-inner">' +
                '<div class="srb-pw-field-icon" style="color: ' + primaryColor + ';">' + icons.calendar + '</div>' +
                '<div class="srb-pw-field-content">' +
                  '<label class="srb-pw-field-label">' + t.departureDate + '</label>' +
                  '<input type="date" id="srb-depart" min="' + today + '" value="' + state.departDate + '" placeholder="' + t.selectDate + '">' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          // Row 2 (only for round trip): Return Date
          (isRoundTrip ?
            '<div class="srb-pw-fields-row" style="grid-template-columns: 1fr;">' +
              '<div class="srb-pw-field">' +
                '<div class="srb-pw-field-inner">' +
                  '<div class="srb-pw-field-icon" style="color: ' + primaryColor + ';">' + icons.calendar + '</div>' +
                  '<div class="srb-pw-field-content">' +
                    '<label class="srb-pw-field-label">Return Date</label>' +
                    '<input type="date" id="srb-return" min="' + (state.departDate || today) + '" value="' + state.returnDate + '">' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' : '') +
          // Passengers row
          '<div class="srb-pw-pax-row">' +
            // Adult
            '<div class="srb-pw-field">' +
              '<div class="srb-pw-field-inner">' +
                '<div class="srb-pw-field-icon" style="color: ' + primaryColor + ';">' + icons.users + '</div>' +
                '<div class="srb-pw-field-content">' +
                  '<label class="srb-pw-field-label">' + t.adultAge + '</label>' +
                  '<select id="srb-adults">' + adultOptions + '</select>' +
                '</div>' +
              '</div>' +
            '</div>' +
            // Child
            '<div class="srb-pw-field">' +
              '<div class="srb-pw-field-inner">' +
                '<div class="srb-pw-field-icon" style="color: ' + primaryColor + ';">' + icons.users + '</div>' +
                '<div class="srb-pw-field-content">' +
                  '<label class="srb-pw-field-label">' + t.child + '</label>' +
                  '<select id="srb-children">' + childOptions + '</select>' +
                '</div>' +
              '</div>' +
            '</div>' +
            // Infant
            '<div class="srb-pw-field">' +
              '<div class="srb-pw-field-inner">' +
                '<div class="srb-pw-field-icon" style="color: ' + primaryColor + ';">' + icons.baby + '</div>' +
                '<div class="srb-pw-field-content">' +
                  '<label class="srb-pw-field-label">' + t.infantAge + '</label>' +
                  '<select id="srb-infants">' + infantOptions + '</select>' +
                '</div>' +
              '</div>' +
            '</div>' +
            // Search button
            '<button type="button" class="srb-pw-search-btn" id="srb-search">' + t.searchTrips + '</button>' +
          '</div>' +
          // Branding
          '<div class="srb-pw-branding">' +
            t.poweredBy + ' <a href="https://sribooking.com" target="_blank" rel="noopener noreferrer" style="color: ' + primaryColor + ';">SriBooking.com</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    container.innerHTML = html;
    bindEvents();
  }

  // Bind events
  function bindEvents() {
    // Trip type toggle
    var tripBtns = container.querySelectorAll('.srb-pw-trip-btn');
    tripBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        state.tripType = this.getAttribute('data-trip');
        if (state.tripType === 'oneway') state.returnDate = '';
        render();
      });
    });

    // From select
    var fromSelect = document.getElementById('srb-from');
    if (fromSelect) {
      fromSelect.addEventListener('change', function() {
        state.from = this.value;
        state.to = ''; // Reset destination
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

    // Departure date
    var departInput = document.getElementById('srb-depart');
    if (departInput) {
      departInput.addEventListener('change', function() {
        state.departDate = this.value;
        // Update return date min
        if (state.returnDate && state.returnDate < this.value) {
          state.returnDate = this.value;
        }
        render();
      });
    }

    // Return date
    var returnInput = document.getElementById('srb-return');
    if (returnInput) {
      returnInput.addEventListener('change', function() {
        state.returnDate = this.value;
      });
    }

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

    // Search button
    var searchBtn = document.getElementById('srb-search');
    if (searchBtn) {
      searchBtn.addEventListener('click', handleSearch);
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
      alert('Return date is required');
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

    var redirectUrl = redirectPath + '?' + params.toString();
    window.location.href = redirectUrl;
  }

  // Fetch ports
  function fetchPorts() {
    var url = apiBase + '/functions/v1/widget-ports?key=' + encodeURIComponent(widgetKey);
    
    fetch(url)
      .then(function(res) {
        if (!res.ok) throw new Error('Failed to load ports');
        return res.json();
      })
      .then(function(data) {
        state.ports = data.ports || [];
        state.routes = data.routes || [];
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
