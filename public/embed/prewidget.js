/**
 * SriBooking Pre-Widget - Native search bar (no iframe)
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

  if (!widgetKey) {
    container.innerHTML = '<p style="color:red;">Missing data-key attribute</p>';
    return;
  }

  // Translations
  var translations = {
    en: { from: 'From', to: 'To', departure: 'Departure Date', return: 'Return Date', adults: 'Adults', children: 'Children', infants: 'Infants', search: 'Search Trips', oneway: 'One Way', roundtrip: 'Round Trip', selectFrom: 'Select origin', selectTo: 'Select destination', loading: 'Loading...' },
    fr: { from: 'De', to: 'Vers', departure: 'Date de départ', return: 'Date de retour', adults: 'Adultes', children: 'Enfants', infants: 'Bébés', search: 'Rechercher', oneway: 'Aller simple', roundtrip: 'Aller-retour', selectFrom: 'Origine', selectTo: 'Destination', loading: 'Chargement...' },
    id: { from: 'Dari', to: 'Ke', departure: 'Tanggal Berangkat', return: 'Tanggal Kembali', adults: 'Dewasa', children: 'Anak', infants: 'Bayi', search: 'Cari Perjalanan', oneway: 'Sekali Jalan', roundtrip: 'Pulang Pergi', selectFrom: 'Pilih asal', selectTo: 'Pilih tujuan', loading: 'Memuat...' },
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

  // Get API base URL (same origin as script or from data attribute)
  var apiBase = container.getAttribute('data-api') || '';
  if (!apiBase) {
    // Try to detect from script src
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || '';
      if (src.indexOf('prewidget.js') !== -1) {
        apiBase = src.replace(/\/embed\/prewidget\.js.*$/, '');
        break;
      }
    }
  }
  // Fallback to current origin
  if (!apiBase) {
    apiBase = window.location.origin;
  }

  // Styles
  var isDark = theme === 'dark';
  var bgColor = isDark ? '#1a1a2e' : '#ffffff';
  var textColor = isDark ? '#ffffff' : '#1f2937';
  var borderColor = isDark ? '#374151' : '#e5e7eb';
  var inputBg = isDark ? '#2d2d44' : '#f9fafb';

  var styles = `
    .srb-prewidget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${bgColor};
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
      color: ${textColor};
    }
    .srb-prewidget * { box-sizing: border-box; }
    .srb-trip-toggle {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }
    .srb-trip-btn {
      flex: 1;
      padding: 10px 16px;
      border: 2px solid ${borderColor};
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: ${textColor};
      transition: all 0.2s;
    }
    .srb-trip-btn.active {
      background: ${primaryColor};
      border-color: ${primaryColor};
      color: white;
    }
    .srb-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }
    .srb-field {
      display: flex;
      flex-direction: column;
    }
    .srb-label {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
      color: ${isDark ? '#9ca3af' : '#6b7280'};
    }
    .srb-select, .srb-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid ${borderColor};
      border-radius: 8px;
      background: ${inputBg};
      color: ${textColor};
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }
    .srb-select:focus, .srb-input:focus {
      border-color: ${primaryColor};
    }
    .srb-pax-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .srb-pax-field {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .srb-pax-label {
      font-size: 13px;
      color: ${textColor};
      min-width: 60px;
    }
    .srb-stepper {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .srb-stepper-btn {
      width: 32px;
      height: 32px;
      border: 1px solid ${borderColor};
      background: ${inputBg};
      border-radius: 6px;
      cursor: pointer;
      font-size: 18px;
      color: ${textColor};
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .srb-stepper-btn:hover:not(:disabled) {
      background: ${primaryColor};
      color: white;
      border-color: ${primaryColor};
    }
    .srb-stepper-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .srb-stepper-value {
      width: 32px;
      text-align: center;
      font-weight: 600;
    }
    .srb-search-btn {
      width: 100%;
      padding: 14px 24px;
      background: ${primaryColor};
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .srb-search-btn:hover {
      opacity: 0.9;
    }
    .srb-search-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .srb-branding {
      text-align: center;
      margin-top: 12px;
      font-size: 11px;
      color: ${isDark ? '#6b7280' : '#9ca3af'};
    }
    .srb-branding a {
      color: ${primaryColor};
      text-decoration: none;
    }
    .srb-error {
      color: #ef4444;
      font-size: 13px;
      margin-bottom: 12px;
    }
    .srb-loading {
      text-align: center;
      padding: 40px;
      color: ${isDark ? '#9ca3af' : '#6b7280'};
    }
    @media (max-width: 600px) {
      .srb-row { grid-template-columns: 1fr; }
      .srb-pax-row { flex-direction: column; gap: 12px; }
    }
  `;

  // Inject styles
  var styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  // Render function
  function render() {
    if (state.loading) {
      container.innerHTML = '<div class="srb-prewidget"><div class="srb-loading">' + t.loading + '</div></div>';
      return;
    }

    if (state.error) {
      container.innerHTML = '<div class="srb-prewidget"><div class="srb-error">' + state.error + '</div></div>';
      return;
    }

    var today = new Date().toISOString().split('T')[0];
    var isRoundTrip = state.tripType === 'roundtrip';

    // Build port options
    var fromOptions = '<option value="">' + t.selectFrom + '</option>';
    var toOptions = '<option value="">' + t.selectTo + '</option>';
    
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

    var html = '<div class="srb-prewidget">' +
      // Trip type toggle
      '<div class="srb-trip-toggle">' +
        '<button type="button" class="srb-trip-btn' + (state.tripType === 'oneway' ? ' active' : '') + '" data-trip="oneway">' + t.oneway + '</button>' +
        '<button type="button" class="srb-trip-btn' + (state.tripType === 'roundtrip' ? ' active' : '') + '" data-trip="roundtrip">' + t.roundtrip + '</button>' +
      '</div>' +
      // From / To
      '<div class="srb-row">' +
        '<div class="srb-field">' +
          '<label class="srb-label">' + t.from + '</label>' +
          '<select class="srb-select" id="srb-from">' + fromOptions + '</select>' +
        '</div>' +
        '<div class="srb-field">' +
          '<label class="srb-label">' + t.to + '</label>' +
          '<select class="srb-select" id="srb-to">' + toOptions + '</select>' +
        '</div>' +
      '</div>' +
      // Dates
      '<div class="srb-row">' +
        '<div class="srb-field">' +
          '<label class="srb-label">' + t.departure + '</label>' +
          '<input type="date" class="srb-input" id="srb-depart" min="' + today + '" value="' + state.departDate + '">' +
        '</div>' +
        (isRoundTrip ? 
          '<div class="srb-field">' +
            '<label class="srb-label">' + t.return + '</label>' +
            '<input type="date" class="srb-input" id="srb-return" min="' + (state.departDate || today) + '" value="' + state.returnDate + '">' +
          '</div>' : '') +
      '</div>' +
      // Passengers
      '<div class="srb-pax-row">' +
        '<div class="srb-pax-field">' +
          '<span class="srb-pax-label">' + t.adults + '</span>' +
          '<div class="srb-stepper">' +
            '<button type="button" class="srb-stepper-btn" data-pax="adults" data-action="minus"' + (state.adults <= 1 ? ' disabled' : '') + '>−</button>' +
            '<span class="srb-stepper-value">' + state.adults + '</span>' +
            '<button type="button" class="srb-stepper-btn" data-pax="adults" data-action="plus">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="srb-pax-field">' +
          '<span class="srb-pax-label">' + t.children + '</span>' +
          '<div class="srb-stepper">' +
            '<button type="button" class="srb-stepper-btn" data-pax="children" data-action="minus"' + (state.children <= 0 ? ' disabled' : '') + '>−</button>' +
            '<span class="srb-stepper-value">' + state.children + '</span>' +
            '<button type="button" class="srb-stepper-btn" data-pax="children" data-action="plus">+</button>' +
          '</div>' +
        '</div>' +
        '<div class="srb-pax-field">' +
          '<span class="srb-pax-label">' + t.infants + '</span>' +
          '<div class="srb-stepper">' +
            '<button type="button" class="srb-stepper-btn" data-pax="infants" data-action="minus"' + (state.infants <= 0 ? ' disabled' : '') + '>−</button>' +
            '<span class="srb-stepper-value">' + state.infants + '</span>' +
            '<button type="button" class="srb-stepper-btn" data-pax="infants" data-action="plus">+</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // Search button
      '<button type="button" class="srb-search-btn" id="srb-search">' + t.search + '</button>' +
      // Branding
      '<div class="srb-branding">Powered by <a href="https://sribooking.com" target="_blank">SriBooking.com</a></div>' +
    '</div>';

    container.innerHTML = html;
    bindEvents();
  }

  // Bind events
  function bindEvents() {
    // Trip type toggle
    var tripBtns = container.querySelectorAll('.srb-trip-btn');
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

    // Pax steppers
    var stepperBtns = container.querySelectorAll('.srb-stepper-btn');
    stepperBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var pax = this.getAttribute('data-pax');
        var action = this.getAttribute('data-action');
        if (action === 'plus') {
          state[pax]++;
        } else if (action === 'minus') {
          if (pax === 'adults' && state[pax] > 1) state[pax]--;
          else if (pax !== 'adults' && state[pax] > 0) state[pax]--;
        }
        render();
      });
    });

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
      alert(t.selectFrom);
      return;
    }
    if (!state.to) {
      alert(t.selectTo);
      return;
    }
    if (!state.departDate) {
      alert(t.departure + ' required');
      return;
    }
    if (state.tripType === 'roundtrip' && !state.returnDate) {
      alert(t.return + ' required');
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
