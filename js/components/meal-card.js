/**
 * Rukky's Picks - Component: MealCard
 * Renders individual meal combination cards with item breakdowns, pricing, and action triggers.
 * High-contrast color hierarchy for instant readability in bright campus conditions.
 */
window.MealCard = (function () {
  function formatNaira(amount) {
    return '₦' + Number(amount || 0).toLocaleString('en-NG');
  }

  function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Failed to copy', err);
    }
    document.body.removeChild(textarea);
  }

  // Category Color Theming (Semantic Badges)
  const categoryStyles = {
    heavy: {
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
      tagIcon: '🍛'
    },
    fast: {
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-200/80',
      tagIcon: '🥪'
    },
    night: {
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      tagIcon: '🌙'
    },
    budget: {
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      tagIcon: '💸'
    }
  };

  function create(combo, currentBudget, onSpotClick, onCopySuccess) {
    const changeRemaining = currentBudget && currentBudget >= combo.price
      ? currentBudget - combo.price
      : null;

    const theme = categoryStyles[combo.category] || {
      badgeClass: 'bg-orange-50 text-orange-800 border-orange-200/80',
      tagIcon: '⭐'
    };

    const card = document.createElement('div');
    card.className = "bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group";

    const hasDetailedItems = combo.items && combo.items.length > 0 && !(combo.items.length === 1 && combo.items[0].name === combo.title);

    const itemsListHtml = hasDetailedItems ? (combo.items || []).map(it => `
      <li class="flex items-center justify-between text-xs py-1.5 border-b border-stone-100 last:border-0">
        <span class="text-stone-800 font-medium flex items-center gap-2 min-w-0">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0"></span>
          <span class="truncate">${it.name}</span>
        </span>
        <span class="font-extrabold text-stone-600 text-xs shrink-0 ml-2 font-display">
          ${it.pricingType === 'from_price' ? '<span class="text-[9px] uppercase font-black text-amber-700 bg-amber-100 border border-amber-200 px-1 py-0.2 rounded mr-1">from</span>' : ''}${formatNaira(it.price)}
        </span>
      </li>
    `).join('') : `
      <li class="flex items-center justify-between text-xs py-1">
        <span class="text-stone-800 font-medium flex items-center gap-2 min-w-0">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0"></span>
          <span class="truncate">Full portion serving prepared fresh</span>
        </span>
        <span class="font-extrabold text-stone-600 text-xs shrink-0 ml-2 font-display">${formatNaira(combo.price)}</span>
      </li>
    `;

    card.innerHTML = `
      <!-- Header info: Badge, Title & Main Price -->
      <div class="flex items-start justify-between gap-3 mb-2.5">
        <div class="min-w-0 flex-1">
          <span class="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${theme.badgeClass} mb-1.5">
            <span>${theme.tagIcon}</span>
            <span>${combo.vibeBadge || 'Rukky Approved ⭐'}</span>
          </span>
          <h2 class="text-base sm:text-lg font-extrabold text-stone-900 leading-snug group-hover:text-brand-600 transition-colors">
            ${combo.title}
          </h2>
        </div>
        <div class="text-right shrink-0">
          ${combo.hasFromPrice ? '<span class="text-[9px] text-amber-700 font-extrabold uppercase tracking-wider block leading-tight">starts from</span>' : ''}
          <span class="text-xl sm:text-2xl font-black font-display text-brand-600 tracking-tight block">${formatNaira(combo.price)}</span>
          <span class="text-[10px] text-stone-400 font-extrabold uppercase tracking-wider block">${combo.hasFromPrice ? 'base meal' : 'total'}</span>
        </div>
      </div>

      <!-- Items Breakdown (Clean, readable contrast) -->
      <div class="bg-stone-50 rounded-2xl p-3 my-3 border border-stone-200/70">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[10px] font-black text-stone-500 uppercase tracking-wider">Items in this meal:</span>
          <span class="text-[10px] text-stone-400 font-bold">${hasDetailedItems ? (combo.items.length + ' items') : 'Full plate'}</span>
        </div>
        <ul class="space-y-0.5">
          ${itemsListHtml}
        </ul>
      </div>

      <!-- Rukky's Review Note (Warm, high-contrast) -->
      <div class="flex items-start gap-2.5 text-xs bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80 mb-3 text-stone-800">
        <span class="text-base select-none shrink-0 pt-0.5">💬</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-black text-amber-900 uppercase tracking-wider">Rukky's Verdict</span>
            <span class="text-[11px] font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md border border-amber-300/60">★ ${combo.rating || '9.5'}</span>
          </div>
          <p class="text-xs text-stone-700 italic leading-relaxed">"${combo.rukkysVerdict || 'A very satisfying campus meal.'}"</p>
        </div>
      </div>

      <!-- Where to get & Actions Footer -->
      <div class="pt-2.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <button class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition view-spot-btn max-w-[160px] sm:max-w-[200px]" title="View Food Spot Details">
          <span class="text-brand-600 text-sm">📍</span>
          <span class="truncate">${combo.spotName || 'Campus Spot'}</span>
        </button>

        <div class="flex items-center gap-1.5 shrink-0">
          ${changeRemaining !== null ? `
            <span class="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl">
              <span>💰 Left:</span>
              <span>${formatNaira(changeRemaining)}</span>
            </span>
          ` : ''}
          
          <button 
            class="copy-combo-btn p-2 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 transition" 
            title="Copy Meal Details to Share"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
          </button>
        </div>
      </div>
    `;

    // Bind Spot Click
    const spotBtn = card.querySelector('.view-spot-btn');
    if (spotBtn && typeof onSpotClick === 'function') {
      spotBtn.addEventListener('click', () => onSpotClick(combo.spotId));
    }

    // Bind Copy Button
    const copyBtn = card.querySelector('.copy-combo-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pricePrefix = combo.hasFromPrice ? 'Starts from ' : '';
        const shareText = `🍽️ Rukky's Pick at Wellspring:\n${combo.title}\nPrice: ${pricePrefix}${formatNaira(combo.price)}\nLocation: ${combo.spotName || 'Campus Spot'}`;
        copyToClipboard(shareText);
        if (typeof onCopySuccess === 'function') {
          onCopySuccess();
        }
      });
    }

    return card;
  }

  return {
    formatNaira,
    copyToClipboard,
    create
  };
})();
