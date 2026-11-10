/**
 * Rukky's Picks - Student Client App Controller (app.js)
 * High performance, zero framework overhead, reactive client for Wellspring University students.
 * Powered by Rukky's Engine: dynamically mixes individual canteen food items into balanced meals.
 */
(function () {
  'use strict';

  // State
  let allItems = (window.dbService && window.dbService.getItemsSync) ? window.dbService.getItemsSync() : (window.DEFAULT_ITEMS || []);
  let allSpots = (window.dbService && window.dbService.getSpotsSync) ? window.dbService.getSpotsSync() : (window.DEFAULT_SPOTS || []);
  let allSpecials = (window.dbService && window.dbService.getSpecialsSync) ? window.dbService.getSpecialsSync() : (window.DEFAULT_SPECIALS || []);
  let allCombos = window.RukkysEngine
    ? window.RukkysEngine.generateCombos(allItems, allSpots)
    : (window.DEFAULT_COMBOS || []);

  let currentBudget = null;
  let currentFilter = 'all';
  let currentSort = 'best';

  // DOM Elements
  const budgetInput = document.getElementById('budgetInput');
  const findCombosBtn = document.getElementById('findCombosBtn');
  const combosList = document.getElementById('combosList');
  const noResultsState = document.getElementById('noResultsState');
  const resultsCount = document.getElementById('resultsCount');
  const sortSelect = document.getElementById('sortSelect');
  const surpriseBtn = document.getElementById('surpriseBtn');
  const resetMinBtn = document.getElementById('resetMinBtn');

  // --- REFRESH COMBOS VIA RUKKY'S ENGINE ---
  function refreshEngineCombos() {
    if (window.RukkysEngine) {
      allCombos = window.RukkysEngine.generateCombos(allItems, allSpots);
    } else {
      allCombos = window.DEFAULT_COMBOS || [];
    }
    renderCombos();
  }

  // --- RENDER COMBOS ---
  function renderCombos() {
    if (!combosList) return;

    let filtered = [...allCombos];

    // 1. Budget Filter
    if (currentBudget !== null && !isNaN(currentBudget) && currentBudget > 0) {
      filtered = filtered.filter(item => item.price <= currentBudget);
    }

    // 2. Category Filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(item => item.category === currentFilter);
    }

    // 3. Sorting
    if (currentSort === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else {
      // Top recommended (rating)
      filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    }

    combosList.innerHTML = '';

    if (filtered.length === 0) {
      combosList.classList.add('hidden');
      if (noResultsState) {
        noResultsState.classList.remove('hidden');
        const emptyIcon = document.getElementById('emptyStateIcon');
        const emptyTitle = document.getElementById('emptyStateTitle');
        const emptyDesc = document.getElementById('emptyStateDesc');
        const resetBtn = document.getElementById('resetMinBtn');

        if (allCombos.length === 0) {
          if (emptyIcon) emptyIcon.innerText = '🍲';
          if (emptyTitle) emptyTitle.innerText = 'Campus Canteens Are Updating Menus';
          if (emptyDesc) emptyDesc.innerText = 'No meals listed right now. Canteen managers are loading authentic dishes into the portal. Check back shortly!';
          if (resetBtn) resetBtn.classList.add('hidden');
        } else {
          if (emptyIcon) emptyIcon.innerText = '🥺';
          if (emptyTitle) emptyTitle.innerText = 'No food combination found for this budget';
          if (emptyDesc) emptyDesc.innerText = 'Try increasing your budget a little, or tap below to explore our popular affordable meals.';
          if (resetBtn) resetBtn.classList.remove('hidden');
        }
      }
      if (resultsCount) resultsCount.innerText = allCombos.length === 0 ? 'No active menus' : 'No matches found';
      return;
    }

    combosList.classList.remove('hidden');
    if (noResultsState) noResultsState.classList.add('hidden');
    if (resultsCount) {
      resultsCount.innerText = `Showing ${filtered.length} food combination${filtered.length > 1 ? 's' : ''}`;
    }

    filtered.forEach(combo => {
      const card = window.MealCard.create(
        combo,
        currentBudget,
        (spotId) => window.AppModals.openSpots(spotId),
        () => window.AppModals.showToast('Copied meal details to clipboard! Share with your friends', '📋')
      );
      combosList.appendChild(card);
    });
  }

  // --- BUDGET SEARCH ---
  function triggerBudgetSearch() {
    const val = parseFloat(budgetInput.value);
    if (!isNaN(val) && val > 0) {
      currentBudget = val;
      window.AppModals.showToast(`Showing meals under ${window.MealCard.formatNaira(val)}`, '🎯');
    } else {
      currentBudget = null;
    }
    renderCombos();
  }

  // --- HANDLE SUGGESTION SUBMISSION ---
  async function handleSubmitSuggestion(data) {
    // 1. Persist to DB for Admin / Vendor Queue
    if (window.dbService) {
      try {
        await window.dbService.addSuggestion(data);
      } catch (err) {
        console.warn("Could not save to remote suggestion queue:", err);
      }
    }

    // 2. Add temporarily into student's local list as review pick
    const tempCombo = {
      id: "user-" + Date.now(),
      title: data.suggestedItems,
      category: "budget",
      price: data.suggestedPrice,
      spotId: "user-spot",
      spotName: data.suggestedSpot,
      items: [{ name: data.suggestedItems, price: data.suggestedPrice }],
      rukkysVerdict: `Suggested by ${data.suggesterName} from campus! Under review by Rukky.`,
      rating: "New",
      vibeBadge: "Student Suggestion ⭐"
    };

    allCombos.unshift(tempCombo);
    renderCombos();
    window.AppModals.showToast(`Thank you ${data.suggesterName}! Your food suggestion has been sent for review!`, '🙌');
  }

  // --- INITIALIZATION ---
  function init() {
    // 1. Initialize Modals Component
    window.AppModals.init(handleSubmitSuggestion);
    window.AppModals.setSpotsData(allSpots);

    // 2. Initialize Specials Carousel Component
    window.SpecialsBoard.init(allSpecials, (specialDeal) => {
      budgetInput.value = specialDeal.price;
      currentBudget = specialDeal.price;
      renderCombos();
      window.AppModals.showToast(`Budget set to ${window.MealCard.formatNaira(specialDeal.price)} for ${specialDeal.vendor}!`, '🎯');
      budgetInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // 3. Bind Budget Input & Search
    if (findCombosBtn) findCombosBtn.addEventListener('click', triggerBudgetSearch);
    if (budgetInput) {
      budgetInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') triggerBudgetSearch();
      });
    }

    // 4. Bind Preset Budget Buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = btn.getAttribute('data-amt');
        budgetInput.value = amt;
        currentBudget = parseFloat(amt);

        // Highlight active preset button
        document.querySelectorAll('.preset-btn').forEach(b => {
          b.classList.remove('bg-brand-600', 'text-white', 'border-brand-700');
          b.classList.add('bg-stone-100', 'text-stone-700', 'border-stone-200/80');
        });
        btn.classList.remove('bg-stone-100', 'text-stone-700', 'border-stone-200/80');
        btn.classList.add('bg-brand-600', 'text-white', 'border-brand-700');

        renderCombos();
        window.AppModals.showToast(`Budget set to ${window.MealCard.formatNaira(amt)}`, '💰');
      });
    });

    // Clear preset button highlights if user types a custom budget
    if (budgetInput) {
      budgetInput.addEventListener('input', () => {
        document.querySelectorAll('.preset-btn').forEach(b => {
          b.classList.remove('bg-brand-600', 'text-white', 'border-brand-700');
          b.classList.add('bg-stone-100', 'text-stone-700', 'border-stone-200/80');
        });
      });
    }

    // 5. Category Filter Pills
    document.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(b => {
          b.classList.remove('active', 'bg-stone-900', 'text-white', 'border-stone-900', 'shadow-sm');
          b.classList.add('bg-stone-100', 'text-stone-700', 'border-stone-200/80');
        });
        btn.classList.add('active', 'bg-stone-900', 'text-white', 'border-stone-900', 'shadow-sm');
        btn.classList.remove('bg-stone-100', 'text-stone-700', 'border-stone-200/80');
        currentFilter = btn.getAttribute('data-category');
        renderCombos();
      });
    });

    // 6. Sort Dropdown
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderCombos();
      });
    }

    // 7. Surprise Food Picker
    if (surpriseBtn) {
      surpriseBtn.addEventListener('click', () => {
        let pool = allCombos;
        if (currentBudget) {
          pool = pool.filter(c => c.price <= currentBudget);
        }
        if (pool.length === 0) pool = allCombos;

        const randomPick = pool[Math.floor(Math.random() * pool.length)];
        budgetInput.value = randomPick.price;
        currentBudget = randomPick.price;
        currentFilter = 'all';

        // Reset filter pills UI
        document.querySelectorAll('.filter-pill').forEach(b => {
          b.className = "filter-pill px-3.5 py-1.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200/80 transition tap-highlight-transparent";
        });
        const allPill = document.querySelector('[data-category="all"]');
        if (allPill) allPill.className = "filter-pill active px-3.5 py-1.5 rounded-full text-xs font-black bg-stone-900 text-white border border-stone-900 shadow-sm transition tap-highlight-transparent";

        renderCombos();
        window.AppModals.showToast(`Rukky picked: ${randomPick.title.split('+')[0]}!`, '🎲');
      });
    }

    // 8. Reset Min Button
    if (resetMinBtn) {
      resetMinBtn.addEventListener('click', () => {
        budgetInput.value = 1200;
        currentBudget = 1200;
        currentFilter = 'all';
        renderCombos();
      });
    }

    // 9. Bottom Navigation Bar Buttons
    const navExplore = document.getElementById('navExplore');
    if (navExplore) navExplore.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const navLocations = document.getElementById('navLocations');
    if (navLocations) navLocations.addEventListener('click', () => window.AppModals.openSpots());

    const navSuggest = document.getElementById('navSuggest');
    if (navSuggest) navSuggest.addEventListener('click', () => window.AppModals.openSuggest());

    const navRukkyTip = document.getElementById('navRukkyTip');
    if (navRukkyTip) navRukkyTip.addEventListener('click', () => window.AppModals.openTips());

    const infoBtn = document.getElementById('infoBtn');
    if (infoBtn) infoBtn.addEventListener('click', () => window.AppModals.openTips());

    // 10. Initial Engine Computation & Render
    refreshEngineCombos();

    // 11. Live Sync with Firestore / Local Storage
    if (window.dbService) {
      // Primary: Listen to individual food items & let Rukky's Engine mix dynamically
      window.dbService.listenItems(items => {
        if (Array.isArray(items)) {
          allItems = items;
          refreshEngineCombos();
        }
      });

      window.dbService.listenSpots(spots => {
        if (Array.isArray(spots) && spots.length) {
          allSpots = spots;
          window.AppModals.setSpotsData(spots);
          refreshEngineCombos();
        }
      });

      window.dbService.listenSpecials(specials => {
        if (Array.isArray(specials)) {
          allSpecials = specials.filter(s => s.active !== false);
          window.SpecialsBoard.updateSpecials(allSpecials);
        }
      });

      if (window.dbService.listenEngineRules) {
        window.dbService.listenEngineRules(rules => {
          if (rules) {
            window.currentEngineRules = rules;
            refreshEngineCombos();
          }
        });
      }
    }
  }

  // Run on DOM load
  window.addEventListener('DOMContentLoaded', init);
})();

