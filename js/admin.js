/**
 * Rukky's Picks - Admin Dashboard Logic (admin.js)
 * Highly responsive dashboard controller for mobile, tablet, and desktop.
 * Manages:
 * 1. Individual Food Items & Prices (Mains, Proteins, Sides, Drinks)
 * 2. Rukky's Engine live meal combinations & budget simulator
 * 3. Daily Specials (Curated Combo Deals)
 * 4. Campus Spots (Canteens)
 * 5. Student Suggestions Queue
 * 6. Cloud Firestore Sync & Management
 */

// State
let allItems = (window.dbService && window.dbService.getItemsSync) ? window.dbService.getItemsSync() : [];
let allCombos = [];
let allSpecials = (window.dbService && window.dbService.getSpecialsSync) ? window.dbService.getSpecialsSync() : [];
let allSpots = (window.dbService && window.dbService.getSpotsSync) ? window.dbService.getSpotsSync() : (window.DEFAULT_SPOTS || []);
let allSuggestions = [];
let currentUser = null;

// Filters State
let currentItemSpotFilter = 'all';
let currentItemCategoryFilter = 'all';
let currentItemSearchTerm = '';
let currentComboBudgetFilter = 'all';

// DOM Elements
const authGate = document.getElementById('authGate');
const passcodeForm = document.getElementById('passcodeForm');
const adminPasscodeInput = document.getElementById('adminPasscodeInput');
const passcodeError = document.getElementById('passcodeError');
const passcodeErrorText = document.getElementById('passcodeErrorText');
const togglePasscodeBtn = document.getElementById('togglePasscodeVisibilityBtn');
const eyeIcon = document.getElementById('eyeIcon');
const quickDemoLoginBtn = document.getElementById('quickDemoLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userEmailBadge = document.getElementById('userEmailBadge');
const cloudStatusBadge = document.getElementById('cloudStatusBadge');
const cloudStatusText = document.getElementById('cloudStatusText');

// Modals
const itemModal = document.getElementById('itemModal');
const specialModal = document.getElementById('specialModal');
const spotModal = document.getElementById('spotModal');
const toast = document.getElementById('toast');

// --- Notification Toast ---
function showToast(msg, icon = '✨') {
  const toastMsg = document.getElementById('toastMsg');
  const toastIcon = document.getElementById('toastIcon');
  if (toastMsg) toastMsg.textContent = msg;
  if (toastIcon) toastIcon.textContent = icon;
  if (toast) {
    toast.classList.remove('opacity-0', 'pointer-events-none');
    setTimeout(() => {
      toast.classList.add('opacity-0', 'pointer-events-none');
    }, 3200);
  }
}

// --- Auth Handling (Passcode Only) ---
function initAuth() {
  const submitBtn = document.getElementById('unlockAdminBtn');

  // Eye toggle to show/hide passcode
  if (togglePasscodeBtn && adminPasscodeInput) {
    togglePasscodeBtn.addEventListener('click', () => {
      const isPassword = adminPasscodeInput.type === 'password';
      adminPasscodeInput.type = isPassword ? 'text' : 'password';
      if (eyeIcon) {
        eyeIcon.innerHTML = isPassword
          ? '<path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path>'
          : '<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>';
      }
    });
  }

  window.authService.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
      if (authGate) authGate.classList.add('hidden');
      if (userEmailBadge) userEmailBadge.textContent = 'Admin (Unlocked 🛡️)';
      updateCloudStatus();
      initDataListeners();
    } else {
      if (authGate) authGate.classList.remove('hidden');
      if (adminPasscodeInput) {
        adminPasscodeInput.focus();
      }
    }
  });

  if (passcodeForm) {
    passcodeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = adminPasscodeInput ? adminPasscodeInput.value.trim() : '';

      if (passcodeError) passcodeError.classList.add('hidden');

      if (!code) {
        if (passcodeError) {
          if (passcodeErrorText) passcodeErrorText.textContent = "Please enter the admin passcode.";
          passcodeError.classList.remove('hidden');
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Verifying... ⏳";
      }

      try {
        const user = window.authService.loginWithPasscode(code);
        currentUser = user;
        if (authGate) authGate.classList.add('hidden');
        if (userEmailBadge) userEmailBadge.textContent = 'Admin (Unlocked 🛡️)';
        updateCloudStatus();
        initDataListeners();
        showToast('Portal unlocked! Welcome, Admin 👋', '🔓');
      } catch (err) {
        if (passcodeError) {
          if (passcodeErrorText) passcodeErrorText.textContent = err.message || "Incorrect passcode. Please try again.";
          passcodeError.classList.remove('hidden');
        }
        if (adminPasscodeInput) {
          adminPasscodeInput.classList.add('border-red-500', 'bg-red-50/50');
          setTimeout(() => {
            adminPasscodeInput.classList.remove('border-red-500', 'bg-red-50/50');
          }, 1500);
          adminPasscodeInput.select();
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = "<span>🔓 Unlock Admin Portal</span>";
        }
      }
    });
  }

  if (quickDemoLoginBtn) {
    quickDemoLoginBtn.addEventListener('click', () => {
      const defaultPass = window.authService.getAdminPasscode ? window.authService.getAdminPasscode() : 'admin123';
      if (adminPasscodeInput) adminPasscodeInput.value = defaultPass;
      try {
        const user = window.authService.loginWithPasscode(defaultPass);
        currentUser = user;
        if (authGate) authGate.classList.add('hidden');
        if (userEmailBadge) userEmailBadge.textContent = 'Admin (Unlocked 🛡️)';
        updateCloudStatus();
        initDataListeners();
        showToast('Portal unlocked with passcode! 🚀', '🚀');
      } catch (err) {
        alert(err.message);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await window.authService.logout();
      currentUser = null;
      if (authGate) authGate.classList.remove('hidden');
      if (adminPasscodeInput) {
        adminPasscodeInput.value = '';
        adminPasscodeInput.focus();
      }
      showToast('Admin Portal Locked 🔒', '🔒');
    });
  }

  // Change Admin Passcode in Tab 6 Settings
  const changePasscodeForm = document.getElementById('changePasscodeForm');
  if (changePasscodeForm) {
    const newPasscodeInput = document.getElementById('newPasscodeInput');
    if (newPasscodeInput && window.authService.getAdminPasscode) {
      newPasscodeInput.value = window.authService.getAdminPasscode();
    }
    changePasscodeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newCode = newPasscodeInput ? newPasscodeInput.value.trim() : '';
      if (!newCode) {
        alert('Please enter a valid passcode.');
        return;
      }
      try {
        window.authService.setAdminPasscode(newCode);
        showToast(`Admin passcode updated to "${newCode}"! 🔑`, '🔑');
      } catch (err) {
        alert('Error updating passcode: ' + err.message);
      }
    });
  }
}

function updateCloudStatus() {
  if (!cloudStatusBadge || !cloudStatusText) return;
  if (window.dbService.isUsingFirebase()) {
    cloudStatusBadge.className = "text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center space-x-1.5";
    cloudStatusText.textContent = "Firebase Live ☁️";
  } else {
    cloudStatusBadge.className = "text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1 rounded-full font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center space-x-1.5";
    cloudStatusText.textContent = "Local Storage Mode 📦";
  }
}

// Update badges on navigation tabs
function updateTabBadges() {
  const pItems = document.getElementById('tabItemsPill');
  if (pItems) pItems.textContent = allItems.length;

  const pCombos = document.getElementById('tabCombosPill');
  if (pCombos) pCombos.textContent = allCombos.length;

  const pSpecials = document.getElementById('tabSpecialsPill');
  if (pSpecials) pSpecials.textContent = allSpecials.length;

  const pSpots = document.getElementById('tabSpotsPill');
  if (pSpots) pSpots.textContent = allSpots.length;

  const pSugg = document.getElementById('tabSuggestionPill');
  if (pSugg) {
    pSugg.textContent = allSuggestions.length;
    if (allSuggestions.length > 0) pSugg.classList.remove('hidden');
    else pSugg.classList.add('hidden');
  }
}

// --- Data Listeners ---
let dataListenersInitialized = false;
function initDataListeners() {
  if (dataListenersInitialized) return;
  dataListenersInitialized = true;

  // 1. Listen Items
  window.dbService.listenItems(items => {
    allItems = items || [];
    const statItems = document.getElementById('statItemsCount');
    if (statItems) statItems.textContent = allItems.length;
    renderItemsTable();
    updateEngineCombos();
    updateTabBadges();
  });

  // 2. Listen Spots
  window.dbService.listenSpots(spots => {
    allSpots = spots || [];
    const statSpots = document.getElementById('statSpotsCount');
    if (statSpots) statSpots.textContent = allSpots.length;
    renderSpotsGrid();
    populateSpotSelects();
    renderItemsTable();
    updateEngineCombos();
    updateTabBadges();
  });

  // 3. Listen Specials
  window.dbService.listenSpecials(specials => {
    allSpecials = specials || [];
    const statSpecials = document.getElementById('statSpecialsCount');
    if (statSpecials) statSpecials.textContent = allSpecials.length;
    renderSpecialsGrid();
    updateTabBadges();
  });

  // 4. Listen Suggestions
  window.dbService.listenSuggestions(suggestions => {
    allSuggestions = suggestions || [];
    const statSugg = document.getElementById('statSuggestionsCount');
    if (statSugg) statSugg.textContent = allSuggestions.length;
    renderSuggestionsList();
    updateTabBadges();
  });

  // 5. Listen Engine Rules
  if (window.dbService && window.dbService.listenEngineRules) {
    window.dbService.listenEngineRules(rules => {
      syncEngineRulesForm(rules);
      updateEngineCombos();
    });
  }

  // Initialize Engine Rules and Backup Features
  initEngineRulesUI();
  initBackupUI();
}

// --- Tab Navigation ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.getAttribute('data-tab');

    // Button states
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.className = "tab-btn px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-stone-200 text-stone-700 hover:bg-stone-300 transition shrink-0 whitespace-nowrap flex items-center space-x-1.5 active:scale-95 min-h-[40px]";
    });
    btn.className = "tab-btn px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-stone-900 text-white transition shrink-0 whitespace-nowrap flex items-center space-x-1.5 active:scale-95 min-h-[40px]";

    // Tab content visibility
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
    const targetContent = document.getElementById(targetTab);
    if (targetContent) targetContent.classList.remove('hidden');
  });
});

// Category Tag Helper
function getItemCategoryBadge(type) {
  switch (type) {
    case 'main':
      return `<span class="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">🍚 Main</span>`;
    case 'protein':
      return `<span class="bg-amber-50 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200 shrink-0">🍗 Protein</span>`;
    case 'side':
      return `<span class="bg-orange-50 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-orange-200 shrink-0">🍟 Side</span>`;
    case 'drink':
      return `<span class="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-200 shrink-0">🥤 Drink</span>`;
    default:
      return `<span class="bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">🍲 Food Item</span>`;
  }
}

// --- RENDER FOOD ITEMS TABLE & MOBILE CARDS ---
function renderItemsTable() {
  const tbody = document.getElementById('itemsTableBody');
  const mobileList = document.getElementById('itemsMobileList');
  if (!tbody && !mobileList) return;

  const spotsMap = new Map();
  allSpots.forEach(s => spotsMap.set(s.id, s.name));

  let filtered = [...allItems];

  // 1. Spot Filter
  if (currentItemSpotFilter !== 'all') {
    filtered = filtered.filter(it => it.spotId === currentItemSpotFilter);
  }

  // 2. Category Filter
  if (currentItemCategoryFilter !== 'all') {
    filtered = filtered.filter(it => it.type === currentItemCategoryFilter);
  }

  // 3. Search Term
  if (currentItemSearchTerm) {
    filtered = filtered.filter(it => (it.name || '').toLowerCase().includes(currentItemSearchTerm));
  }

  if (!filtered.length) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-stone-400">No items match your filter. Click "+ Add Food Item" or adjust search.</td></tr>`;
    if (mobileList) {
      mobileList.innerHTML = `<div class="bg-white p-6 rounded-2xl border border-dashed border-stone-300 text-center text-stone-400 text-xs">No food items found matching this filter. Tap "+ Add Food Item" above.</div>`;
    }
    return;
  }

  // Desktop Table (>= md)
  if (tbody) {
    tbody.innerHTML = filtered.map(item => {
      const spotName = spotsMap.get(item.spotId) || item.spotName || 'Campus Canteen';
      const isAvail = item.available !== false;

      return `
        <tr class="hover:bg-stone-50/80 transition">
          <td class="py-3 px-4 font-bold text-stone-900 flex items-center space-x-2">
            <span class="truncate">${item.name}</span>
          </td>
          <td class="py-3 px-4 text-stone-600 font-semibold text-xs">${spotName}</td>
          <td class="py-3 px-4 font-extrabold text-stone-900 font-display text-sm">₦${Number(item.price).toLocaleString()}</td>
          <td class="py-3 px-4">${getItemCategoryBadge(item.type)}</td>
          <td class="py-3 px-4">
            <button onclick="toggleItemAvail('${item.id}')" class="px-2.5 py-1 rounded-full text-[10px] font-bold active:scale-95 transition ${isAvail ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-stone-200 text-stone-600 hover:bg-stone-300'}">
              ${isAvail ? '● In Stock' : '○ Sold Out'}
            </button>
          </td>
          <td class="py-3 px-4 text-right space-x-1.5">
            <button onclick="editItem('${item.id}')" class="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold transition">Edit</button>
            <button onclick="deleteItem('${item.id}')" class="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold transition">Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Mobile Cards (< md)
  if (mobileList) {
    mobileList.innerHTML = filtered.map(item => {
      const spotName = spotsMap.get(item.spotId) || item.spotName || 'Campus Canteen';
      const isAvail = item.available !== false;

      return `
        <div class="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-sm flex flex-col justify-between space-y-2.5">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <div class="flex items-center space-x-1.5 mb-1">
                ${getItemCategoryBadge(item.type)}
                <span class="text-[11px] text-stone-500 font-medium truncate">📍 ${spotName}</span>
              </div>
              <h4 class="font-extrabold text-stone-900 text-sm leading-snug truncate ${!isAvail ? 'line-through text-stone-400' : ''}">${item.name}</h4>
            </div>
            <div class="text-right shrink-0">
              <span class="font-black text-brand-600 font-display text-base">₦${Number(item.price).toLocaleString()}</span>
            </div>
          </div>

          <div class="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
            <button onclick="toggleItemAvail('${item.id}')" class="px-3 py-1 rounded-xl text-xs font-bold transition active:scale-95 ${isAvail ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-stone-100 text-stone-500 border border-stone-200'}">
              ${isAvail ? '✓ In Stock' : '✗ Sold Out'}
            </button>
            <div class="flex items-center space-x-1">
              <button onclick="editItem('${item.id}')" class="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 rounded-xl font-bold transition text-xs flex items-center space-x-1">
                <span>✏️ Edit</span>
              </button>
              <button onclick="deleteItem('${item.id}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 rounded-xl font-bold transition text-xs flex items-center space-x-1">
                <span>🗑️</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// --- UPDATE RUKKY'S ENGINE COMBOS ---
function updateEngineCombos() {
  if (!window.RukkysEngine) return;

  const generatedCombos = window.RukkysEngine.generateCombos(allItems, allSpots);
  allCombos = generatedCombos;

  const statCombos = document.getElementById('statCombosCount');
  if (statCombos) statCombos.textContent = generatedCombos.length;

  const badge = document.getElementById('engineCombosBadge');
  if (badge) badge.textContent = `${generatedCombos.length} Combos Generated`;

  renderCombosTable();
}

// --- RENDER ENGINE COMBOS TABLE & MOBILE CARDS ---
function renderCombosTable() {
  const tbody = document.getElementById('combosTableBody');
  const mobileList = document.getElementById('combosMobileList');
  if (!tbody && !mobileList) return;

  let filtered = [...allCombos];

  // Apply Budget Simulator Filter
  if (currentComboBudgetFilter !== 'all') {
    const maxBudget = parseFloat(currentComboBudgetFilter);
    filtered = filtered.filter(c => c.price <= maxBudget);
  }

  if (!filtered.length) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-stone-400">No combos generated under this budget filter.</td></tr>`;
    if (mobileList) {
      mobileList.innerHTML = `<div class="bg-white p-6 rounded-2xl border border-dashed border-stone-300 text-center text-stone-400 text-xs">No combos found matching this budget. Try selecting a higher budget simulator pill.</div>`;
    }
    return;
  }

  // Desktop Table (>= md)
  if (tbody) {
    tbody.innerHTML = filtered.slice(0, 60).map(combo => {
      const badgeCategory = {
        heavy: 'bg-rose-100 text-rose-700',
        fast: 'bg-amber-100 text-amber-700',
        night: 'bg-indigo-100 text-indigo-700',
        budget: 'bg-emerald-100 text-emerald-700'
      }[combo.category] || 'bg-stone-100 text-stone-700';

      const itemsSummary = (combo.items || []).map(it => `${it.name} (₦${it.price})`).join(' + ');

      return `
        <tr class="hover:bg-stone-50/80 transition">
          <td class="py-3 px-4">
            <div class="font-bold text-stone-900">${combo.title}</div>
            <div class="text-[11px] text-stone-500 line-clamp-1 mt-0.5">${combo.rukkysVerdict || ''}</div>
          </td>
          <td class="py-3 px-4 text-stone-600 font-semibold text-xs">${combo.spotName || 'Campus Spot'}</td>
          <td class="py-3 px-4 font-extrabold text-stone-900 font-display text-sm">₦${combo.price.toLocaleString()}</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badgeCategory}">${combo.category}</span>
          </td>
          <td class="py-3 px-4 text-stone-500 text-xs max-w-xs truncate" title="${itemsSummary}">${itemsSummary}</td>
          <td class="py-3 px-4">
            <span class="font-bold text-amber-600">${combo.rating || '9.5/10'}</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Mobile Cards (< md)
  if (mobileList) {
    mobileList.innerHTML = filtered.slice(0, 35).map(combo => {
      const itemsListHtml = (combo.items || []).map(it => `
        <li class="flex items-center justify-between text-[11px] py-1 border-b border-stone-100 last:border-0">
          <span class="text-stone-700 truncate">${it.name}</span>
          <span class="font-bold text-stone-600 ml-2 font-display">₦${Number(it.price).toLocaleString()}</span>
        </li>
      `).join('');

      return `
        <div class="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-sm space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-[10px] bg-brand-50 text-brand-700 border border-brand-200 font-black px-2 py-0.5 rounded uppercase">${combo.vibeBadge || combo.category}</span>
            <span class="font-black text-brand-600 font-display text-base">₦${combo.price.toLocaleString()}</span>
          </div>
          <h4 class="font-extrabold text-stone-900 text-sm leading-snug">${combo.title}</h4>
          <p class="text-xs text-stone-500 font-medium">📍 ${combo.spotName}</p>
          
          <div class="bg-stone-50 p-2.5 rounded-xl border border-stone-100 mt-2">
            <span class="text-[9px] font-black text-stone-400 uppercase tracking-wider block mb-1">Rukky's Formula:</span>
            <ul class="space-y-0.5">
              ${itemsListHtml}
            </ul>
          </div>

          <div class="text-[11px] text-stone-600 italic bg-amber-50/60 p-2 rounded-xl border border-amber-200/60 flex items-start gap-1.5 mt-1">
            <span>💬</span>
            <span class="leading-relaxed">"${combo.rukkysVerdict || 'A satisfying campus meal.'}"</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

// --- RENDER SPECIALS GRID ---
function renderSpecialsGrid() {
  const grid = document.getElementById('specialsGrid');
  if (!grid) return;

  if (!allSpecials.length) {
    grid.innerHTML = `<div class="col-span-full bg-white p-8 rounded-2xl border border-dashed border-stone-200 text-center text-stone-400 text-xs">No special food deals right now. Click "+ Add Daily Deal" to post one.</div>`;
    return;
  }

  grid.innerHTML = allSpecials.map(spec => `
    <div class="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm flex flex-col justify-between space-y-3">
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">${spec.badge || 'Daily Deal'}</span>
          <span class="font-extrabold text-stone-900 font-display text-base">₦${spec.price.toLocaleString()}</span>
        </div>
        <h4 class="font-bold text-stone-900 text-sm leading-snug">${spec.title}</h4>
        <p class="text-xs text-stone-500 font-medium mt-1">📍 ${spec.vendor}</p>
        <p class="text-xs text-stone-600 mt-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100 italic">"${spec.rukkysPitch || ''}"</p>
      </div>

      <div class="pt-2 border-t border-stone-100 flex items-center justify-end text-xs">
        <div class="space-x-1 shrink-0">
          <button onclick="editSpecial('${spec.id}')" class="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 rounded-lg font-bold transition text-xs">Edit</button>
          <button onclick="deleteSpecial('${spec.id}')" class="px-2.5 py-1 bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 rounded-lg font-bold transition text-xs">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

// --- RENDER SPOTS GRID ---
function renderSpotsGrid() {
  const grid = document.getElementById('spotsGrid');
  if (!grid) return;

  if (!allSpots.length) {
    grid.innerHTML = `<div class="col-span-full bg-white p-8 rounded-2xl border border-dashed border-stone-200 text-center text-stone-400 text-xs">No campus spots added yet. Tap "+ Add Campus Spot" above.</div>`;
    return;
  }

  grid.innerHTML = allSpots.map(spot => `
    <div class="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-2.5 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-bold uppercase">${spot.tag}</span>
          <span class="text-[11px] text-stone-400 font-medium">🕒 ${spot.timing || 'All day'}</span>
        </div>
        <h4 class="font-bold text-stone-900 text-sm">${spot.name}</h4>
        <p class="text-xs text-stone-600 mt-1">${spot.description || 'Campus food canteen'}</p>
      </div>
      <div class="pt-2 border-t border-stone-100 flex justify-end space-x-1 text-xs">
        <button onclick="editSpot('${spot.id}')" class="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 rounded-lg font-bold transition text-xs">Edit</button>
        <button onclick="deleteSpot('${spot.id}')" class="px-2.5 py-1 bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 rounded-lg font-bold transition text-xs">Delete</button>
      </div>
    </div>
  `).join('');
}

// --- RENDER SUGGESTIONS QUEUE ---
function renderSuggestionsList() {
  const list = document.getElementById('suggestionsList');
  if (!list) return;

  if (!allSuggestions.length) {
    list.innerHTML = `
      <div class="bg-white rounded-2xl p-8 border border-dashed border-stone-200 text-center">
        <div class="text-3xl mb-2">🎉</div>
        <p class="font-bold text-stone-800 text-sm">No Pending Suggestions</p>
        <p class="text-xs text-stone-400 mt-0.5">When students submit meal suggestions on the student app, they will appear here for review.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = allSuggestions.map(s => `
    <div class="bg-white rounded-2xl p-4 border border-purple-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center space-x-2">
          <span class="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold text-[10px] rounded-full uppercase">Student Suggestion</span>
          <span class="text-xs font-bold text-stone-900">From: ${s.suggesterName}</span>
        </div>
        <p class="font-bold text-stone-900 text-sm">${s.suggestedItems}</p>
        <div class="flex items-center space-x-3 text-xs text-stone-500">
          <span>Cost: <strong class="text-stone-800">₦${parseFloat(s.suggestedPrice || 0).toLocaleString()}</strong></span>
          <span>•</span>
          <span>Location: <strong class="text-stone-800">${s.suggestedSpot || 'Campus Spot'}</strong></span>
        </div>
      </div>

      <div class="flex items-center space-x-2 w-full sm:w-auto shrink-0">
        <button onclick="approveSuggestionModal('${s.id}')" class="flex-1 sm:flex-initial px-3.5 py-2 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center space-x-1">
          <span>✅ Approve as Food Item</span>
        </button>
        <button onclick="deleteSuggestion('${s.id}')" class="px-3 py-2 bg-stone-100 hover:bg-stone-200 active:scale-98 text-stone-600 font-bold text-xs rounded-xl transition">
          Dismiss
        </button>
      </div>
    </div>
  `).join('');
}

// Populate Spots Dropdowns
function populateSpotSelects() {
  const itemSelect = document.getElementById('itemSpotSelect');
  if (itemSelect) {
    itemSelect.innerHTML = allSpots.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  }

  const filterSelect = document.getElementById('itemSpotFilterSelect');
  if (filterSelect) {
    filterSelect.innerHTML = `<option value="all">All Canteens (${allSpots.length})</option>` +
      allSpots.map(s => `<option value="${s.id}" ${currentItemSpotFilter === s.id ? 'selected' : ''}>${s.name}</option>`).join('');
  }
}

// --- ITEM FILTERS & SEARCH LISTENERS ---
const spotFilterEl = document.getElementById('itemSpotFilterSelect');
if (spotFilterEl) {
  spotFilterEl.addEventListener('change', (e) => {
    currentItemSpotFilter = e.target.value;
    renderItemsTable();
  });
}

const itemSearchEl = document.getElementById('itemSearchInput');
if (itemSearchEl) {
  itemSearchEl.addEventListener('input', (e) => {
    currentItemSearchTerm = e.target.value.toLowerCase().trim();
    renderItemsTable();
  });
}

// Category filter pills
document.querySelectorAll('.admin-category-filter').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-category-filter').forEach(b => {
      b.className = "admin-category-filter px-3 py-1.5 rounded-full font-bold bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 shrink-0 transition";
    });
    btn.className = "admin-category-filter active px-3 py-1.5 rounded-full font-bold bg-stone-900 text-white shadow-sm shrink-0 transition";
    currentItemCategoryFilter = btn.getAttribute('data-category');
    renderItemsTable();
  });
});

// Budget Simulator pills for Rukky's Engine
document.querySelectorAll('.budget-sim-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.budget-sim-pill').forEach(b => {
      b.className = "budget-sim-pill px-3 py-1.5 rounded-full font-bold bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200 shrink-0 transition";
    });
    btn.className = "budget-sim-pill active px-3 py-1.5 rounded-full font-bold bg-stone-900 text-white shadow-sm shrink-0 transition";
    currentComboBudgetFilter = btn.getAttribute('data-budget');
    const simStatus = document.getElementById('budgetSimStatus');
    if (simStatus) {
      simStatus.textContent = currentComboBudgetFilter === 'all'
        ? 'Showing all generated combos'
        : `Testing combos ≤ ₦${Number(currentComboBudgetFilter).toLocaleString()}`;
    }
    renderCombosTable();
  });
});

// --- FOOD ITEM ACTIONS (CRUD) ---
const openAddItemBtn = document.getElementById('openAddItemBtn');
if (openAddItemBtn) {
  openAddItemBtn.addEventListener('click', () => {
    document.getElementById('itemModalTitle').textContent = "Add Food Item & Price";
    document.getElementById('itemForm').reset();
    document.getElementById('itemEditId').value = "";
    document.getElementById('itemAvailable').checked = true;
    itemModal.classList.remove('hidden');
  });
}

window.editItem = (id) => {
  const it = allItems.find(item => item.id === id);
  if (!it) return;

  document.getElementById('itemModalTitle').textContent = "Edit Food Item";
  document.getElementById('itemEditId').value = it.id;
  document.getElementById('itemName').value = it.name;
  document.getElementById('itemPrice').value = it.price;
  document.getElementById('itemCategory').value = it.type || 'main';
  document.getElementById('itemSpotSelect').value = it.spotId || (allSpots[0] ? allSpots[0].id : '');
  document.getElementById('itemAvailable').checked = it.available !== false;

  itemModal.classList.remove('hidden');
};

const itemForm = document.getElementById('itemForm');
if (itemForm) {
  itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('itemEditId').value;
    const spotSelect = document.getElementById('itemSpotSelect');
    const selectedOption = spotSelect.options[spotSelect.selectedIndex];
    const spotName = selectedOption ? selectedOption.textContent : 'Campus Spot';

    const payload = {
      name: document.getElementById('itemName').value.trim(),
      price: parseFloat(document.getElementById('itemPrice').value),
      type: document.getElementById('itemCategory').value,
      spotId: spotSelect.value,
      spotName: spotName,
      available: document.getElementById('itemAvailable').checked
    };

    try {
      if (id) {
        await window.dbService.updateItem(id, payload);
        showToast('Food item updated! Rukky’s Engine updated combos.', '✏️');
      } else {
        await window.dbService.addItem(payload);
        showToast('Food item added! Rukky’s Engine mixed new combos.', '🎉');
      }
      itemModal.classList.add('hidden');
    } catch (err) {
      alert('Error saving item: ' + err.message);
    }
  });
}

window.deleteItem = async (id) => {
  const it = allItems.find(item => item.id === id);
  if (confirm(`Are you sure you want to delete "${it?.name || 'this item'}"?`)) {
    await window.dbService.deleteItem(id);
    showToast('Food item deleted', '🗑️');
  }
};

window.toggleItemAvail = async (id) => {
  const it = allItems.find(item => item.id === id);
  if (!it) return;
  const next = it.available === false ? true : false;
  await window.dbService.updateItem(id, { available: next });
  showToast(next ? `"${it.name}" marked In Stock` : `"${it.name}" marked Sold Out`, next ? '✅' : '⏸️');
};

// --- SPECIALS ACTIONS ---
const openAddSpecialBtn = document.getElementById('openAddSpecialBtn');
if (openAddSpecialBtn) {
  openAddSpecialBtn.addEventListener('click', () => {
    document.getElementById('specialModalTitle').textContent = "Add Daily Deal";
    document.getElementById('specialForm').reset();
    document.getElementById('specialEditId').value = "";
    specialModal.classList.remove('hidden');
  });
}

window.editSpecial = (id) => {
  const s = allSpecials.find(item => item.id === id);
  if (!s) return;
  document.getElementById('specialModalTitle').textContent = "Edit Daily Deal";
  document.getElementById('specialEditId').value = s.id;
  document.getElementById('specialVendor').value = s.vendor;
  document.getElementById('specialBadge').value = s.badge;
  document.getElementById('specialTitle').value = s.title;
  document.getElementById('specialPrice').value = s.price;
  document.getElementById('specialPitch').value = s.rukkysPitch || '';
  specialModal.classList.remove('hidden');
};

const specialForm = document.getElementById('specialForm');
if (specialForm) {
  specialForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('specialEditId').value;
    const payload = {
      vendor: document.getElementById('specialVendor').value.trim(),
      badge: document.getElementById('specialBadge').value.trim(),
      title: document.getElementById('specialTitle').value.trim(),
      price: parseFloat(document.getElementById('specialPrice').value),
      rukkysPitch: document.getElementById('specialPitch').value.trim(),
      active: true
    };

    try {
      if (id) {
        await window.dbService.updateSpecial(id, payload);
        showToast('Daily deal updated!', '✏️');
      } else {
        await window.dbService.addSpecial(payload);
        showToast('Daily deal posted to the campus board!', '🌟');
      }
      specialModal.classList.add('hidden');
    } catch (err) {
      alert('Error saving daily deal: ' + err.message);
    }
  });
}

window.deleteSpecial = async (id) => {
  if (confirm('Are you sure you want to delete this daily deal?')) {
    await window.dbService.deleteSpecial(id);
    showToast('Daily deal removed', '🗑️');
  }
};

// --- SPOTS ACTIONS ---
const openAddSpotBtn = document.getElementById('openAddSpotBtn');
if (openAddSpotBtn) {
  openAddSpotBtn.addEventListener('click', () => {
    document.getElementById('spotModalTitle').textContent = "Add Campus Food Spot";
    document.getElementById('spotForm').reset();
    document.getElementById('spotEditId').value = "";
    spotModal.classList.remove('hidden');
  });
}

window.editSpot = (id) => {
  const sp = allSpots.find(item => item.id === id);
  if (!sp) return;
  document.getElementById('spotModalTitle').textContent = "Edit Campus Food Spot";
  document.getElementById('spotEditId').value = sp.id;
  document.getElementById('spotName').value = sp.name;
  document.getElementById('spotTag').value = sp.tag;
  document.getElementById('spotTiming').value = sp.timing || '';
  document.getElementById('spotDescription').value = sp.description || '';
  spotModal.classList.remove('hidden');
};

const spotForm = document.getElementById('spotForm');
if (spotForm) {
  spotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('spotEditId').value;
    const payload = {
      name: document.getElementById('spotName').value.trim(),
      tag: document.getElementById('spotTag').value.trim(),
      timing: document.getElementById('spotTiming').value.trim(),
      description: document.getElementById('spotDescription').value.trim()
    };

    try {
      if (id) {
        await window.dbService.updateSpot(id, payload);
        showToast('Food spot updated!', '✏️');
      } else {
        await window.dbService.addSpot(payload);
        showToast('Campus food spot added!', '📍');
      }
      spotModal.classList.add('hidden');
    } catch (err) {
      alert('Error saving spot: ' + err.message);
    }
  });
}

window.deleteSpot = async (id) => {
  if (confirm('Are you sure you want to delete this food spot?')) {
    await window.dbService.deleteSpot(id);
    showToast('Food spot removed', '🗑️');
  }
};

// --- SUGGESTIONS ACTIONS ---
window.approveSuggestionModal = async (id) => {
  const s = allSuggestions.find(item => item.id === id);
  if (!s) return;

  // Open item modal pre-filled
  document.getElementById('itemModalTitle').textContent = "Approve Student Suggestion";
  document.getElementById('itemEditId').value = "";
  document.getElementById('itemName').value = s.suggestedItems;
  document.getElementById('itemPrice').value = s.suggestedPrice;
  document.getElementById('itemCategory').value = 'main';
  document.getElementById('itemAvailable').checked = true;

  itemModal.classList.remove('hidden');

  // Remove from suggestions on approval
  await window.dbService.deleteSuggestion(id);
};

window.deleteSuggestion = async (id) => {
  if (confirm('Are you sure you want to dismiss this student suggestion?')) {
    await window.dbService.deleteSuggestion(id);
    showToast('Suggestion removed from queue', '🗑️');
  }
};

// --- FIREBASE CONFIG FORM ---
const fbForm = document.getElementById('firebaseConfigForm');
if (fbForm) {
  const existingConfig = window.dbService.getSavedConfig();
  if (existingConfig) {
    document.getElementById('fbApiKey').value = existingConfig.apiKey || '';
    document.getElementById('fbProjectId').value = existingConfig.projectId || '';
    document.getElementById('fbAuthDomain').value = existingConfig.authDomain || '';
    document.getElementById('fbStorageBucket').value = existingConfig.storageBucket || '';
    document.getElementById('fbSenderId').value = existingConfig.messagingSenderId || '';
    document.getElementById('fbAppId').value = existingConfig.appId || '';
  }

  fbForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cfg = {
      apiKey: document.getElementById('fbApiKey').value.trim(),
      projectId: document.getElementById('fbProjectId').value.trim(),
      authDomain: document.getElementById('fbAuthDomain').value.trim(),
      storageBucket: document.getElementById('fbStorageBucket').value.trim(),
      messagingSenderId: document.getElementById('fbSenderId').value.trim(),
      appId: document.getElementById('fbAppId').value.trim()
    };

    if (!cfg.apiKey || !cfg.projectId) {
      alert('Please enter at least an API Key and Project ID');
      return;
    }

    window.dbService.saveFirebaseConfig(cfg);
    showToast('Firebase configuration saved! Reloading...', '☁️');
    setTimeout(() => window.location.reload(), 1200);
  });
}

const clearFbBtn = document.getElementById('clearFbConfigBtn');
if (clearFbBtn) {
  clearFbBtn.addEventListener('click', () => {
    if (confirm('Clear Firebase config and return to local storage demo mode?')) {
      window.dbService.clearFirebaseConfig();
      showToast('Cleared Firebase config', '🔄');
      setTimeout(() => window.location.reload(), 1000);
    }
  });
}

// --- CLOUD FIRESTORE DIRECT WIPER & COUNTER ---
const checkCloudBtn = document.getElementById('checkCloudStatusBtn');
const statsBar = document.getElementById('cloudStatsBar');
if (checkCloudBtn) {
  checkCloudBtn.addEventListener('click', async () => {
    try {
      checkCloudBtn.disabled = true;
      checkCloudBtn.textContent = "Checking Cloud...";
      const stats = await window.dbService.getCloudStats();
      if (statsBar) {
        statsBar.classList.remove('hidden');
        document.getElementById('cloudItemsBadge').innerHTML = `Items: <b class="text-stone-900">${stats.items}</b>`;
        document.getElementById('cloudCombosBadge').innerHTML = `Combos: <b class="text-stone-900">${stats.combos}</b>`;
        document.getElementById('cloudSpecialsBadge').innerHTML = `Specials: <b class="text-stone-900">${stats.specials}</b>`;
        document.getElementById('cloudSpotsBadge').innerHTML = `Spots: <b class="text-stone-900">${stats.spots}</b>`;
      }
      showToast(`Cloud checked: ${stats.items} items, ${stats.combos} combos found in cloud.`, '☁️');
    } catch (err) {
      alert("Error checking cloud status: " + err.message);
    } finally {
      checkCloudBtn.disabled = false;
      checkCloudBtn.textContent = "🔍 Check Cloud Counts";
    }
  });
}

const clearCloudBtn = document.getElementById('clearCloudFirestoreBtn');
if (clearCloudBtn) {
  clearCloudBtn.addEventListener('click', async () => {
    const confirmWipe = confirm(
      "🚨 WIPE CLOUD FIRESTORE?\n\n" +
      "This will permanently delete all items, combos, and daily specials directly from project: rukky-s-picks-81b70 in Google Cloud.\n\n" +
      "Proceed with cloud wipe?"
    );
    if (!confirmWipe) return;

    try {
      clearCloudBtn.disabled = true;
      clearCloudBtn.innerHTML = `<span>Wiping Cloud Firestore... ⏳</span>`;
      const res = await window.dbService.clearAllCloudMeals();
      allItems = [];
      allSpecials = [];
      allCombos = [];
      renderItemsTable();
      renderSpecialsGrid();
      updateEngineCombos();
      updateTabBadges();
      showToast(`Cloud Firestore wiped! Deleted ${res.items} items, ${res.combos} combos, ${res.specials} specials.`, '🎉');
      alert(`✅ Cloud Wiped Successfully!\n\nDeleted from cloud:\n• ${res.items} Food Items\n• ${res.combos} Combos\n• ${res.specials} Daily Specials\n\nYour Cloud Firestore database is now 100% clean!`);
      if (checkCloudBtn) checkCloudBtn.click();
    } catch (err) {
      alert("Error wiping Cloud Firestore: " + err.message + "\n\nIf permission was denied, please check your Firestore security rules or open clear-cloud.html.");
    } finally {
      clearCloudBtn.disabled = false;
      clearCloudBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        <span>🚨 Delete All Meals from Cloud Firestore</span>
      `;
    }
  });
}

// --- RUKKY'S ENGINE RULES MANAGEMENT ---
function syncEngineRulesForm(rules) {
  const current = rules || (window.dbService ? window.dbService.getEngineRulesSync() : window.DEFAULT_ENGINE_RULES);
  if (!current) return;

  const budgetCapInput = document.getElementById('ruleBudgetCap');
  const lowBudgetInput = document.getElementById('ruleLowBudget');
  const limitSelect = document.getElementById('ruleCombosPerSpotLimit');
  const duosCheck = document.getElementById('ruleAllowCoreDuos');
  const sidesCheck = document.getElementById('ruleAllowSides');
  const drinksCheck = document.getElementById('ruleAllowDrinks');
  const doubleProteinCheck = document.getElementById('ruleAllowDoubleProtein');
  const carbSidesCheck = document.getElementById('ruleAllowCarbSides');
  const snackCombosCheck = document.getElementById('ruleAllowSnackCombos');
  const deluxeCheck = document.getElementById('ruleAllowDeluxe');
  const blacklistArea = document.getElementById('ruleBlacklist');

  if (budgetCapInput) budgetCapInput.value = current.budgetCap || 4000;
  if (lowBudgetInput) lowBudgetInput.value = current.lowBudgetLimit || 1300;
  if (limitSelect) limitSelect.value = String(current.combosPerSpotLimit || 35);
  if (duosCheck) duosCheck.checked = current.allowCoreDuos !== false;
  if (sidesCheck) sidesCheck.checked = current.allowSides !== false;
  if (drinksCheck) drinksCheck.checked = current.allowDrinks !== false;
  if (doubleProteinCheck) doubleProteinCheck.checked = current.allowDoubleProtein !== false;
  if (carbSidesCheck) carbSidesCheck.checked = current.allowCarbSides !== false;
  if (snackCombosCheck) snackCombosCheck.checked = current.allowSnackCombos !== false;
  if (deluxeCheck) deluxeCheck.checked = Boolean(current.allowDeluxe);

  if (blacklistArea) {
    if (Array.isArray(current.blacklist)) {
      blacklistArea.value = current.blacklist.join('\n');
    } else if (typeof current.blacklist === 'string') {
      blacklistArea.value = current.blacklist;
    } else {
      blacklistArea.value = '';
    }
  }
}

let engineRulesUIInitialized = false;
function initEngineRulesUI() {
  if (engineRulesUIInitialized) return;
  engineRulesUIInitialized = true;

  const toggleBtn = document.getElementById('toggleEngineRulesBtn');
  const rulesPanel = document.getElementById('engineRulesPanel');
  const toggleText = document.getElementById('toggleEngineRulesText');
  const rulesForm = document.getElementById('engineRulesForm');
  const resetBtn = document.getElementById('resetRulesBtn');

  // Load initial rules into form
  syncEngineRulesForm();

  if (toggleBtn && rulesPanel) {
    toggleBtn.addEventListener('click', () => {
      rulesPanel.classList.toggle('hidden');
      const isHidden = rulesPanel.classList.contains('hidden');
      if (toggleText) toggleText.textContent = isHidden ? 'Configure Rules' : 'Hide Rules';
    });
  }

  if (rulesForm) {
    rulesForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const budgetCap = parseFloat(document.getElementById('ruleBudgetCap').value) || 4000;
      const lowBudgetLimit = parseFloat(document.getElementById('ruleLowBudget').value) || 1300;
      const combosPerSpotLimit = parseInt(document.getElementById('ruleCombosPerSpotLimit')?.value, 10) || 35;
      const allowCoreDuos = document.getElementById('ruleAllowCoreDuos').checked;
      const allowSides = document.getElementById('ruleAllowSides').checked;
      const allowDrinks = document.getElementById('ruleAllowDrinks').checked;
      const allowDoubleProtein = document.getElementById('ruleAllowDoubleProtein') ? document.getElementById('ruleAllowDoubleProtein').checked : true;
      const allowCarbSides = document.getElementById('ruleAllowCarbSides') ? document.getElementById('ruleAllowCarbSides').checked : true;
      const allowSnackCombos = document.getElementById('ruleAllowSnackCombos') ? document.getElementById('ruleAllowSnackCombos').checked : true;
      const allowDeluxe = document.getElementById('ruleAllowDeluxe').checked;
      const rawBlacklist = document.getElementById('ruleBlacklist').value;

      const blacklist = rawBlacklist
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const newRules = {
        budgetCap,
        lowBudgetLimit,
        combosPerSpotLimit,
        allowCoreDuos,
        allowSides,
        allowDrinks,
        allowDoubleProtein,
        allowCarbSides,
        allowSnackCombos,
        allowDeluxe,
        blacklist
      };

      try {
        await window.dbService.saveEngineRules(newRules);
        updateEngineCombos();
        showToast(`Rukky's Engine rules saved! (${allCombos.length} combos available)`, '⚡');
      } catch (err) {
        alert('Error saving engine rules: ' + err.message);
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm("Reset Rukky's Engine rules to standard campus defaults?")) {
        try {
          await window.dbService.saveEngineRules(window.DEFAULT_ENGINE_RULES);
          syncEngineRulesForm(window.DEFAULT_ENGINE_RULES);
          updateEngineCombos();
          showToast('Engine rules reset to campus defaults!', '🔄');
        } catch (err) {
          alert('Error resetting rules: ' + err.message);
        }
      }
    });
  }
}

// --- DATA BACKUP & RESTORE ACTIONS ---
let backupUIInitialized = false;
function initBackupUI() {
  if (backupUIInitialized) return;
  backupUIInitialized = true;

  const exportBtn = document.getElementById('exportBackupBtn');
  const importBtn = document.getElementById('importBackupBtn');
  const fileInput = document.getElementById('importBackupInput');

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        exportBtn.disabled = true;
        exportBtn.innerHTML = `<span>Exporting data...</span>`;
        const backupData = await window.dbService.exportBackup();
        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const dateStr = new Date().toISOString().split('T')[0];
        const a = document.createElement('a');
        a.href = url;
        a.download = `rukkys-picks-backup-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Backup downloaded successfully! 📥', '💾');
      } catch (err) {
        alert('Backup export failed: ' + err.message);
      } finally {
        exportBtn.disabled = false;
        exportBtn.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          <span>Download Backup (.json)</span>
        `;
      }
    });
  }

  if (importBtn && fileInput) {
    importBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          const itemCount = Array.isArray(parsed.items) ? parsed.items.length : 0;
          const spotCount = Array.isArray(parsed.spots) ? parsed.spots.length : 0;
          const specCount = Array.isArray(parsed.specials) ? parsed.specials.length : 0;

          const confirmMsg = `Restore backup containing:\n• ${itemCount} Food Items\n• ${spotCount} Campus Spots\n• ${specCount} Daily Deals\n\nThis will update your campus database. Proceed?`;
          if (!confirm(confirmMsg)) {
            fileInput.value = '';
            return;
          }

          const res = await window.dbService.restoreBackup(parsed);
          syncEngineRulesForm();
          updateEngineCombos();
          showToast(`Backup restored: ${res.itemsCount} items, ${res.spotsCount} spots loaded!`, '✅');
        } catch (err) {
          alert('Failed to restore backup: ' + err.message);
        } finally {
          fileInput.value = '';
        }
      };
      reader.onerror = () => {
        alert('Error reading backup file');
        fileInput.value = '';
      };
      reader.readAsText(file);
    });
  }

  // Clear all meals & start fresh button
  const clearMealsBtn = document.getElementById('clearAllMealsBtn');
  if (clearMealsBtn) {
    clearMealsBtn.addEventListener('click', async () => {
      const confirmFirst = confirm(
        "⚠️ DANGER: Clear All Meals & Start Fresh?\n\n" +
        "This will permanently remove all food items, generated combos, and daily specials from both Local Storage and Firestore.\n\n" +
        "Campus spots and engine rules will be kept.\n\n" +
        "Are you sure you want to start with a 100% clean slate?"
      );
      if (!confirmFirst) return;

      try {
        clearMealsBtn.disabled = true;
        clearMealsBtn.innerHTML = `<span>Wiping meals...</span>`;
        if (window.dbService && window.dbService.clearAllMeals) {
          await window.dbService.clearAllMeals();
        }
        allItems = [];
        allSpecials = [];
        allCombos = [];
        renderItems();
        renderSpecials();
        updateEngineCombos();
        showToast('All meals cleared! Campus database is now a 100% clean slate.', '🧹');
      } catch (err) {
        alert('Failed to clear meals: ' + err.message);
      } finally {
        clearMealsBtn.disabled = false;
        clearMealsBtn.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          <span>Wipe All Food Items</span>
        `;
      }
    });
  }
}

// Modal close buttons
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    [itemModal, specialModal, spotModal].forEach(m => {
      if (m) m.classList.add('hidden');
    });
  });
});

[itemModal, specialModal, spotModal].forEach(modal => {
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }
});

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  initAuth();
});
