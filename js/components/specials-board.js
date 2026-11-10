/**
 * Rukky's Picks - Component: SpecialsBoard
 * Manages the "Today's Campus Deals" banner, carousel rotation, and quick budget locking.
 */
window.SpecialsBoard = (function () {
  let specials = [];
  let currentIndex = 0;
  let onLockBudgetCallback = null;

  function formatNaira(amount) {
    return '₦' + Number(amount).toLocaleString('en-NG');
  }

  function render() {
    const container = document.getElementById('specialCardContent');
    const dotsContainer = document.getElementById('specialsDotsContainer');
    if (!container) return;

    if (!specials || specials.length === 0) {
      container.innerHTML = `
        <div class="py-4 text-center text-xs text-stone-400">
          No daily deals posted yet today. Check back during lunch hours!
        </div>
      `;
      if (dotsContainer) dotsContainer.innerHTML = '';
      return;
    }

    if (currentIndex >= specials.length) currentIndex = 0;
    const item = specials[currentIndex];

    const dateBadge = document.getElementById('specialsDateBadge');
    if (dateBadge && specials.length > 0) {
      dateBadge.textContent = `Deal ${currentIndex + 1} of ${specials.length}`;
    }

    container.innerHTML = `
      <!-- Top Meta: Vendor Spot & Deal Badge -->
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/25 text-xs font-bold">
          <span>🏪</span>
          <span>${item.vendor || 'Campus Canteen'}</span>
        </span>
        <span class="text-[11px] font-extrabold text-orange-200 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10">
          ${item.badge || "Today's Special 🔥"}
        </span>
      </div>

      <!-- Main Meal Title & Big Price -->
      <div class="space-y-1 my-2.5">
        <h4 class="text-base sm:text-lg font-extrabold text-white leading-snug tracking-tight">
          ${item.title}
        </h4>
        <div class="flex items-baseline gap-2 pt-1.5">
          <span class="text-2xl sm:text-3xl font-black font-display text-amber-400 tracking-tight">
            ${formatNaira(item.price)}
          </span>
          <span class="text-[11px] text-stone-400 font-medium">special deal rate</span>
        </div>
      </div>

      <!-- Pitch / Note if present -->
      ${item.rukkysPitch ? `
        <div class="mt-3 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-stone-200 italic leading-relaxed flex items-start gap-2">
          <span class="text-amber-400 text-sm select-none shrink-0">💬</span>
          <span>"${item.rukkysPitch}"</span>
        </div>
      ` : ''}

      <!-- Big Primary Action Button: Lock Budget to this deal -->
      <button 
        id="lockSpecialBudgetBtn" 
        class="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 active:scale-98 text-stone-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-2 tap-highlight-transparent"
      >
        <span>Set budget to this deal (${formatNaira(item.price)})</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
      </button>
    `;

    // Render Dots with clear spacing
    if (dotsContainer) {
      dotsContainer.innerHTML = specials.map((_, idx) => `
        <button 
          class="h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-amber-400 w-6' : 'bg-white/30 hover:bg-white/50 w-2'}"
          onclick="window.SpecialsBoard.selectIndex(${idx})"
          title="View deal ${idx + 1}"
        ></button>
      `).join('');
    }

    // Bind Budget Lock Button
    const lockBtn = document.getElementById('lockSpecialBudgetBtn');
    if (lockBtn && typeof onLockBudgetCallback === 'function') {
      lockBtn.addEventListener('click', () => {
        onLockBudgetCallback(item);
      });
    }
  }

  function next() {
    if (!specials.length) return;
    currentIndex = (currentIndex + 1) % specials.length;
    render();
  }

  function selectIndex(index) {
    if (index >= 0 && index < specials.length) {
      currentIndex = index;
      render();
    }
  }

  function init(initialSpecials, onLockBudget) {
    specials = initialSpecials || [];
    onLockBudgetCallback = onLockBudget;
    currentIndex = 0;

    const nextBtn = document.getElementById('nextSpecialBtn');
    if (nextBtn) {
      // Avoid duplicate event listener
      nextBtn.onclick = () => next();
    }

    render();
  }

  function updateSpecials(newSpecials) {
    specials = (newSpecials || []).filter(s => s.active !== false);
    if (currentIndex >= specials.length) currentIndex = 0;
    render();
  }

  return {
    init,
    render,
    next,
    selectIndex,
    updateSpecials
  };
})();

