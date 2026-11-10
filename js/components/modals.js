/**
 * Rukky's Picks - Component: AppModals
 * Handles Spots directory modal, Suggestion submission modal, Campus Tips modal, and Toasts.
 */
window.AppModals = (function () {
  const spotsModal = document.getElementById('spotsModal');
  const suggestModal = document.getElementById('suggestModal');
  const hacksModal = document.getElementById('hacksModal');
  const spotsListContent = document.getElementById('spotsListContent');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const toastIcon = document.getElementById('toastIcon');

  let currentSpots = [];
  let toastTimer = null;

  function showToast(message, icon = '✨') {
    if (!toast) return;
    if (toastMsg) toastMsg.innerText = message;
    if (toastIcon) toastIcon.innerText = icon;
    toast.classList.remove('opacity-0', 'pointer-events-none');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add('opacity-0', 'pointer-events-none');
    }, 3200);
  }

  function setSpotsData(spots) {
    currentSpots = spots || [];
  }

  function openSpots(highlightSpotId = null) {
    if (!spotsModal || !spotsListContent) return;
    spotsListContent.innerHTML = '';

    if (!currentSpots.length) {
      spotsListContent.innerHTML = `
        <div class="py-6 text-center text-xs text-stone-400">
          No food spots listed yet.
        </div>
      `;
    } else {
      currentSpots.forEach(spot => {
        const isSelected = spot.id === highlightSpotId;
        const div = document.createElement('div');
        div.className = `p-3.5 rounded-2xl border transition ${
          isSelected 
            ? 'border-brand-500 bg-orange-50/60 ring-2 ring-brand-500/20' 
            : 'border-stone-200 bg-stone-50'
        }`;
        div.innerHTML = `
          <div class="flex items-center justify-between mb-1">
            <h4 class="font-bold text-stone-900 text-sm">${spot.name}</h4>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isSelected ? 'bg-brand-600 text-white' : 'bg-stone-200 text-stone-700'
            }">${spot.tag}</span>
          </div>
          <p class="text-xs text-stone-600 mb-2">${spot.description || 'Campus food spot'}</p>
          <div class="flex items-center text-[11px] font-semibold text-stone-500 gap-1.5">
            <svg class="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2"></path></svg>
            <span>${spot.timing || 'Campus Hours'}</span>
          </div>
        `;
        spotsListContent.appendChild(div);
      });
    }

    spotsModal.classList.remove('hidden');
  }

  function openSuggest() {
    if (suggestModal) suggestModal.classList.remove('hidden');
  }

  function openTips() {
    if (hacksModal) hacksModal.classList.remove('hidden');
  }

  function closeAll() {
    [spotsModal, suggestModal, hacksModal].forEach(m => {
      if (m) m.classList.add('hidden');
    });
  }

  function init(onSubmitSuggestion) {
    // Modal Close Buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', closeAll);
    });

    // Close on backdrop click
    [spotsModal, suggestModal, hacksModal].forEach(m => {
      if (m) {
        m.addEventListener('click', (e) => {
          if (e.target === m) m.classList.add('hidden');
        });
      }
    });

    // Suggest Form submission
    const form = document.getElementById('suggestForm');
    if (form && typeof onSubmitSuggestion === 'function') {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('suggesterName').value.trim();
        const items = document.getElementById('suggestedItems').value.trim();
        const price = parseFloat(document.getElementById('suggestedPrice').value);
        const spot = document.getElementById('suggestedSpot').value.trim();

        if (!name || !items || !price) return;

        await onSubmitSuggestion({
          suggesterName: name,
          suggestedItems: items,
          suggestedPrice: price,
          suggestedSpot: spot || "Campus Vendor"
        });

        form.reset();
        suggestModal.classList.add('hidden');
      });
    }
  }

  return {
    init,
    setSpotsData,
    openSpots,
    openSuggest,
    openTips,
    closeAll,
    showToast
  };
})();

