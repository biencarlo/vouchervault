/**
 * Voucher Vault — Personal Voucher Tracker PWA
 * Material Design 3 (M3 Expressive) Offline-First Application Logic
 * Blue Theme · Bright Green Active · Light Red Expiring Soon · Custom Platforms & Tag Colors
 */

(() => {
  'use strict';

  const STORAGE_KEY = 'voucher_vault_items_v1';
  const PLATFORMS_KEY = 'voucher_vault_platforms_v1';
  const THEME_KEY = 'voucher_vault_theme_v1';
  const NOTIFY_SETTINGS_KEY = 'voucher_vault_notify_settings_v1';
  const NOTIFY_LOG_KEY = 'voucher_vault_notify_log_v1';
  const DEFAULT_EXPIRING_SOON_DAYS = 3;

  // Built-in Default Platforms with Brand Colors
  const DEFAULT_PLATFORMS = [
    { name: 'Atome', color: '#65880B', isDefault: true },
    { name: 'Lazada', color: '#0F146D', isDefault: true },
    { name: 'Shopee', color: '#EE4D2D', isDefault: true },
    { name: 'GlobeOne', color: '#0056D2', isDefault: true }
  ];

  // Official 16-Color Material Design Curated Swatch Palette
  const M3_PALETTE_16 = [
    { hex: '#D93025', name: 'Crimson Red' },
    { hex: '#E91E63', name: 'Rose Pink' },
    { hex: '#C2185B', name: 'Berry Magenta' },
    { hex: '#EE4D2D', name: 'Shopee Orange' },
    { hex: '#F57C00', name: 'Tangerine' },
    { hex: '#E37400', name: 'Amber Gold' },
    { hex: '#65880B', name: 'Atome Lime' },
    { hex: '#12B850', name: 'Vibrant Green' },
    { hex: '#00897B', name: 'Emerald Teal' },
    { hex: '#0097A7', name: 'Ocean Cyan' },
    { hex: '#0288D1', name: 'Sky Blue' },
    { hex: '#0B57D0', name: 'Google Blue' },
    { hex: '#0056D2', name: 'Globe Royal' },
    { hex: '#0F146D', name: 'Lazada Navy' },
    { hex: '#546E7A', name: 'Blue Grey' },
    { hex: '#5D4037', name: 'Warm Cocoa' }
  ];

  // State
  let vouchers = [];
  let platforms = [];
  let activeManagePlatform = 'Atome';
  let notifySettings = {
    enabled: false,
    leadDays: DEFAULT_EXPIRING_SOON_DAYS // 1, 2, or 3 days before expiry
  };
  let filterState = {
    platform: 'All',
    status: 'All', // 'All' | 'Active' | 'ExpiringSoon' | 'Used' | 'Expired'
    search: '',
    sortBy: 'expiration-asc'
  };

  let snackbarTimer = null;
  let undoCallback = null;
  let deferredInstallPrompt = null;

  // DOM Elements
  const els = {
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    metaThemeColor: document.getElementById('meta-theme-color'),
    installPwaBtn: document.getElementById('install-pwa-btn'),
    connectionText: document.getElementById('connection-text'),

    // Notification Bell & Modal Elements
    notifySettingsBtn: document.getElementById('notify-settings-btn'),
    notifyActiveDot: document.getElementById('notify-active-dot'),
    notifyModalBackdrop: document.getElementById('notify-modal-backdrop'),
    notifyModalCloseBtn: document.getElementById('notify-modal-close-btn'),
    notifyModalDoneBtn: document.getElementById('notify-modal-done-btn'),
    notifyPermissionLabel: document.getElementById('notify-permission-label'),
    notifyPermissionSubtext: document.getElementById('notify-permission-subtext'),
    notifyEnableToggleBtn: document.getElementById('notify-enable-toggle-btn'),
    notifyLeadDaysGroup: document.getElementById('notify-lead-days-group'),
    sendTestNotificationBtn: document.getElementById('send-test-notification-btn'),

    statActiveCount: document.getElementById('stat-active-count'),
    statExpiringCount: document.getElementById('stat-expiring-count'),
    statUsedCount: document.getElementById('stat-used-count'),
    statExpiredCount: document.getElementById('stat-expired-count'),
    summaryPills: document.querySelectorAll('.summary-pill'),

    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    sortSelect: document.getElementById('sort-select'),

    platformFilterGroup: document.getElementById('platform-filter-group'),
    statusFilterGroup: document.getElementById('status-filter-group'),
    resultsHeading: document.getElementById('results-heading'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),

    voucherList: document.getElementById('voucher-list'),
    emptyState: document.getElementById('empty-state'),
    emptyStateTitle: document.getElementById('empty-state-title'),
    emptyStateDesc: document.getElementById('empty-state-desc'),
    emptyResetBtn: document.getElementById('empty-reset-btn'),
    emptyAddBtn: document.getElementById('empty-add-btn'),

    fabAddVoucher: document.getElementById('fab-add-voucher'),
    modalBackdrop: document.getElementById('voucher-modal-backdrop'),
    modalTitle: document.getElementById('modal-title'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    voucherForm: document.getElementById('voucher-form'),

    inputId: document.getElementById('voucher-id'),
    inputTitle: document.getElementById('voucher-title'),
    inputCode: document.getElementById('voucher-code'),
    inputStatus: document.getElementById('voucher-status'),
    inputDesc: document.getElementById('voucher-description'),
    inputReceived: document.getElementById('voucher-received'),
    inputExpiration: document.getElementById('voucher-expiration'),
    titleError: document.getElementById('title-error'),
    dateError: document.getElementById('date-error'),
    presetChips: document.querySelectorAll('.m3-preset-chip'),

    // In-Modal Platform Selector & 16-Circle Tag Color Customizer
    modalPlatformGrid: document.getElementById('modal-platform-grid'),
    togglePlatformCustomizerBtn: document.getElementById('toggle-platform-customizer-btn'),
    platformCustomizerPanel: document.getElementById('platform-customizer-panel'),
    customizerCurrentPlatName: document.getElementById('customizer-current-plat-name'),
    modalPaletteGrid: document.getElementById('modal-palette-grid'),
    newPlatformNameInput: document.getElementById('new-platform-name-input'),
    addPlatformConfirmBtn: document.getElementById('add-platform-confirm-btn'),

    // Standalone Manage Platforms Modal
    platformModalBackdrop: document.getElementById('platform-modal-backdrop'),
    platformModalCloseBtn: document.getElementById('platform-modal-close-btn'),
    platformModalDoneBtn: document.getElementById('platform-modal-done-btn'),
    managePlatformsList: document.getElementById('manage-platforms-list'),
    manageActivePlatformLabel: document.getElementById('manage-active-platform-label'),
    managePaletteGrid: document.getElementById('manage-palette-grid'),
    manageNewPlatformName: document.getElementById('manage-new-platform-name'),
    manageAddPlatformBtn: document.getElementById('manage-add-platform-btn'),

    snackbar: document.getElementById('m3-snackbar'),
    snackbarMsg: document.getElementById('snackbar-message'),
    snackbarActionBtn: document.getElementById('snackbar-action-btn')
  };

  /* ==========================================================================
     Platform Brand Logo SVGs (Atome, Lazada, Shopee, GlobeOne & Custom)
     ========================================================================== */
  function getPlatformIconSVG(platformName, hexColor) {
    const key = String(platformName || '').trim().toLowerCase();
    const color = hexColor || '#0B57D0';

    if (key === 'atome') {
      // Atome "a." brand mark on chartruese-lime or custom tag color
      return `
        <span class="platform-logo-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect width="24" height="24" rx="6" fill="${color}" />
            <path d="M10.4 7.5c-2.6 0-4.4 1.9-4.4 4.5s1.8 4.5 4.2 4.5c1.3 0 2.3-.5 2.9-1.3v1.1h2.4V7.7h-2.4v1c-.6-.7-1.6-1.2-2.7-1.2zm.3 6.7c-1.3 0-2.2-.9-2.2-2.2s.9-2.2 2.2-2.2 2.2.9 2.2 2.2-.9 2.2-2.2 2.2z" fill="#ffffff"/>
            <circle cx="18.3" cy="15.1" r="1.5" fill="#F0FF66"/>
          </svg>
        </span>`;
    }

    if (key === 'lazada') {
      // Lazada Heart-Box 3D Wing mark
      return `
        <span class="platform-logo-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect width="24" height="24" rx="6" fill="${color}" />
            <path d="M12 18.2 5.2 13.7V8.3c0-.5.5-.8.9-.6L12 11.2l5.9-3.5c.4-.2.9.1.9.6v5.4L12 18.2z" fill="#FF2876"/>
            <path d="M12 11.2 17.9 7.7c.4-.2.9.1.9.6v5.4L12 18.2v-7z" fill="#FF6A00" opacity="0.88"/>
          </svg>
        </span>`;
    }

    if (key === 'shopee') {
      // Shopee Shopping Bag with "S" emblem
      return `
        <span class="platform-logo-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect width="24" height="24" rx="6" fill="${color}" />
            <path d="M9.2 8.2V7.6a2.8 2.8 0 0 1 5.6 0v.6h2.4l-.8 10.2a1.4 1.4 0 0 1-1.4 1.3H9a1.4 1.4 0 0 1-1.4-1.3L6.8 8.2h2.4zm1.4 0h2.8v-.6a1.4 1.4 0 0 0-2.8 0v.6z" fill="#ffffff"/>
            <path d="M13.5 11.6c-.4-.3-1-.5-1.5-.5-.9 0-1.5.4-1.5 1 0 .5.4.8 1.4 1.1 1.3.4 2 .9 2 1.9 0 1.2-1 2-2.4 2-1 0-1.8-.3-2.4-.9l.7-.9c.4.4 1 .7 1.7.7.8 0 1.3-.3 1.3-.8 0-.5-.4-.8-1.4-1.1-1.2-.3-2-.8-2-1.9 0-1.1.9-1.9 2.4-1.9.8 0 1.6.3 2.1.7l-.4.6z" fill="${color}"/>
          </svg>
        </span>`;
    }

    if (key === 'globeone') {
      // GlobeOne meridian globe emblem
      return `
        <span class="platform-logo-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect width="24" height="24" rx="6" fill="${color}" />
            <circle cx="12" cy="12" r="6.3" fill="none" stroke="#ffffff" stroke-width="1.7"/>
            <ellipse cx="12" cy="12" rx="3.1" ry="6.3" fill="none" stroke="#ffffff" stroke-width="1.4"/>
            <line x1="5.8" y1="12" x2="18.2" y2="12" stroke="#ffffff" stroke-width="1.4"/>
          </svg>
        </span>`;
    }

    // Custom platform badge with crisp initial monogram
    const initial = escapeHTML(String(platformName || 'P').trim().charAt(0).toUpperCase());
    return `
      <span class="platform-logo-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <rect width="24" height="24" rx="6" fill="${color}" />
          <text x="12" y="16.3" text-anchor="middle" fill="#ffffff" font-family="Google Sans" font-size="13" font-weight="700">${initial}</text>
        </svg>
      </span>`;
  }

  /* ==========================================================================
     Platform & Tag Color Persistence
     ========================================================================== */
  function loadPlatforms() {
    try {
      const raw = localStorage.getItem(PLATFORMS_KEY);
      if (!raw) {
        platforms = DEFAULT_PLATFORMS.map((p) => ({ ...p }));
        savePlatforms();
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        platforms = parsed;
      } else {
        platforms = DEFAULT_PLATFORMS.map((p) => ({ ...p }));
      }
    } catch (_) {
      platforms = DEFAULT_PLATFORMS.map((p) => ({ ...p }));
    }
  }

  function savePlatforms() {
    try {
      localStorage.setItem(PLATFORMS_KEY, JSON.stringify(platforms));
    } catch (_) {}
  }

  function getPlatformMeta(name) {
    const found = platforms.find(
      (p) => p.name.toLowerCase() === String(name || '').toLowerCase()
    );
    return found || { name: name || 'Custom', color: '#0B57D0', isDefault: false };
  }

  function addOrUpdatePlatform(rawName, hexColor) {
    const name = String(rawName || '').trim();
    if (!name) return null;
    const color = hexColor || '#0B57D0';

    const existing = platforms.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.color = color;
      savePlatforms();
      return existing;
    }

    const created = { name, color, isDefault: false };
    platforms.push(created);
    savePlatforms();
    return created;
  }

  function updatePlatformColor(name, newColor) {
    const target = platforms.find((p) => p.name.toLowerCase() === String(name || '').toLowerCase());
    if (!target) return;
    target.color = newColor;
    savePlatforms();
  }

  function deleteCustomPlatform(name) {
    const idx = platforms.findIndex(
      (p) => !p.isDefault && p.name.toLowerCase() === String(name || '').toLowerCase()
    );
    if (idx === -1) return;
    platforms.splice(idx, 1);
    if (filterState.platform === name) {
      filterState.platform = 'All';
    }
    savePlatforms();
    render();
    renderManagePlatformsList();
  }

  /* ==========================================================================
     Date Helpers (Local Time YYYY-MM-DD)
     ========================================================================== */
  function toLocalISOString(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getTodayISO() {
    return toLocalISOString(new Date());
  }

  function addDaysToTodayISO(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return toLocalISOString(d);
  }

  function getDaysUntilExpiration(expirationISO) {
    if (!expirationISO) return 999;
    const todayParts = getTodayISO().split('-').map(Number);
    const expParts = expirationISO.split('-').map(Number);
    const todayUTC = Date.UTC(todayParts[0], todayParts[1] - 1, todayParts[2]);
    const expUTC = Date.UTC(expParts[0], expParts[1] - 1, expParts[2]);
    return Math.round((expUTC - todayUTC) / (1000 * 60 * 60 * 24));
  }

  function formatDisplayDate(isoDate) {
    if (!isoDate) return '—';
    const parts = isoDate.split('-').map(Number);
    if (parts.length !== 3) return isoDate;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function getExpiringSoonLeadDays() {
    return Number(notifySettings.leadDays) || DEFAULT_EXPIRING_SOON_DAYS;
  }

  function isExpiringSoon(voucher) {
    if (voucher.status !== 'Active') return false;
    const daysLeft = getDaysUntilExpiration(voucher.expirationDate);
    return daysLeft >= 0 && daysLeft <= getExpiringSoonLeadDays();
  }

  function getUrgencyLabel(daysLeft) {
    if (daysLeft === 0) return 'Expires Today!';
    if (daysLeft === 1) return 'Expires Tomorrow';
    return `Expiring in ${daysLeft} days`;
  }

  /* ==========================================================================
     Theme Management (Light / Dark Mode defaulting to System Preference)
     ========================================================================== */
  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (els.metaThemeColor) {
      els.metaThemeColor.setAttribute('content', theme === 'dark' ? '#0E131B' : '#0B57D0');
    }
  }

  function initTheme() {
    applyTheme(getPreferredTheme());

    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }

    els.themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
      showSnackbar(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} theme`);
    });
  }

  /* ==========================================================================
     Storage, Seed Data & Automatic Expiration Sync
     ========================================================================== */
  function createSeedVouchers() {
    return [
      {
        id: 'v_seed_1',
        title: '₱200 Off Flash Voucher (Min. ₱800)',
        code: 'LAZFLASH200',
        description: 'Valid on LazMall electronics & home appliances checkout.',
        platform: 'Lazada',
        dateReceived: addDaysToTodayISO(-5),
        expirationDate: addDaysToTodayISO(1),
        status: 'Active',
        usedAt: null,
        createdAt: Date.now() - 500000
      },
      {
        id: 'v_seed_2',
        title: '15% Cashback PayLater Bill Voucher',
        code: 'ATOME15CB',
        description: 'Capped at ₱300 for 3-month 0% installment plans in app.',
        platform: 'Atome',
        dateReceived: addDaysToTodayISO(-3),
        expirationDate: addDaysToTodayISO(2),
        status: 'Active',
        usedAt: null,
        createdAt: Date.now() - 400000
      },
      {
        id: 'v_seed_3',
        title: 'Free Shipping + ₱100 Coin Cashback',
        code: 'SHPFREESHIP',
        description: 'No minimum spend with ShopeePay on preferred sellers.',
        platform: 'Shopee',
        dateReceived: addDaysToTodayISO(-2),
        expirationDate: addDaysToTodayISO(12),
        status: 'Active',
        usedAt: null,
        createdAt: Date.now() - 300000
      },
      {
        id: 'v_seed_4',
        title: '10GB Go+ Data Rewards Voucher',
        code: 'GLOBE10GB',
        description: 'Redeemable via GlobeOne Rewards hub for all-access data.',
        platform: 'GlobeOne',
        dateReceived: addDaysToTodayISO(-10),
        expirationDate: addDaysToTodayISO(6),
        status: 'Used',
        usedAt: Date.now() - 100000,
        createdAt: Date.now() - 200000
      },
      {
        id: 'v_seed_5',
        title: '₱120 Off Payday Super Voucher',
        code: 'SHPPAYDAY120',
        description: 'Expired payday voucher for fashion and lifestyle.',
        platform: 'Shopee',
        dateReceived: addDaysToTodayISO(-20),
        expirationDate: addDaysToTodayISO(-3),
        status: 'Expired',
        usedAt: null,
        createdAt: Date.now() - 100000
      }
    ];
  }

  function syncAutomaticExpirations(list) {
    let changed = false;
    list.forEach((v) => {
      if (v.status === 'Active' && getDaysUntilExpiration(v.expirationDate) < 0) {
        v.status = 'Expired';
        changed = true;
      }
    });
    return changed;
  }

  function loadVouchers() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        vouchers = createSeedVouchers();
        saveVouchers();
        return;
      }
      const parsed = JSON.parse(raw);
      vouchers = Array.isArray(parsed) ? parsed : createSeedVouchers();
      if (syncAutomaticExpirations(vouchers)) {
        saveVouchers();
      }
    } catch (err) {
      vouchers = createSeedVouchers();
    }
  }

  function saveVouchers() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vouchers));
    } catch (_) {}
  }

  /* ==========================================================================
     Filtering, Sorting & Dynamic Platform Rendering
     ========================================================================== */
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderPlatformFilterChips() {
    const allCount = vouchers.length;
    const isAllSelected = filterState.platform === 'All';

    let html = `
      <button type="button" class="m3-filter-chip ${isAllSelected ? 'is-selected' : ''}" data-platform="All" id="chip-platform-all">
        <span>All Platforms</span>
        <span class="chip-count">${allCount}</span>
      </button>
    `;

    platforms.forEach((plat) => {
      const count = vouchers.filter((v) => v.platform === plat.name).length;
      const isSelected = filterState.platform === plat.name;
      const slug = plat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      html += `
        <button
          type="button"
          class="m3-filter-chip ${isSelected ? 'is-selected' : ''}"
          data-platform="${escapeHTML(plat.name)}"
          id="chip-platform-${slug}"
          style="--plat-color: ${escapeHTML(plat.color)}"
        >
          ${getPlatformIconSVG(plat.name, plat.color)}
          <span>${escapeHTML(plat.name)}</span>
          <span class="chip-count">${count}</span>
        </button>
      `;
    });

    // "+ Platform / Colors" Quick Action Chip
    html += `
      <button
        type="button"
        class="m3-filter-chip m3-filter-chip--manage"
        id="open-platform-manager-chip"
        title="Add custom platform or change tag colors"
      >
        <span>+ Platform &amp; Colors</span>
      </button>
    `;

    els.platformFilterGroup.innerHTML = html;
  }

  function renderModalPlatformSelector(selectedPlatformName = 'Atome') {
    if (!els.modalPlatformGrid) return;

    const currentName =
      platforms.some((p) => p.name === selectedPlatformName)
        ? selectedPlatformName
        : (platforms[0] && platforms[0].name) || 'Atome';

    els.modalPlatformGrid.innerHTML = platforms
      .map((plat) => {
        const isChecked = plat.name === currentName;
        const slug = plat.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `
          <label
            class="platform-radio-pill platform-radio-pill--${slug}"
            style="--plat-color: ${escapeHTML(plat.color)}"
          >
            <input
              type="radio"
              name="voucher-platform"
              value="${escapeHTML(plat.name)}"
              ${isChecked ? 'checked' : ''}
            />
            ${getPlatformIconSVG(plat.name, plat.color)}
            <span>${escapeHTML(plat.name)}</span>
          </label>
        `;
      })
      .join('');

    syncCustomizerToSelectedPlatform(currentName);
  }

  function render16CirclePaletteHTML(selectedHex) {
    const normalized = String(selectedHex || '').toUpperCase();
    return M3_PALETTE_16.map((swatch) => {
      const isSelected = swatch.hex.toUpperCase() === normalized;
      return `
        <button
          type="button"
          class="m3-color-circle ${isSelected ? 'is-selected' : ''}"
          data-swatch-hex="${swatch.hex}"
          style="--swatch-color: ${swatch.hex}"
          role="radio"
          aria-checked="${isSelected ? 'true' : 'false'}"
          aria-label="${swatch.name}"
          title="${swatch.name}"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </button>
      `;
    }).join('');
  }

  function syncCustomizerToSelectedPlatform(platformName) {
    const meta = getPlatformMeta(platformName);
    if (els.customizerCurrentPlatName) {
      els.customizerCurrentPlatName.textContent = meta.name;
    }
    if (els.modalPaletteGrid) {
      els.modalPaletteGrid.innerHTML = render16CirclePaletteHTML(meta.color);
    }
  }

  function renderManagePlatformsList() {
    if (!els.managePlatformsList) return;
    if (!platforms.some((p) => p.name === activeManagePlatform)) {
      activeManagePlatform = (platforms[0] && platforms[0].name) || 'Atome';
    }
    const activeMeta = getPlatformMeta(activeManagePlatform);

    els.managePlatformsList.innerHTML = platforms
      .map((plat) => {
        const isSelected = plat.name === activeManagePlatform;
        const deleteBtnHTML = plat.isDefault
          ? ''
          : `<button type="button" class="manage-platform-delete-btn" data-delete-platform="${escapeHTML(plat.name)}" title="Remove ${escapeHTML(plat.name)}">✕</button>`;
        return `
          <div
            class="manage-platform-item ${isSelected ? 'is-selected' : ''}"
            data-select-manage-platform="${escapeHTML(plat.name)}"
            style="--plat-color: ${escapeHTML(plat.color)}"
          >
            ${getPlatformIconSVG(plat.name, plat.color)}
            <span style="font-size:0.82rem; font-weight:500;">${escapeHTML(plat.name)}</span>
            ${deleteBtnHTML}
          </div>
        `;
      })
      .join('');

    if (els.manageActivePlatformLabel) {
      els.manageActivePlatformLabel.textContent = activeMeta.name;
    }
    if (els.managePaletteGrid) {
      els.managePaletteGrid.innerHTML = render16CirclePaletteHTML(activeMeta.color);
    }
  }

  function getFilteredAndSortedVouchers() {
    syncAutomaticExpirations(vouchers);

    const query = filterState.search.trim().toLowerCase();

    const filtered = vouchers.filter((v) => {
      if (filterState.platform !== 'All' && v.platform !== filterState.platform) {
        return false;
      }
      if (filterState.status === 'ExpiringSoon') {
        if (!isExpiringSoon(v)) return false;
      } else if (filterState.status !== 'All' && v.status !== filterState.status) {
        return false;
      }
      if (query) {
        const haystack = `${v.title} ${v.description || ''} ${v.code || ''} ${v.platform}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    const statusRank = { Active: 0, Used: 1, Expired: 2 };
    filtered.sort((a, b) => {
      switch (filterState.sortBy) {
        case 'expiration-asc': {
          const rankDiff = (a.status === 'Active' ? 0 : 1) - (b.status === 'Active' ? 0 : 1);
          if (rankDiff !== 0) return rankDiff;
          return (a.expirationDate || '').localeCompare(b.expirationDate || '');
        }
        case 'expiration-desc':
          return (b.expirationDate || '').localeCompare(a.expirationDate || '');
        case 'received-desc':
          return (b.dateReceived || '').localeCompare(a.dateReceived || '');
        case 'platform-asc':
          return (a.platform || '').localeCompare(b.platform || '');
        case 'status-asc': {
          const diff = (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
          if (diff !== 0) return diff;
          return (a.expirationDate || '').localeCompare(b.expirationDate || '');
        }
        default:
          return 0;
      }
    });

    return filtered;
  }

  function updateSummaryAndCounts() {
    const activeCount = vouchers.filter((v) => v.status === 'Active').length;
    const expiringCount = vouchers.filter((v) => isExpiringSoon(v)).length;
    const usedCount = vouchers.filter((v) => v.status === 'Used').length;
    const expiredCount = vouchers.filter((v) => v.status === 'Expired').length;

    els.statActiveCount.textContent = String(activeCount);
    els.statExpiringCount.textContent = String(expiringCount);
    els.statUsedCount.textContent = String(usedCount);
    els.statExpiredCount.textContent = String(expiredCount);

    els.summaryPills.forEach((pill) => {
      const targetStatus = pill.getAttribute('data-quick-status');
      pill.classList.toggle('is-active-filter', filterState.status === targetStatus);
    });

    renderPlatformFilterChips();
  }

  function renderVoucherCard(voucher, index = 0) {
    const daysLeft = getDaysUntilExpiration(voucher.expirationDate);
    const expiringSoon = isExpiringSoon(voucher);
    const isUsed = voucher.status === 'Used';
    const isExpired = voucher.status === 'Expired';
    const platMeta = getPlatformMeta(voucher.platform);

    const cardClasses = [
      'voucher-card',
      expiringSoon ? 'is-expiring-soon' : '',
      isUsed ? 'is-used' : '',
      isExpired ? 'is-expired' : ''
    ]
      .filter(Boolean)
      .join(' ');

    const urgencyBadgeHTML = expiringSoon
      ? `<span class="urgency-badge" title="Expires within ${getExpiringSoonLeadDays()} days">
           <span class="urgency-pulse-dot" aria-hidden="true"></span>
           ${escapeHTML(getUrgencyLabel(daysLeft))}
         </span>`
      : '';

    const promoCodeHTML = voucher.code
      ? `<div class="promo-code-bar">
           <span class="promo-code-text">${escapeHTML(voucher.code)}</span>
           <button type="button" class="copy-code-btn m3-ripple-surface" data-action="copy-code" data-code="${escapeHTML(voucher.code)}" aria-label="Copy promo code ${escapeHTML(voucher.code)}">
             Copy
           </button>
         </div>`
      : '';

    const descHTML = voucher.description
      ? `<p class="voucher-desc">${escapeHTML(voucher.description)}</p>`
      : '';

    const oneTapBtnHTML = isUsed
      ? `<button type="button" class="one-tap-used-btn is-restore m3-ripple-surface" data-action="toggle-used" data-id="${escapeHTML(voucher.id)}" aria-label="Restore ${escapeHTML(voucher.title)} to Active">
           <span>Marked Used · Undo</span>
         </button>`
      : `<button type="button" class="one-tap-used-btn m3-ripple-surface" data-action="toggle-used" data-id="${escapeHTML(voucher.id)}" aria-label="Mark ${escapeHTML(voucher.title)} as Used">
           <svg class="btn-check-icon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
             <path d="M20 6 9 17l-5-5"/>
           </svg>
           <span>Mark as Used</span>
         </button>`;

    const expiryDateClass = expiringSoon
      ? 'date-item date-item--expiry is-urgent'
      : isExpired
      ? 'date-item date-item--expiry is-past'
      : 'date-item date-item--expiry';

    return `
      <article class="${cardClasses}" style="--card-index: ${index}; --plat-color: ${escapeHTML(platMeta.color)}" data-voucher-id="${escapeHTML(voucher.id)}" data-platform="${escapeHTML(voucher.platform)}" data-status="${escapeHTML(voucher.status)}">
        <div class="card-top-row">
          <span class="platform-badge" style="--plat-color: ${escapeHTML(platMeta.color)}">
            ${getPlatformIconSVG(platMeta.name, platMeta.color)}
            <span>${escapeHTML(platMeta.name)}</span>
          </span>
          <div class="card-badges-right">
            ${urgencyBadgeHTML}
            <span class="status-badge status-badge--${escapeHTML(voucher.status)}">
              ${escapeHTML(voucher.status)}
            </span>
          </div>
        </div>

        <div class="card-body">
          <h3 class="voucher-title">${escapeHTML(voucher.title)}</h3>
          ${descHTML}
          ${promoCodeHTML}
        </div>

        <div class="card-dates-row">
          <span class="date-item">
            Received: ${escapeHTML(formatDisplayDate(voucher.dateReceived))}
          </span>
          <span class="${expiryDateClass}">
            Expires: ${escapeHTML(formatDisplayDate(voucher.expirationDate))}
          </span>
        </div>

        <div class="card-actions-row">
          ${oneTapBtnHTML}
          <div class="card-icon-actions">
            <button type="button" class="card-action-icon-btn m3-ripple-surface" data-action="edit" data-id="${escapeHTML(voucher.id)}" aria-label="Edit voucher ${escapeHTML(voucher.title)}" title="Edit voucher">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              </svg>
            </button>
            <button type="button" class="card-action-icon-btn card-action-icon-btn--delete m3-ripple-surface" data-action="delete" data-id="${escapeHTML(voucher.id)}" aria-label="Delete voucher ${escapeHTML(voucher.title)}" title="Delete voucher">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function render() {
    updateSummaryAndCounts();
    const visible = getFilteredAndSortedVouchers();

    const hasFilter =
      filterState.platform !== 'All' ||
      filterState.status !== 'All' ||
      filterState.search.trim() !== '';

    const platText = filterState.platform === 'All' ? 'All' : filterState.platform;
    const statusText =
      filterState.status === 'All'
        ? ''
        : filterState.status === 'ExpiringSoon'
        ? 'Expiring Soon'
        : filterState.status;

    els.resultsHeading.textContent = `${[platText, statusText].filter(Boolean).join(' · ')} Vouchers (${visible.length})`;
    els.resetFiltersBtn.hidden = !hasFilter;

    if (visible.length === 0) {
      els.voucherList.innerHTML = '';
      els.voucherList.hidden = true;
      els.emptyState.hidden = false;
      els.emptyResetBtn.hidden = !hasFilter;

      if (vouchers.length === 0) {
        els.emptyStateTitle.textContent = 'Your Voucher Vault is empty';
        els.emptyStateDesc.textContent =
          'Tap "+ Add Voucher" to save your Atome, Lazada, Shopee, GlobeOne, or custom vouchers offline.';
      } else {
        els.emptyStateTitle.textContent = 'No matching vouchers';
        els.emptyStateDesc.textContent =
          'No vouchers match your current platform or status filter.';
      }
    } else {
      els.emptyState.hidden = true;
      els.voucherList.hidden = false;
      els.voucherList.innerHTML = visible.map((v, i) => renderVoucherCard(v, i)).join('');
    }
  }

  /* ==========================================================================
     CRUD Actions & One-Tap Toggle
     ========================================================================== */
  function toggleUsedStatus(id) {
    const idx = vouchers.findIndex((v) => v.id === id);
    if (idx === -1) return;

    const item = vouchers[idx];
    const previousStatus = item.status;
    const previousUsedAt = item.usedAt;

    if (item.status === 'Used') {
      item.status = getDaysUntilExpiration(item.expirationDate) < 0 ? 'Expired' : 'Active';
      item.usedAt = null;
    } else {
      item.status = 'Used';
      item.usedAt = Date.now();
    }

    saveVouchers();
    render();

    showSnackbar(
      item.status === 'Used'
        ? `Marked "${item.title}" as Used`
        : `Restored "${item.title}" to ${item.status}`,
      'Undo',
      () => {
        item.status = previousStatus;
        item.usedAt = previousUsedAt;
        saveVouchers();
        render();
      }
    );
  }

  function deleteVoucher(id) {
    const idx = vouchers.findIndex((v) => v.id === id);
    if (idx === -1) return;

    const [removed] = vouchers.splice(idx, 1);
    saveVouchers();
    render();

    showSnackbar(`Deleted "${removed.title}"`, 'Undo', () => {
      vouchers.splice(idx, 0, removed);
      saveVouchers();
      render();
    });
  }

  /* ==========================================================================
     Add / Edit Modal Sheet Logic
     ========================================================================== */
  function openModal(editVoucher = null) {
    els.titleError.hidden = true;
    els.dateError.hidden = true;
    if (els.platformCustomizerPanel) {
      els.platformCustomizerPanel.hidden = true;
    }

    if (editVoucher) {
      els.modalTitle.textContent = 'Edit Voucher';
      els.inputId.value = editVoucher.id;
      els.inputTitle.value = editVoucher.title;
      els.inputCode.value = editVoucher.code || '';
      els.inputStatus.value = editVoucher.status;
      els.inputDesc.value = editVoucher.description || '';
      els.inputReceived.value = editVoucher.dateReceived;
      els.inputExpiration.value = editVoucher.expirationDate;
      renderModalPlatformSelector(editVoucher.platform);
    } else {
      els.modalTitle.textContent = 'Add Voucher';
      els.voucherForm.reset();
      els.inputId.value = '';
      els.inputReceived.value = getTodayISO();
      els.inputExpiration.value = addDaysToTodayISO(7);
      els.inputStatus.value = 'Active';

      const defaultPlat = filterState.platform !== 'All' ? filterState.platform : 'Atome';
      renderModalPlatformSelector(defaultPlat);
    }

    els.modalBackdrop.hidden = false;
    els.modalBackdrop.setAttribute('aria-hidden', 'false');
    setTimeout(() => els.inputTitle.focus(), 60);
  }

  function closeModal() {
    els.modalBackdrop.hidden = true;
    els.modalBackdrop.setAttribute('aria-hidden', 'true');
  }

  function openPlatformManagerModal() {
    renderManagePlatformsList();
    els.platformModalBackdrop.hidden = false;
    els.platformModalBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closePlatformManagerModal() {
    els.platformModalBackdrop.hidden = true;
    els.platformModalBackdrop.setAttribute('aria-hidden', 'true');
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    const title = els.inputTitle.value.trim();
    const code = els.inputCode.value.trim().toUpperCase();
    const description = els.inputDesc.value.trim();
    const dateReceived = els.inputReceived.value;
    const expirationDate = els.inputExpiration.value;
    let status = els.inputStatus.value;

    const selectedPlatformRadio = document.querySelector(
      'input[name="voucher-platform"]:checked'
    );
    const platform = selectedPlatformRadio ? selectedPlatformRadio.value : 'Atome';

    if (!title) {
      els.titleError.hidden = false;
      els.inputTitle.focus();
      return;
    }
    els.titleError.hidden = true;

    if (!dateReceived || !expirationDate) {
      els.dateError.textContent = 'Both Date Received and Expiration Date are required.';
      els.dateError.hidden = false;
      return;
    }
    els.dateError.hidden = true;

    if (status === 'Active' && getDaysUntilExpiration(expirationDate) < 0) {
      status = 'Expired';
    }

    const existingId = els.inputId.value;
    if (existingId) {
      const idx = vouchers.findIndex((v) => v.id === existingId);
      if (idx !== -1) {
        vouchers[idx] = {
          ...vouchers[idx],
          title,
          code,
          description,
          platform,
          dateReceived,
          expirationDate,
          status
        };
      }
      saveVouchers();
      closeModal();
      render();
      showSnackbar(`Updated "${title}"`);
    } else {
      const newVoucher = {
        id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title,
        code,
        description,
        platform,
        dateReceived,
        expirationDate,
        status,
        usedAt: status === 'Used' ? Date.now() : null,
        createdAt: Date.now()
      };
      vouchers.unshift(newVoucher);
      saveVouchers();
      closeModal();
      render();
      showSnackbar(`Added "${title}" to ${platform}`);
    }
  }

  /* ==========================================================================
     Snackbar Notification
     ========================================================================== */
  function showSnackbar(message, actionLabel = null, onAction = null) {
    if (snackbarTimer) clearTimeout(snackbarTimer);

    els.snackbarMsg.textContent = message;
    undoCallback = onAction;

    if (actionLabel && typeof onAction === 'function') {
      els.snackbarActionBtn.textContent = actionLabel;
      els.snackbarActionBtn.hidden = false;
    } else {
      els.snackbarActionBtn.hidden = true;
    }

    els.snackbar.hidden = false;
    snackbarTimer = setTimeout(() => {
      els.snackbar.hidden = true;
      undoCallback = null;
    }, 4500);
  }

  /* ==========================================================================
     Event Listeners
     ========================================================================== */
  function bindEvents() {
    // Platform filter chips & "+ Platform & Colors" trigger
    els.platformFilterGroup.addEventListener('click', (e) => {
      const manageBtn = e.target.closest('#open-platform-manager-chip');
      if (manageBtn) {
        openPlatformManagerModal();
        return;
      }

      const chip = e.target.closest('.m3-filter-chip');
      if (!chip) return;
      const platform = chip.getAttribute('data-platform');
      if (!platform) return;
      filterState.platform = platform;
      render();
    });

    // Status filter chips
    els.statusFilterGroup.addEventListener('click', (e) => {
      const chip = e.target.closest('.m3-status-chip');
      if (!chip) return;
      setStatusFilter(chip.getAttribute('data-status'));
    });

    // Summary strip quick filter buttons
    els.summaryPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const target = pill.getAttribute('data-quick-status');
        const nextStatus = filterState.status === target ? 'All' : target;
        setStatusFilter(nextStatus);
      });
    });

    // Search input
    els.searchInput.addEventListener('input', () => {
      filterState.search = els.searchInput.value;
      els.clearSearchBtn.hidden = filterState.search.length === 0;
      render();
    });

    els.clearSearchBtn.addEventListener('click', () => {
      els.searchInput.value = '';
      filterState.search = '';
      els.clearSearchBtn.hidden = true;
      render();
    });

    // Sort select
    els.sortSelect.addEventListener('change', () => {
      filterState.sortBy = els.sortSelect.value;
      render();
    });

    // Reset filters
    const resetAllFilters = () => {
      filterState.platform = 'All';
      filterState.status = 'All';
      filterState.search = '';
      els.searchInput.value = '';
      els.clearSearchBtn.hidden = true;
      setStatusFilter('All');
    };

    els.resetFiltersBtn.addEventListener('click', resetAllFilters);
    els.emptyResetBtn.addEventListener('click', resetAllFilters);

    // Universal M3 Expressive Tactile Ink Ripple
    document.addEventListener('pointerdown', (e) => {
      const target = e.target.closest(
        'button, .platform-radio-pill, .summary-pill'
      );
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.9;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'm3-ink-ripple';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      target.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    });

    // Card delegated actions (Mark Used, Edit, Delete, Copy Code)
    els.voucherList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');

      if (action === 'toggle-used') {
        toggleUsedStatus(id);
      } else if (action === 'edit') {
        const target = vouchers.find((v) => v.id === id);
        if (target) openModal(target);
      } else if (action === 'delete') {
        deleteVoucher(id);
      } else if (action === 'copy-code') {
        const code = btn.getAttribute('data-code');
        if (code && navigator.clipboard) {
          navigator.clipboard.writeText(code).catch(() => {});
        }
        btn.textContent = 'Copied!';
        btn.classList.add('is-copied');
        setTimeout(() => {
          if (btn.isConnected) {
            btn.textContent = 'Copy';
            btn.classList.remove('is-copied');
          }
        }, 1400);
        showSnackbar(`Copied promo code "${code}"`);
      }
    });

    // In-Modal Platform Radio Change -> Update Color Customizer target
    if (els.modalPlatformGrid) {
      els.modalPlatformGrid.addEventListener('change', (e) => {
        if (e.target && e.target.name === 'voucher-platform') {
          syncCustomizerToSelectedPlatform(e.target.value);
        }
      });
    }

    // Toggle In-Modal Customizer Panel
    if (els.togglePlatformCustomizerBtn) {
      els.togglePlatformCustomizerBtn.addEventListener('click', () => {
        els.platformCustomizerPanel.hidden = !els.platformCustomizerPanel.hidden;
      });
    }

    // Change Selected Platform Tag Color via 16-Circle M3 Palette in Add/Edit Modal
    const applyCurrentModalPlatformColor = (newColor) => {
      const checked = document.querySelector('input[name="voucher-platform"]:checked');
      const platName = checked ? checked.value : 'Atome';
      updatePlatformColor(platName, newColor);
      renderModalPlatformSelector(platName);
      render();
    };

    if (els.modalPaletteGrid) {
      els.modalPaletteGrid.addEventListener('click', (e) => {
        const circle = e.target.closest('.m3-color-circle');
        if (!circle) return;
        const hex = circle.getAttribute('data-swatch-hex');
        if (hex) applyCurrentModalPlatformColor(hex);
      });
    }

    // Add New Platform inside Add/Edit Voucher Modal
    if (els.addPlatformConfirmBtn) {
      els.addPlatformConfirmBtn.addEventListener('click', () => {
        const rawName = els.newPlatformNameInput.value.trim();
        if (!rawName) {
          els.newPlatformNameInput.focus();
          return;
        }
        const defaultColor = M3_PALETTE_16[platforms.length % M3_PALETTE_16.length].hex;
        const created = addOrUpdatePlatform(rawName, defaultColor);
        if (created) {
          els.newPlatformNameInput.value = '';
          renderModalPlatformSelector(created.name);
          render();
          showSnackbar(`Added platform "${created.name}"`);
        }
      });
    }

    // Standalone Platform Manager Modal Events
    if (els.platformModalCloseBtn) {
      els.platformModalCloseBtn.addEventListener('click', closePlatformManagerModal);
    }
    if (els.platformModalDoneBtn) {
      els.platformModalDoneBtn.addEventListener('click', closePlatformManagerModal);
    }
    if (els.platformModalBackdrop) {
      els.platformModalBackdrop.addEventListener('click', (e) => {
        if (e.target === els.platformModalBackdrop) closePlatformManagerModal();
      });
    }

    if (els.managePlatformsList) {
      els.managePlatformsList.addEventListener('click', (e) => {
        const delBtn = e.target.closest('[data-delete-platform]');
        if (delBtn) {
          e.stopPropagation();
          const platName = delBtn.getAttribute('data-delete-platform');
          deleteCustomPlatform(platName);
          showSnackbar(`Removed platform "${platName}"`);
          return;
        }

        const item = e.target.closest('[data-select-manage-platform]');
        if (!item) return;
        activeManagePlatform = item.getAttribute('data-select-manage-platform');
        renderManagePlatformsList();
      });
    }

    if (els.managePaletteGrid) {
      els.managePaletteGrid.addEventListener('click', (e) => {
        const circle = e.target.closest('.m3-color-circle');
        if (!circle) return;
        const hex = circle.getAttribute('data-swatch-hex');
        if (!hex || !activeManagePlatform) return;
        updatePlatformColor(activeManagePlatform, hex);
        renderManagePlatformsList();
        render();
      });
    }

    if (els.manageAddPlatformBtn) {
      els.manageAddPlatformBtn.addEventListener('click', () => {
        const rawName = els.manageNewPlatformName.value.trim();
        if (!rawName) {
          els.manageNewPlatformName.focus();
          return;
        }
        const defaultColor = M3_PALETTE_16[platforms.length % M3_PALETTE_16.length].hex;
        const created = addOrUpdatePlatform(rawName, defaultColor);
        if (created) {
          els.manageNewPlatformName.value = '';
          activeManagePlatform = created.name;
          renderManagePlatformsList();
          render();
          showSnackbar(`Added platform "${created.name}"`);
        }
      });
    }

    //FAB & Modal controls
    els.fabAddVoucher.addEventListener('click', () => openModal(null));
    els.emptyAddBtn.addEventListener('click', () => openModal(null));
    els.modalCloseBtn.addEventListener('click', closeModal);
    els.modalCancelBtn.addEventListener('click', closeModal);

    els.modalBackdrop.addEventListener('click', (e) => {
      if (e.target === els.modalBackdrop) closeModal();
    });

    // Expiry Notification Reminders Modal Controls
    if (els.notifySettingsBtn) {
      els.notifySettingsBtn.addEventListener('click', openNotifyModal);
    }
    if (els.notifyModalCloseBtn) {
      els.notifyModalCloseBtn.addEventListener('click', closeNotifyModal);
    }
    if (els.notifyModalDoneBtn) {
      els.notifyModalDoneBtn.addEventListener('click', closeNotifyModal);
    }
    if (els.notifyModalBackdrop) {
      els.notifyModalBackdrop.addEventListener('click', (e) => {
        if (e.target === els.notifyModalBackdrop) closeNotifyModal();
      });
    }
    if (els.notifyEnableToggleBtn) {
      els.notifyEnableToggleBtn.addEventListener('click', handleToggleNotifications);
    }
    if (els.notifyLeadDaysGroup) {
      els.notifyLeadDaysGroup.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-lead-days]');
        if (!chip) return;
        notifySettings.leadDays = Number(chip.getAttribute('data-lead-days')) || 3;
        saveNotifySettings();
        syncNotifyModalUI();
        render();
        if (notifySettings.enabled) {
          checkAndSendExpiryNotifications(true);
        }
        showSnackbar(`Reminders set to ${notifySettings.leadDays} day${notifySettings.leadDays > 1 ? 's' : ''} before expiry`);
      });
    }
    if (els.sendTestNotificationBtn) {
      els.sendTestNotificationBtn.addEventListener('click', sendTestExpiryNotification);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!els.modalBackdrop.hidden) closeModal();
        if (els.platformModalBackdrop && !els.platformModalBackdrop.hidden) {
          closePlatformManagerModal();
        }
        if (els.notifyModalBackdrop && !els.notifyModalBackdrop.hidden) {
          closeNotifyModal();
        }
      }
    });

    // Quick expiration preset chips (+2d, +7d, +14d, +30d)
    els.presetChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const addDays = Number(chip.getAttribute('data-add-days') || 7);
        els.inputExpiration.value = addDaysToTodayISO(addDays);
      });
    });

    els.voucherForm.addEventListener('submit', (e) => {
      handleFormSubmit(e);
      if (notifySettings.enabled) {
        checkAndSendExpiryNotifications(false);
      }
    });

    // Snackbar undo button
    els.snackbarActionBtn.addEventListener('click', () => {
      if (typeof undoCallback === 'function') {
        undoCallback();
      }
      els.snackbar.hidden = true;
      undoCallback = null;
    });

    // Re-check expiring vouchers whenever app returns to foreground on Android
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && notifySettings.enabled) {
        checkAndSendExpiryNotifications(false);
      }
    });

    // Online / Offline indicator
    const updateOnlineBadge = () => {
      if (!els.connectionText) return;
      els.connectionText.textContent = navigator.onLine
        ? 'Offline-Ready Vault'
        : 'Working Offline (Saved Locally)';
    };
    window.addEventListener('online', updateOnlineBadge);
    window.addEventListener('offline', updateOnlineBadge);
    updateOnlineBadge();
  }

  function setStatusFilter(status) {
    filterState.status = status;
    els.statusFilterGroup
      .querySelectorAll('.m3-status-chip')
      .forEach((c) => c.classList.toggle('is-selected', c.getAttribute('data-status') === status));
    render();
  }

  /* ==========================================================================
     Android Phone Expiry Notifications (Web Notifications API + Service Worker)
     ========================================================================== */
  function loadNotifySettings() {
    try {
      const raw = localStorage.getItem(NOTIFY_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        notifySettings = {
          enabled: Boolean(parsed.enabled),
          leadDays: Number(parsed.leadDays) || DEFAULT_EXPIRING_SOON_DAYS
        };
      }
    } catch (_) {}

    // If browser permission was revoked externally, reflect that
    if ('Notification' in window && Notification.permission !== 'granted') {
      notifySettings.enabled = false;
    }
    syncNotifyModalUI();
  }

  function saveNotifySettings() {
    try {
      localStorage.setItem(NOTIFY_SETTINGS_KEY, JSON.stringify(notifySettings));
    } catch (_) {}
  }

  function openNotifyModal() {
    syncNotifyModalUI();
    els.notifyModalBackdrop.hidden = false;
    els.notifyModalBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closeNotifyModal() {
    els.notifyModalBackdrop.hidden = true;
    els.notifyModalBackdrop.setAttribute('aria-hidden', 'true');
  }

  function syncNotifyModalUI() {
    const supported = 'Notification' in window;
    const perm = supported ? Notification.permission : 'unsupported';
    const isActive = supported && perm === 'granted' && notifySettings.enabled;

    if (els.notifyActiveDot) {
      els.notifyActiveDot.hidden = !isActive;
    }

    if (els.notifyLeadDaysGroup) {
      els.notifyLeadDaysGroup.querySelectorAll('[data-lead-days]').forEach((chip) => {
        const d = Number(chip.getAttribute('data-lead-days'));
        chip.classList.toggle('is-selected', d === notifySettings.leadDays);
      });
    }

    if (!els.notifyEnableToggleBtn) return;

    if (!supported) {
      els.notifyPermissionLabel.textContent = 'Notifications Not Supported';
      els.notifyPermissionSubtext.textContent = 'Install the app on Android Chrome to enable phone alerts.';
      els.notifyEnableToggleBtn.textContent = 'Unavailable';
      els.notifyEnableToggleBtn.disabled = true;
      return;
    }

    if (perm === 'denied') {
      els.notifyPermissionLabel.textContent = 'Permission Blocked in Browser';
      els.notifyPermissionSubtext.textContent = 'Allow notifications in Android Chrome site settings to receive alerts.';
      els.notifyEnableToggleBtn.textContent = 'Blocked';
      return;
    }

    if (isActive) {
      els.notifyPermissionLabel.textContent = 'Expiry Alerts Active';
      els.notifyPermissionSubtext.textContent = `Notifying you ${notifySettings.leadDays} day${notifySettings.leadDays > 1 ? 's' : ''} before any voucher expires.`;
      els.notifyEnableToggleBtn.textContent = 'Turn Off';
      els.notifyEnableToggleBtn.className = 'm3-tonal-btn m3-tonal-btn--sm';
    } else {
      els.notifyPermissionLabel.textContent = 'Enable Phone Notifications';
      els.notifyPermissionSubtext.textContent = 'Receive Android alerts 2–3 days before a voucher expires.';
      els.notifyEnableToggleBtn.textContent = 'Enable Alerts';
      els.notifyEnableToggleBtn.className = 'm3-filled-btn m3-filled-btn--sm';
    }
  }

  async function handleToggleNotifications() {
    if (!('Notification' in window)) {
      showSnackbar('System notifications are not supported in this browser view');
      return;
    }

    if (notifySettings.enabled && Notification.permission === 'granted') {
      notifySettings.enabled = false;
      saveNotifySettings();
      syncNotifyModalUI();
      showSnackbar('Expiry phone notifications paused');
      return;
    }

    let permission = Notification.permission;
    if (permission === 'default') {
      try {
        permission = await Notification.requestPermission();
      } catch (_) {}
    }

    if (permission === 'granted') {
      notifySettings.enabled = true;
      saveNotifySettings();
      syncNotifyModalUI();
      showSnackbar('Expiry phone notifications enabled!');
      await checkAndSendExpiryNotifications(true);
    } else {
      notifySettings.enabled = false;
      saveNotifySettings();
      syncNotifyModalUI();
      showSnackbar('Notification permission was not granted');
    }
  }

  async function dispatchSystemNotification(title, options) {
    if (!('Notification' in window)) return false;

    if (Notification.permission !== 'granted') {
      try {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return false;
      } catch (_) {
        return false;
      }
    }

    // Prefer Service Worker showNotification (required on Android Chrome)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, options);
          return true;
        }
      } catch (_) {}
    }

    try {
      new Notification(title, options);
      return true;
    } catch (_) {
      return false;
    }
  }

  async function checkAndSendExpiryNotifications(forceIgnoreDailyLog = false) {
    if (!notifySettings.enabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const todayISO = getTodayISO();
    let notifiedLog = {};
    try {
      notifiedLog = JSON.parse(localStorage.getItem(NOTIFY_LOG_KEY) || '{}');
    } catch (_) {
      notifiedLog = {};
    }

    const expiringVouchers = vouchers.filter((v) => isExpiringSoon(v));
    let sentCount = 0;

    for (const v of expiringVouchers) {
      const logKey = `${v.id}_${todayISO}`;
      if (!forceIgnoreDailyLog && notifiedLog[logKey]) continue;

      const daysLeft = getDaysUntilExpiration(v.expirationDate);
      const urgencyText = getUrgencyLabel(daysLeft);
      const title = `${v.platform} Voucher: ${urgencyText}`;
      const body = `${v.title}${v.code ? ` (Code: ${v.code})` : ''} expires on ${formatDisplayDate(v.expirationDate)}.`;

      const ok = await dispatchSystemNotification(title, {
        body,
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        tag: `voucher-expiry-${v.id}`,
        renotify: false,
        vibrate: [180, 80, 180],
        data: { voucherId: v.id }
      });

      if (ok) {
        notifiedLog[logKey] = true;
        sentCount++;
      }
    }

    try {
      localStorage.setItem(NOTIFY_LOG_KEY, JSON.stringify(notifiedLog));
    } catch (_) {}

    return sentCount;
  }

  async function sendTestExpiryNotification() {
    const expiring = vouchers.filter((v) => isExpiringSoon(v));
    const sample = expiring[0] || vouchers.find((v) => v.status === 'Active') || {
      id: 'test_v',
      platform: 'Lazada',
      title: '₱200 Off Flash Voucher (Min. ₱800)',
      code: 'LAZFLASH200',
      expirationDate: addDaysToTodayISO(2)
    };

    const daysLeft = Math.max(0, getDaysUntilExpiration(sample.expirationDate));
    const title = `${sample.platform} Voucher · ${getUrgencyLabel(daysLeft)}`;
    const body = `${sample.title}${sample.code ? ` · Code: ${sample.code}` : ''} — Tap to view in Voucher Vault.`;

    const sent = await dispatchSystemNotification(title, {
      body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: 'voucher-vault-test-alert',
      vibrate: [180, 80, 180],
      data: { voucherId: sample.id }
    });

    if (sent) {
      notifySettings.enabled = true;
      saveNotifySettings();
      syncNotifyModalUI();
      showSnackbar(`Sent phone notification for "${sample.title}"`);
    } else {
      showSnackbar(`Preview Alert: ${title} — ${sample.title} (Grant browser permission on Android for system tray alerts)`);
    }
  }

  /* ==========================================================================
     PWA Service Worker & Install Prompt Registration
     ========================================================================== */
  function initPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('./sw.js', { scope: './' })
          .then(async (reg) => {
            console.log('Voucher Vault Service Worker registered:', reg.scope);
            // Register Periodic Background Sync on Android Chrome if supported
            if ('periodicSync' in reg) {
              try {
                await reg.periodicSync.register('voucher-expiry-check', {
                  minInterval: 12 * 60 * 60 * 1000 // every 12 hours
                });
              } catch (_) {}
            }
          })
          .catch((err) => {
            console.warn('Service Worker registration failed:', err);
          });
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        if (!event.data) return;
        if (event.data.type === 'RUN_EXPIRY_CHECK') {
          checkAndSendExpiryNotifications(false);
        } else if (event.data.type === 'NOTIFICATION_CLICKED') {
          setStatusFilter('ExpiringSoon');
        }
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (els.installPwaBtn) {
        els.installPwaBtn.hidden = false;
      }
    });

    if (els.installPwaBtn) {
      els.installPwaBtn.addEventListener('click', async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          els.installPwaBtn.hidden = true;
          showSnackbar('Voucher Vault installed to your device!');
        }
        deferredInstallPrompt = null;
      });
    }

    window.addEventListener('appinstalled', () => {
      if (els.installPwaBtn) els.installPwaBtn.hidden = true;
      deferredInstallPrompt = null;
    });
  }

  /* ==========================================================================
     Bootstrap
     ========================================================================== */
  initTheme();
  loadPlatforms();
  loadNotifySettings();
  loadVouchers();
  bindEvents();
  render();
  initPWA();
  // Automatically check and fire due notifications on launch
  setTimeout(() => checkAndSendExpiryNotifications(false), 800);
})();
