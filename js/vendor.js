/**
 * Rukky's Picks - Lightweight Mobile Vendor Controller (vendor.js)
 * Mobile-first interface for canteen vendors:
 * 1. Add / manage individual food items & prices (e.g. Boiled Egg ₦500, Jollof Rice ₦800)
 * 2. Real-time feedback showing how Rukky's Engine mixes them into student combos
 * 3. Add / manage today's special menu (curated daily combos + prices)
 * No email or password friction required.
 */
(function () {
  'use strict';

  // State
  let allSpots = (window.dbService && window.dbService.getSpotsSync) ? window.dbService.getSpotsSync() : (window.DEFAULT_SPOTS || []);
  let allItems = (window.dbService && window.dbService.getItemsSync) ? window.dbService.getItemsSync() : [];
  let allSpecials = (window.dbService && window.dbService.getSpecialsSync) ? window.dbService.getSpecialsSync() : [];
  let currentSpotId = localStorage.getItem('rukkys_vendor_spot_id') || 'main-caf';
  let currentTab = 'offers'; // 'offers' (items) | 'specials'
  let currentCategoryFilter = 'all';

  // DOM Elements - Header
  const headerSpotName = document.getElementById('headerSpotName');
  const headerSpotTag = document.getElementById('headerSpotTag');
  const openSwitchCanteenBtn = document.getElementById('openSwitchCanteenBtn');

  // DOM Elements - Tabs
  const tabOffersBtn = document.getElementById('tabOffersBtn');
  const tabSpecialsBtn = document.getElementById('tabSpecialsBtn');
  const offersCountBadge = document.getElementById('offersCountBadge');
  const specialsCountBadge = document.getElementById('specialsCountBadge');
  const offersSection = document.getElementById('offersSection');
  const specialsSection = document.getElementById('specialsSection');
  const engineCombosCount = document.getElementById('engineCombosCount');

  // DOM Elements - Lists & Empty States
  const offersList = document.getElementById('offersList');
  const offersEmptyState = document.getElementById('offersEmptyState');
  const specialsList = document.getElementById('specialsList');
  const specialsEmptyState = document.getElementById('specialsEmptyState');

  // DOM Elements - Modals & Forms
  const offerModal = document.getElementById('offerModal');
  const offerForm = document.getElementById('offerForm');
  const offerModalTitle = document.getElementById('offerModalTitle');
  const offerEditId = document.getElementById('offerEditId');
  const offerTitle = document.getElementById('offerTitle');
  const offerPrice = document.getElementById('offerPrice');
  const offerCategory = document.getElementById('offerCategory');
  const offerAvailable = document.getElementById('offerAvailable');
  const saveOfferBtn = document.getElementById('saveOfferBtn');

  const specialModal = document.getElementById('specialModal');
  const specialForm = document.getElementById('specialForm');
  const specialModalTitle = document.getElementById('specialModalTitle');
  const specialEditId = document.getElementById('specialEditId');
  const specialTitle = document.getElementById('specialTitle');
  const specialPrice = document.getElementById('specialPrice');
  const saveSpecialBtn = document.getElementById('saveSpecialBtn');

  const canteenModal = document.getElementById('canteenModal');
  const canteenPickerList = document.getElementById('canteenPickerList');

  // Bottom Navigation
  const navOffersBtn = document.getElementById('navOffersBtn');
  const navSpecialsBtn = document.getElementById('navSpecialsBtn');
  const navCanteenBtn = document.getElementById('navCanteenBtn');

  // Toast
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const toastIcon = document.getElementById('toastIcon');
  let toastTimer = null;

  function showToast(message, icon = '✨') {
    if (!toast) return;
    if (toastMsg) toastMsg.textContent = message;
    if (toastIcon) toastIcon.textContent = icon;
    toast.classList.remove('opacity-0', 'pointer-events-none');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add('opacity-0', 'pointer-events-none');
    }, 2800);
  }

  function formatNaira(amount) {
    return '₦' + Number(amount || 0).toLocaleString('en-NG');
  }

  const DAY_LABELS = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    everyday: 'Everyday'
  };

  function getTodayDayKey() {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()] || 'monday';
  }

  function formatDayLabel(dayKey) {
    if (!dayKey) return "Today's Special";
    const key = String(dayKey).toLowerCase();
    if (key === 'everyday') return '🌟 Everyday Special';
    return `📅 ${DAY_LABELS[key] || dayKey} Special`;
  }

  function getCurrentSpot() {
    let spot = allSpots.find(s => s.id === currentSpotId);
    if (!spot && allSpots.length > 0) {
      spot = allSpots[0];
      currentSpotId = spot.id;
      localStorage.setItem('rukkys_vendor_spot_id', currentSpotId);
    }
    return spot || allSpots[0] || { id: 'main-caf', name: "Iya Beji", tag: "Cafeteria" };
  }

  function updateHeader() {
    const spot = getCurrentSpot();
    if (headerSpotName) headerSpotName.textContent = spot.name;
    if (headerSpotTag) headerSpotTag.textContent = spot.tag || 'Campus Food Spot';

    const cloudBadge = document.getElementById('vendorCloudBadge');
    if (cloudBadge && window.dbService) {
      const isCloud = window.dbService.isUsingFirebase();
      if (isCloud) {
        cloudBadge.className = "inline-flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0";
        cloudBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span><span>Live ☁️</span>`;
      } else {
        cloudBadge.className = "inline-flex items-center space-x-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600 shrink-0";
        cloudBadge.innerHTML = `<span>Local Mode</span>`;
      }
    }
  }

  // --- TAB SWITCHING ---
  function switchTab(tab) {
    currentTab = tab;
    if (tab === 'offers') {
      tabOffersBtn.className = "flex-1 py-2.5 rounded-xl bg-white text-stone-900 shadow-sm transition flex items-center justify-center space-x-1.5 tap-highlight-transparent";
      tabSpecialsBtn.className = "flex-1 py-2.5 rounded-xl text-stone-500 hover:text-stone-800 transition flex items-center justify-center space-x-1.5 tap-highlight-transparent";
      offersSection.classList.remove('hidden');
      specialsSection.classList.add('hidden');

      if (navOffersBtn) {
        navOffersBtn.className = "flex flex-col items-center text-brand-600 text-[11px] font-bold space-y-1 tap-highlight-transparent";
      }
      if (navSpecialsBtn) {
        navSpecialsBtn.className = "flex flex-col items-center text-stone-400 hover:text-stone-700 text-[11px] font-semibold space-y-1 transition tap-highlight-transparent";
      }
    } else {
      tabSpecialsBtn.className = "flex-1 py-2.5 rounded-xl bg-white text-stone-900 shadow-sm transition flex items-center justify-center space-x-1.5 tap-highlight-transparent";
      tabOffersBtn.className = "flex-1 py-2.5 rounded-xl text-stone-500 hover:text-stone-800 transition flex items-center justify-center space-x-1.5 tap-highlight-transparent";
      specialsSection.classList.remove('hidden');
      offersSection.classList.add('hidden');

      if (navSpecialsBtn) {
        navSpecialsBtn.className = "flex flex-col items-center text-amber-600 text-[11px] font-bold space-y-1 tap-highlight-transparent";
      }
      if (navOffersBtn) {
        navOffersBtn.className = "flex flex-col items-center text-stone-400 hover:text-stone-700 text-[11px] font-semibold space-y-1 transition tap-highlight-transparent";
      }
    }
  }

  // Category Tag Helper
  function getCategoryBadge(type) {
    switch (type) {
      case 'main':
        return `<span class="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">🍚 Main / Staple</span>`;
      case 'protein':
        return `<span class="bg-amber-50 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200">🍗 Protein</span>`;
      case 'side':
        return `<span class="bg-orange-50 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-orange-200">🍟 Side Dish</span>`;
      case 'drink':
        return `<span class="bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-200">🥤 Drink</span>`;
      default:
        return `<span class="bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-md">🍲 Food Item</span>`;
    }
  }

  // --- RENDER FOOD ITEMS (REGULAR MENU) ---
  function renderOffers() {
    if (!offersList) return;
    const spot = getCurrentSpot();

    const spotItems = allItems.filter(it => it.spotId === spot.id || (it.spotName && spot.name && it.spotName.toLowerCase() === spot.name.toLowerCase()));
    if (offersCountBadge) offersCountBadge.textContent = spotItems.length;

    // Update Rukky's Engine live combo calculation
    if (engineCombosCount && window.RukkysEngine) {
      const generatedCombos = window.RukkysEngine.mixForVendor(spot.id, allItems, allSpots);
      engineCombosCount.textContent = `Mixing your items into ${generatedCombos.length} student combo${generatedCombos.length !== 1 ? 's' : ''}`;
    }

    let filtered = [...spotItems];
    if (currentCategoryFilter !== 'all') {
      filtered = filtered.filter(it => it.type === currentCategoryFilter);
    }

    if (spotItems.length === 0) {
      offersList.innerHTML = '';
      if (offersEmptyState) offersEmptyState.classList.remove('hidden');
      return;
    }

    if (offersEmptyState) offersEmptyState.classList.add('hidden');
    offersList.innerHTML = '';

    if (filtered.length === 0) {
      offersList.innerHTML = `
        <div class="bg-white rounded-2xl p-5 text-center text-stone-400 text-xs">
          No items found in this category. Tap "+ Add Item" above.
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = "bg-white rounded-2xl p-3.5 border border-stone-200/90 shadow-sm flex items-center justify-between gap-3";

      const isAvail = item.available !== false;

      card.innerHTML = `
        <div class="min-w-0 flex-1">
          <div class="flex items-center space-x-2 mb-1">
            ${getCategoryBadge(item.type)}
            ${!isAvail ? '<span class="text-[9px] bg-stone-100 text-stone-500 font-bold px-1.5 py-0.5 rounded">Sold Out</span>' : ''}
          </div>
          <h3 class="font-extrabold text-sm text-stone-900 truncate ${!isAvail ? 'line-through text-stone-400' : ''}">
            ${item.name}
          </h3>
          <div class="flex items-center space-x-1.5 mt-0.5">
            ${item.pricingType === 'from_price' ? `<span class="text-[9px] uppercase font-black text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded">from</span>` : ''}
            <span class="text-brand-600 font-display font-black text-sm">${formatNaira(item.price)}</span>
            ${item.pricingType !== 'from_price' ? `<span class="text-[10px] text-stone-400 font-semibold">/ portion</span>` : ''}
          </div>
        </div>

        <div class="flex items-center space-x-1.5 shrink-0">
          <button class="toggle-avail-btn p-2 rounded-xl text-xs font-bold ${isAvail ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-stone-100 text-stone-400 hover:bg-stone-200'} transition tap-highlight-transparent" title="Toggle availability">
            ${isAvail ? 'In Stock' : 'Out'}
          </button>
          <button class="edit-offer-btn p-2 text-stone-400 hover:text-stone-800 rounded-xl hover:bg-stone-100 transition tap-highlight-transparent" title="Edit Item">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </button>
          <button class="delete-offer-btn p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition tap-highlight-transparent" title="Delete Item">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      `;

      // Quick Availability Toggle
      const toggleBtn = card.querySelector('.toggle-avail-btn');
      toggleBtn.addEventListener('click', async () => {
        const nextState = !isAvail;
        await window.dbService.updateItem(item.id, { available: nextState });
        showToast(nextState ? `"${item.name}" is now In Stock (Live ☁️)` : `"${item.name}" marked Sold Out (Live ☁️)`, nextState ? '✅' : '⏸️');
      });

      // Edit item
      const editBtn = card.querySelector('.edit-offer-btn');
      editBtn.addEventListener('click', () => {
        openOfferModal(item);
      });

      // Delete item
      const deleteBtn = card.querySelector('.delete-offer-btn');
      deleteBtn.addEventListener('click', async () => {
        if (confirm(`Remove "${item.name}" from your canteen menu?`)) {
          await window.dbService.deleteItem(item.id);
          showToast(`Removed "${item.name}" (Live ☁️)`, '🗑️');
        }
      });

      offersList.appendChild(card);
    });
  }

  // --- RENDER TODAY'S SPECIALS ---
  function renderSpecials() {
    if (!specialsList) return;
    const spot = getCurrentSpot();

    const mySpecials = allSpecials.filter(s => {
      if (s.spotId && s.spotId === spot.id) return true;
      if (s.vendor && spot.name && s.vendor.toLowerCase().includes(spot.name.toLowerCase().split(' ')[0])) return true;
      return false;
    });

    if (specialsCountBadge) specialsCountBadge.textContent = mySpecials.length;

    if (mySpecials.length === 0) {
      specialsList.innerHTML = '';
      if (specialsEmptyState) specialsEmptyState.classList.remove('hidden');
      return;
    }

    if (specialsEmptyState) specialsEmptyState.classList.add('hidden');
    specialsList.innerHTML = '';

    const todayKey = getTodayDayKey();
    mySpecials.forEach(spec => {
      const card = document.createElement('div');
      card.className = "bg-white rounded-2xl p-4 border border-amber-200/90 shadow-sm space-y-2 relative overflow-hidden";

      const isToday = !spec.dayOfWeek || spec.dayOfWeek === 'everyday' || spec.dayOfWeek === todayKey;
      const isFrom = spec.pricingType === 'from_price';

      card.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center space-x-1.5 mb-1 flex-wrap gap-y-1">
              <span class="inline-block text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded">
                ${formatDayLabel(spec.dayOfWeek)}
              </span>
              ${isToday ? '<span class="text-[9px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.5 rounded">TODAY 🔥</span>' : ''}
            </div>
            <h3 class="font-bold text-sm text-stone-900 leading-snug">
              ${spec.title}
            </h3>
          </div>
          <div class="text-right shrink-0">
            ${isFrom ? '<span class="text-[9px] text-amber-700 font-extrabold uppercase block leading-tight">starts from</span>' : ''}
            <span class="text-base font-extrabold font-display text-amber-600 block">${formatNaira(spec.price)}</span>
            <span class="text-[10px] text-stone-400 font-bold uppercase">${isFrom ? 'base' : 'deal'}</span>
          </div>
        </div>

        <div class="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
          <div class="flex items-center space-x-1.5 text-stone-500 font-semibold text-[11px]">
            <span class="w-2 h-2 rounded-full ${spec.active !== false ? 'bg-emerald-500' : 'bg-stone-300'}"></span>
            <span>${spec.active !== false ? 'Live on Student Banner' : 'Inactive'}</span>
          </div>

          <div class="flex items-center space-x-1">
            <button class="edit-spec-btn p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition tap-highlight-transparent" title="Edit Special">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>
            <button class="delete-spec-btn p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition tap-highlight-transparent" title="Delete Special">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </div>
      `;

      // Edit Special
      const editBtn = card.querySelector('.edit-spec-btn');
      editBtn.addEventListener('click', () => {
        openSpecialModal(spec);
      });

      // Delete Special
      const deleteBtn = card.querySelector('.delete-spec-btn');
      deleteBtn.addEventListener('click', async () => {
        if (confirm(`Remove this special menu deal?`)) {
          await window.dbService.deleteSpecial(spec.id);
          showToast('Removed special deal', '🗑️');
        }
      });

      specialsList.appendChild(card);
    });
  }

  // --- MODAL HANDLERS ---
  function openOfferModal(item = null) {
    if (!offerModal) return;
    if (item) {
      if (offerModalTitle) offerModalTitle.textContent = "Edit Food Item";
      if (offerEditId) offerEditId.value = item.id;
      if (offerTitle) offerTitle.value = item.name;
      if (offerPrice) offerPrice.value = item.price;
      if (offerCategory) offerCategory.value = item.type || 'main';
      if (offerAvailable) offerAvailable.checked = item.available !== false;
      const targetPricing = item.pricingType || 'per_portion';
      const pricingRadio = document.querySelector(`input[name="offerPricingType"][value="${targetPricing}"]`);
      if (pricingRadio) pricingRadio.checked = true;
      if (saveOfferBtn) saveOfferBtn.textContent = "Save Changes";
    } else {
      if (offerModalTitle) offerModalTitle.textContent = "Add Food Item & Price";
      if (offerEditId) offerEditId.value = "";
      if (offerTitle) offerTitle.value = "";
      if (offerPrice) offerPrice.value = "";
      if (offerCategory) offerCategory.value = "main";
      if (offerAvailable) offerAvailable.checked = true;
      const defaultRadio = document.querySelector('input[name="offerPricingType"][value="per_portion"]');
      if (defaultRadio) defaultRadio.checked = true;
      if (saveOfferBtn) saveOfferBtn.textContent = "Save Food Item";
    }
    offerModal.classList.remove('hidden');
    setTimeout(() => { if (offerTitle) offerTitle.focus(); }, 100);
  }

  function closeOfferModal() {
    if (offerModal) offerModal.classList.add('hidden');
  }

  function openSpecialModal(spec = null) {
    if (!specialModal) return;
    const specialDaySelect = document.getElementById('specialDay');

    if (spec) {
      if (specialModalTitle) specialModalTitle.textContent = "Edit Special Menu";
      if (specialEditId) specialEditId.value = spec.id;
      if (specialTitle) specialTitle.value = spec.title;
      if (specialPrice) specialPrice.value = spec.price;
      if (specialDaySelect) specialDaySelect.value = spec.dayOfWeek || getTodayDayKey();
      const targetPricing = spec.pricingType || 'per_portion';
      const pricingRadio = document.querySelector(`input[name="specialPricingType"][value="${targetPricing}"]`);
      if (pricingRadio) pricingRadio.checked = true;
      if (saveSpecialBtn) saveSpecialBtn.textContent = "Update Special Deal";
    } else {
      if (specialModalTitle) specialModalTitle.textContent = "Post Special Menu";
      if (specialEditId) specialEditId.value = "";
      if (specialTitle) specialTitle.value = "";
      if (specialPrice) specialPrice.value = "";
      if (specialDaySelect) specialDaySelect.value = getTodayDayKey();
      const defaultRadio = document.querySelector('input[name="specialPricingType"][value="per_portion"]');
      if (defaultRadio) defaultRadio.checked = true;
      if (saveSpecialBtn) saveSpecialBtn.textContent = "Publish Special Menu";
    }
    specialModal.classList.remove('hidden');
    setTimeout(() => { if (specialTitle) specialTitle.focus(); }, 100);
  }

  function closeSpecialModal() {
    if (specialModal) specialModal.classList.add('hidden');
  }

  // --- CANTEEN SWITCHER MODAL ---
  function openCanteenModal() {
    if (!canteenModal || !canteenPickerList) return;
    canteenPickerList.innerHTML = '';

    allSpots.forEach(sp => {
      const isCurrent = sp.id === currentSpotId;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `w-full text-left p-3 rounded-2xl border transition flex items-center justify-between tap-highlight-transparent ${isCurrent ? 'bg-brand-50 border-brand-300 text-brand-900 font-bold' : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-800'}`;
      btn.innerHTML = `
        <div class="min-w-0 flex-1">
          <div class="flex items-center space-x-1.5">
            <span class="text-sm font-bold truncate">${sp.name}</span>
            ${isCurrent ? '<span class="text-[9px] bg-brand-600 text-white font-black px-1.5 py-0.2 rounded-full">ACTIVE</span>' : ''}
          </div>
          <p class="text-[11px] text-stone-500 truncate">${sp.tag || 'Campus Spot'}</p>
        </div>
        <span class="text-stone-400 ml-2">›</span>
      `;

      btn.addEventListener('click', () => {
        currentSpotId = sp.id;
        localStorage.setItem('rukkys_vendor_spot_id', currentSpotId);
        updateHeader();
        renderOffers();
        renderSpecials();
        closeCanteenModal();
        showToast(`Switched to ${sp.name}`, '🏪');
      });

      canteenPickerList.appendChild(btn);
    });

    canteenModal.classList.remove('hidden');
  }

  function closeCanteenModal() {
    if (canteenModal) canteenModal.classList.add('hidden');
  }

  // --- EVENT BINDINGS ---
  function init() {
    // Tab Clicks
    if (tabOffersBtn) tabOffersBtn.addEventListener('click', () => switchTab('offers'));
    if (tabSpecialsBtn) tabSpecialsBtn.addEventListener('click', () => switchTab('specials'));

    // Category Filter Pills
    document.querySelectorAll('.vendor-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.vendor-filter').forEach(b => {
          b.className = "vendor-filter px-3 py-1.5 rounded-full font-bold bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-100 shrink-0 transition";
        });
        btn.className = "vendor-filter active px-3 py-1.5 rounded-full font-bold bg-stone-900 text-white shadow-sm shrink-0 transition";
        currentCategoryFilter = btn.getAttribute('data-category');
        renderOffers();
      });
    });

    // Bottom Nav
    if (navOffersBtn) navOffersBtn.addEventListener('click', () => switchTab('offers'));
    if (navSpecialsBtn) navSpecialsBtn.addEventListener('click', () => switchTab('specials'));
    if (navCanteenBtn) navCanteenBtn.addEventListener('click', openCanteenModal);

    // Switch Canteen Header Button
    if (openSwitchCanteenBtn) openSwitchCanteenBtn.addEventListener('click', openCanteenModal);

    // Add Item Buttons
    const openAddOfferBtn = document.getElementById('openAddOfferBtn');
    const emptyAddOfferBtn = document.getElementById('emptyAddOfferBtn');
    if (openAddOfferBtn) openAddOfferBtn.addEventListener('click', () => openOfferModal());
    if (emptyAddOfferBtn) emptyAddOfferBtn.addEventListener('click', () => openOfferModal());

    // Add Special Buttons
    const openAddSpecialBtn = document.getElementById('openAddSpecialBtn');
    const emptyAddSpecialBtn = document.getElementById('emptyAddSpecialBtn');
    if (openAddSpecialBtn) openAddSpecialBtn.addEventListener('click', () => openSpecialModal());
    if (emptyAddSpecialBtn) emptyAddSpecialBtn.addEventListener('click', () => openSpecialModal());

    // Modal Close Buttons
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        closeOfferModal();
        closeSpecialModal();
        closeCanteenModal();
      });
    });

    // Background Click to Close Modals
    [offerModal, specialModal, canteenModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            closeOfferModal();
            closeSpecialModal();
            closeCanteenModal();
          }
        });
      }
    });

    // --- SUBMIT FOOD ITEM FORM ---
    if (offerForm) {
      offerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const spot = getCurrentSpot();
        const editId = offerEditId ? offerEditId.value.trim() : "";
        const nameVal = offerTitle.value.trim();
        const priceVal = parseFloat(offerPrice.value);
        const catVal = offerCategory.value;
        const availVal = offerAvailable ? offerAvailable.checked : true;

        if (!nameVal || isNaN(priceVal) || priceVal <= 0) {
          showToast('Please enter item name and valid price', '⚠️');
          return;
        }

        const pricingTypeEl = document.querySelector('input[name="offerPricingType"]:checked');
        const pricingTypeVal = pricingTypeEl ? pricingTypeEl.value : 'per_portion';

        const payload = {
          spotId: spot.id,
          spotName: spot.name,
          name: nameVal,
          price: priceVal,
          pricingType: pricingTypeVal,
          type: catVal,
          available: availVal
        };

        if (editId) {
          await window.dbService.updateItem(editId, payload);
          showToast(`Updated "${nameVal}" (₦${priceVal})! Synced to Cloud ☁️`, '✅');
        } else {
          await window.dbService.addItem(payload);
          showToast(`Added "${nameVal}"! Live on Student App ☁️`, '🍲');
        }

        closeOfferModal();
      });
    }

    // --- SUBMIT SPECIAL MENU FORM ---
    if (specialForm) {
      specialForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const spot = getCurrentSpot();
        const editId = specialEditId ? specialEditId.value.trim() : "";
        const titleVal = specialTitle.value.trim();
        const priceVal = parseFloat(specialPrice.value);

        if (!titleVal || isNaN(priceVal) || priceVal <= 0) {
          showToast('Please enter special title and price', '⚠️');
          return;
        }

        const dayVal = document.getElementById('specialDay') ? document.getElementById('specialDay').value : getTodayDayKey();
        const pricingTypeEl = document.querySelector('input[name="specialPricingType"]:checked');
        const pricingTypeVal = pricingTypeEl ? pricingTypeEl.value : 'per_portion';
        const dayLabel = DAY_LABELS[dayVal] || 'Daily';

        const payload = {
          spotId: spot.id,
          vendor: spot.name,
          title: titleVal,
          price: priceVal,
          dayOfWeek: dayVal,
          pricingType: pricingTypeVal,
          badge: `${dayLabel} Special 🔥`,
          rukkysPitch: `${spot.name} cooked this special combo for ${dayLabel}. Available fresh!`,
          active: true
        };

        if (editId) {
          await window.dbService.updateSpecial(editId, payload);
          showToast(`Updated "${titleVal}"! Synced to Cloud ☁️`, '✅');
        } else {
          await window.dbService.addSpecial(payload);
          showToast(`Published Today's Special to Cloud! ☁️`, '⭐');
        }

        closeSpecialModal();
      });
    }

    // --- LIVE DATA LISTENERS ---
    if (window.dbService) {
      window.dbService.listenSpots(spots => {
        if (spots && spots.length) {
          allSpots = spots;
          updateHeader();
          renderOffers();
          renderSpecials();
        }
      });

      window.dbService.listenItems(items => {
        if (Array.isArray(items)) {
          allItems = items;
          renderOffers();
        }
      });

      window.dbService.listenSpecials(specials => {
        if (Array.isArray(specials)) {
          allSpecials = specials;
          renderSpecials();
        }
      });
    }

    updateHeader();
  }

  window.addEventListener('DOMContentLoaded', init);
})();
