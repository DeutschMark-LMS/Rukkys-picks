/**
 * Rukky's Picks - Meal Mixer Engine (engine.js)
 * Automatically takes individual food items and prices from campus canteens
 * and combines them into balanced, realistic, authentic Nigerian campus meals.
 */
(function () {
  'use strict';

  function formatNaira(amount) {
    return '₦' + Number(amount || 0).toLocaleString('en-NG');
  }

  // Smart tag & verdict generators based on ingredients
  function determineCategory(main, protein, spotId) {
    const mainName = (main?.name || '').toLowerCase();
    const proteinName = (protein?.name || '').toLowerCase();

    if (spotId === 'night-grill' || mainName.includes('shawarma') || proteinName.includes('suya') || proteinName.includes('wings')) {
      return 'night';
    }
    if (mainName.includes('noodles') || mainName.includes('indomie') || mainName.includes('bread') || mainName.includes('fries') || mainName.includes('chips')) {
      return 'fast';
    }
    return 'heavy';
  }

  function generateVibeBadge(totalPrice, main, protein, side, drink, category, lowBudgetLimit = 1300) {
    const m = (main?.name || '').toLowerCase();
    const p = (protein?.name || '').toLowerCase();
    const s = (side?.name || '').toLowerCase();
    const d = (drink?.name || '').toLowerCase();

    if (totalPrice <= lowBudgetLimit) return 'Super Saver 🪙';
    if (totalPrice <= (lowBudgetLimit + 300)) return 'Budget Choice 💸';
    if (s.includes('plantain') || s.includes('dodo')) return 'Sweet & Savory 🍌';
    if (d.includes('zobo') || d.includes('malt') || d.includes('yoghurt')) return 'Complete Set 🥤';
    if (p.includes('chicken') || p.includes('goat') || p.includes('turkey')) return 'Top Choice 👑';
    if (p.includes('egg') && m.includes('beans')) return 'High Protein 🔋';
    if (m.includes('noodles')) return 'Quick Energy ⚡';
    if (m.includes('yam') || m.includes('egusi') || m.includes('soup')) return 'Full Stomach 🍛';
    if (category === 'night') return 'Night Snack 🌙';
    return 'Rukky Approved ⭐';
  }

  function generateVerdict(main, protein, side, drink, spot, totalPrice) {
    const m = (main?.name || '').toLowerCase();
    const p = (protein?.name || '').toLowerCase();
    const s = (side?.name || '').toLowerCase();
    const d = (drink?.name || '').toLowerCase();

    if (side && drink) {
      return `The full campus experience. The savory ${main.name} with tender ${protein.name}, sweet ${side.name}, and chilled ${drink.name} will keep you satisfied for the whole day.`;
    }
    if (side && (s.includes('plantain') || s.includes('dodo'))) {
      return `Fried plantain (dodo) makes every meal 10x better! Perfect sweet balance to go with the hot ${main.name} and ${protein.name}.`;
    }
    if (drink && (d.includes('zobo') || d.includes('malt') || d.includes('yoghurt'))) {
      return `Nothing beats washing down ${main.name} and ${protein.name} with a chilled ${drink.name} after a hot walk across campus.`;
    }
    if (m.includes('beans') && (p.includes('egg') || p.includes('plantain'))) {
      return `A protein-packed campus favorite. It fills your stomach cleanly and keeps hunger away for at least five hours.`;
    }
    if (m.includes('noodles') && p.includes('egg')) {
      return `The undisputed student lifesaver. Ready in 5 minutes, spicy, hot, and packed with energy for night reading or quick breaks.`;
    }
    if (m.includes('bread') && p.includes('akara')) {
      return `The legendary campus breakfast! Put the hot, fresh akara right inside the warm bread for the best morning bite under ₦1,000.`;
    }
    if (m.includes('yam') || m.includes('egusi')) {
      return `Heavy, hot, and deeply traditional. Best eaten after your major lectures when you have time to relax and digest properly.`;
    }
    if (p.includes('suya') || p.includes('wings')) {
      return `${spot?.name || 'This spot'} spices this to perfection. A great evening reward after a long day of lectures.`;
    }
    if (totalPrice <= 1200) {
      return `Unbeatable value for your money. Fresh, warm food that keeps your belly full without draining your weekly allowance.`;
    }
    return `Prepared fresh daily at ${spot?.name || 'campus'}. A great balanced plate with generous portions.`;
  }

  function generateRating(totalPrice, hasDrink, hasSide) {
    let score = 9.2;
    if (hasDrink) score += 0.2;
    if (hasSide) score += 0.2;
    if (totalPrice < 1500) score += 0.2;
    if (score > 9.9) score = 9.9;
    return score.toFixed(1) + '/10';
  }

  const RukkysEngine = {
    /**
     * Takes an array of raw items and spots, and mixes them into authentic meal combos
     * using configurable rules (budgetCap, lowBudgetLimit, allowed formations, blacklist).
     */
    generateCombos(items = [], spots = [], options = {}) {
      if (!Array.isArray(items) || items.length === 0) {
        return [];
      }

      // Merge active rules: options override saved rules, which override defaults
      const savedRules = (window.currentEngineRules || (window.dbService && window.dbService.getEngineRulesSync ? window.dbService.getEngineRulesSync() : null)) || {};
      const activeRules = Object.assign(
        {},
        window.DEFAULT_ENGINE_RULES || {
          budgetCap: 4000,
          lowBudgetLimit: 1300,
          allowCoreDuos: true,
          allowSides: true,
          allowDrinks: true,
          allowDoubleProtein: true,
          allowCarbSides: true,
          allowSnackCombos: true,
          allowDeluxe: false,
          combosPerSpotLimit: 35,
          blacklist: []
        },
        savedRules,
        options
      );

      const budgetCap = Number(activeRules.budgetCap) || 4000;
      const lowBudgetLimit = Number(activeRules.lowBudgetLimit) || 1300;
      const allowCoreDuos = activeRules.allowCoreDuos !== false;
      const allowSides = activeRules.allowSides !== false;
      const allowDrinks = activeRules.allowDrinks !== false;
      const allowDoubleProtein = activeRules.allowDoubleProtein !== false;
      const allowCarbSides = activeRules.allowCarbSides !== false;
      const allowSnackCombos = activeRules.allowSnackCombos !== false;
      const allowDeluxe = Boolean(activeRules.allowDeluxe);
      const combosPerSpotLimit = Number(activeRules.combosPerSpotLimit) || 35;

      // Parse blacklist rules
      let blacklistRules = [];
      if (Array.isArray(activeRules.blacklist)) {
        blacklistRules = activeRules.blacklist;
      } else if (typeof activeRules.blacklist === 'string') {
        blacklistRules = activeRules.blacklist.split('\n');
      }
      blacklistRules = blacklistRules.map(s => s.trim().toLowerCase()).filter(Boolean);

      function isBlacklisted(itemList) {
        if (!blacklistRules.length) return false;
        const itemNames = itemList.map(it => (it.name || '').toLowerCase());
        for (const rule of blacklistRules) {
          if (rule.includes('+')) {
            const parts = rule.split('+').map(p => p.trim()).filter(Boolean);
            if (parts.length > 0 && parts.every(part => itemNames.some(n => n.includes(part)))) {
              return true;
            }
          } else {
            if (itemNames.some(n => n.includes(rule))) {
              return true;
            }
          }
        }
        return false;
      }

      const spotsMap = new Map();
      (spots || []).forEach(sp => spotsMap.set(sp.id, sp));

      // Group active items by spot
      const itemsBySpot = {};
      items.forEach(it => {
        if (it.available === false) return;
        const sId = it.spotId || 'main-caf';
        if (!itemsBySpot[sId]) itemsBySpot[sId] = [];
        itemsBySpot[sId].push(it);
      });

      const generated = [];

      Object.keys(itemsBySpot).forEach(spotId => {
        const spotItems = itemsBySpot[spotId];
        const spot = spotsMap.get(spotId) || {
          id: spotId,
          name: spotItems[0]?.spotName || 'Campus Food Canteen',
          tag: 'Campus Spot'
        };

        const mains = spotItems.filter(i => i.type === 'main');
        const proteins = spotItems.filter(i => i.type === 'protein');
        const sides = spotItems.filter(i => i.type === 'side');
        const drinks = spotItems.filter(i => i.type === 'drink');

        // Buckets by meal formation for balanced variety
        const duosBucket = [];
        const sidesBucket = [];
        const drinksBucket = [];
        const doubleProteinBucket = [];
        const carbSidesBucket = [];
        const snackCombosBucket = [];
        const deluxeBucket = [];
        const singleItemsBucket = [];

        // Case A: If canteen has Mains and Proteins, mix core meals!
        if (mains.length > 0 && proteins.length > 0) {

          mains.forEach(main => {
            proteins.forEach(protein => {
              const coreItems = [main, protein];
              const corePrice = main.price + protein.price;
              let baseCategory = determineCategory(main, protein, spotId);
              if (corePrice <= lowBudgetLimit) baseCategory = 'budget';

              // 1. Core Duos: Main + Protein
              if (allowCoreDuos && corePrice <= budgetCap && !isBlacklisted(coreItems)) {
                const title = `${main.name} + ${protein.name}`;
                const vibeBadge = generateVibeBadge(corePrice, main, protein, null, null, baseCategory, lowBudgetLimit);
                const rukkysVerdict = generateVerdict(main, protein, null, null, spot, corePrice);
                const rating = generateRating(corePrice, false, false);

                duosBucket.push({
                  id: `gen-${spotId}-${main.id}-${protein.id}`,
                  title: title,
                  price: corePrice,
                  category: baseCategory,
                  spotId: spotId,
                  spotName: spot.name,
                  spotTag: spot.tag || 'Campus Spot',
                  items: coreItems.map(it => ({ name: it.name, price: it.price, type: it.type })),
                  rukkysVerdict: rukkysVerdict,
                  rating: rating,
                  vibeBadge: vibeBadge
                });
              }

              // 2. Add with Side (Loop all available sides: Dodo, Salad, Moi-Moi, etc.)
              if (allowSides && sides.length > 0) {
                sides.forEach(side => {
                  const comboWithSide = [main, protein, side];
                  const sidePrice = corePrice + side.price;

                  if (sidePrice <= budgetCap && !isBlacklisted(comboWithSide)) {
                    let sideCategory = baseCategory;
                    if (sidePrice <= (lowBudgetLimit + 200)) sideCategory = 'budget';

                    sidesBucket.push({
                      id: `gen-${spotId}-${main.id}-${protein.id}-${side.id}`,
                      title: `${main.name} + ${protein.name} + ${side.name}`,
                      price: sidePrice,
                      category: sideCategory,
                      spotId: spotId,
                      spotName: spot.name,
                      spotTag: spot.tag || 'Campus Spot',
                      items: comboWithSide.map(it => ({ name: it.name, price: it.price, type: it.type })),
                      rukkysVerdict: generateVerdict(main, protein, side, null, spot, sidePrice),
                      rating: generateRating(sidePrice, false, true),
                      vibeBadge: generateVibeBadge(sidePrice, main, protein, side, null, sideCategory, lowBudgetLimit)
                    });
                  }
                });
              }

              // 3. Add with Drink (Loop all available drinks: Zobo, Malt, Water, etc.)
              if (allowDrinks && drinks.length > 0) {
                drinks.forEach(drink => {
                  const comboWithDrink = [main, protein, drink];
                  const drinkPrice = corePrice + drink.price;

                  if (drinkPrice <= budgetCap && !isBlacklisted(comboWithDrink)) {
                    let drinkCategory = baseCategory;
                    if (drinkPrice <= (lowBudgetLimit + 300)) drinkCategory = 'budget';

                    drinksBucket.push({
                      id: `gen-${spotId}-${main.id}-${protein.id}-${drink.id}`,
                      title: `${main.name} + ${protein.name} + ${drink.name}`,
                      price: drinkPrice,
                      category: drinkCategory,
                      spotId: spotId,
                      spotName: spot.name,
                      spotTag: spot.tag || 'Campus Spot',
                      items: comboWithDrink.map(it => ({ name: it.name, price: it.price, type: it.type })),
                      rukkysVerdict: generateVerdict(main, protein, null, drink, spot, drinkPrice),
                      rating: generateRating(drinkPrice, true, false),
                      vibeBadge: generateVibeBadge(drinkPrice, main, protein, null, drink, drinkCategory, lowBudgetLimit)
                    });
                  }
                });
              }

              // 4. Deluxe Feast (Main + Protein + Side + Drink)
              if (allowDeluxe && sides.length > 0 && drinks.length > 0) {
                sides.forEach(side => {
                  drinks.forEach(drink => {
                    const deluxeItems = [main, protein, side, drink];
                    const deluxePrice = corePrice + side.price + drink.price;

                    if (deluxePrice <= budgetCap && !isBlacklisted(deluxeItems)) {
                      deluxeBucket.push({
                        id: `gen-${spotId}-${main.id}-${protein.id}-${side.id}-${drink.id}`,
                        title: `${main.name} + ${protein.name} + ${side.name} + ${drink.name}`,
                        price: deluxePrice,
                        category: 'heavy',
                        spotId: spotId,
                        spotName: spot.name,
                        spotTag: spot.tag || 'Campus Spot',
                        items: deluxeItems.map(it => ({ name: it.name, price: it.price, type: it.type })),
                        rukkysVerdict: generateVerdict(main, protein, side, drink, spot, deluxePrice),
                        rating: generateRating(deluxePrice, true, true),
                        vibeBadge: 'Deluxe Feast 👑'
                      });
                    }
                  });
                });
              }
            });
          });

          // 5. Double Protein Formations (Main + 2 Distinct Proteins)
          if (allowDoubleProtein && proteins.length >= 2) {
            mains.forEach(main => {
              for (let i = 0; i < proteins.length; i++) {
                for (let j = i + 1; j < proteins.length; j++) {
                  const p1 = proteins[i];
                  const p2 = proteins[j];
                  const dpItems = [main, p1, p2];
                  const dpPrice = main.price + p1.price + p2.price;

                  if (dpPrice <= budgetCap && !isBlacklisted(dpItems)) {
                    doubleProteinBucket.push({
                      id: `gen-dp-${spotId}-${main.id}-${p1.id}-${p2.id}`,
                      title: `${main.name} + ${p1.name} + ${p2.name}`,
                      price: dpPrice,
                      category: 'heavy',
                      spotId: spotId,
                      spotName: spot.name,
                      spotTag: spot.tag || 'Campus Spot',
                      items: dpItems.map(it => ({ name: it.name, price: it.price, type: it.type })),
                      rukkysVerdict: `The ultimate protein boost! ${main.name} served hot with both ${p1.name} and ${p2.name} at ${spot.name}. Guaranteed to keep you satisfied through all lectures.`,
                      rating: generateRating(dpPrice, false, false),
                      vibeBadge: 'Double Protein 🥩'
                    });
                  }
                }
              }
            });
          }

          // 6. Carb & Side Duos (Main + Side e.g. Beans + Fried Plantain / Dodo)
          if (allowCarbSides && sides.length > 0) {
            mains.forEach(main => {
              sides.forEach(side => {
                const csItems = [main, side];
                const csPrice = main.price + side.price;

                if (csPrice <= budgetCap && !isBlacklisted(csItems)) {
                  const sName = (side.name || '').toLowerCase();
                  const badge = csPrice <= lowBudgetLimit
                    ? 'Super Saver 🪙'
                    : (sName.includes('plantain') || sName.includes('dodo') ? 'Sweet & Savory 🍌' : 'Budget Choice 💸');

                  carbSidesBucket.push({
                    id: `gen-cs-${spotId}-${main.id}-${side.id}`,
                    title: `${main.name} + ${side.name}`,
                    price: csPrice,
                    category: 'budget',
                    spotId: spotId,
                    spotName: spot.name,
                    spotTag: spot.tag || 'Campus Spot',
                    items: csItems.map(it => ({ name: it.name, price: it.price, type: it.type })),
                    rukkysVerdict: `A legendary campus budget combination! Fresh ${main.name} paired with hot ${side.name} at ${spot.name}. Filling, delicious, and easy on your pocket.`,
                    rating: generateRating(csPrice, false, true),
                    vibeBadge: badge
                  });
                }
              });
            });
          }

          // 7. Snack & Drink Combos (Side/Snack + Drink)
          if (allowSnackCombos && sides.length > 0 && drinks.length > 0) {
            sides.forEach(side => {
              drinks.forEach(drink => {
                const snkItems = [side, drink];
                const snkPrice = side.price + drink.price;

                if (snkPrice <= budgetCap && !isBlacklisted(snkItems)) {
                  snackCombosBucket.push({
                    id: `gen-snk-${spotId}-${side.id}-${drink.id}`,
                    title: `${side.name} + ${drink.name}`,
                    price: snkPrice,
                    category: 'fast',
                    spotId: spotId,
                    spotName: spot.name,
                    spotTag: spot.tag || 'Campus Spot',
                    items: snkItems.map(it => ({ name: it.name, price: it.price, type: it.type })),
                    rukkysVerdict: `The ideal between-lectures quick refuel. Grab a warm ${side.name} and wash it down with a chilled ${drink.name} from ${spot.name}.`,
                    rating: generateRating(snkPrice, true, true),
                    vibeBadge: 'Quick Refuel ⚡'
                  });
                }
              });
            });
          }

        } else if (spotItems.length > 0) {
          // If canteen doesn't have both mains & proteins (e.g. snack kiosk or bakery)
          if (allowSnackCombos && sides.length > 0 && drinks.length > 0) {
            sides.forEach(side => {
              drinks.forEach(drink => {
                const snkItems = [side, drink];
                const snkPrice = side.price + drink.price;
                if (snkPrice <= budgetCap && !isBlacklisted(snkItems)) {
                  snackCombosBucket.push({
                    id: `gen-snk-${spotId}-${side.id}-${drink.id}`,
                    title: `${side.name} + ${drink.name}`,
                    price: snkPrice,
                    category: 'fast',
                    spotId: spotId,
                    spotName: spot.name,
                    spotTag: spot.tag || 'Campus Spot',
                    items: snkItems.map(it => ({ name: it.name, price: it.price, type: it.type })),
                    rukkysVerdict: `A quick campus snack combo of ${side.name} and ${drink.name} from ${spot.name}.`,
                    rating: '9.4/10',
                    vibeBadge: 'Quick Refuel ⚡'
                  });
                }
              });
            });
          }

          // Single servings fallback
          spotItems.forEach(item => {
            if (item.price <= budgetCap && !isBlacklisted([item])) {
              singleItemsBucket.push({
                id: `gen-single-${spotId}-${item.id}`,
                title: item.name,
                price: item.price,
                category: item.price <= lowBudgetLimit ? 'budget' : 'fast',
                spotId: spotId,
                spotName: spot.name,
                spotTag: spot.tag || 'Campus Spot',
                items: [{ name: item.name, price: item.price, type: item.type }],
                rukkysVerdict: `Single serving portion of ${item.name} prepared fresh at ${spot.name}.`,
                rating: '9.3/10',
                vibeBadge: item.price <= lowBudgetLimit ? 'Budget Pick 🪙' : 'Fresh Snack 🥪'
              });
            }
          });
        }

        // Interleave formations evenly so that double proteins, carb & sides,
        // and snacks are never cut off by standard duos
        const formationBuckets = [
          duosBucket,
          sidesBucket,
          drinksBucket,
          doubleProteinBucket,
          carbSidesBucket,
          snackCombosBucket,
          deluxeBucket,
          singleItemsBucket
        ];

        const spotCombos = [];
        let bucketHasItems = true;
        let bucketIndex = 0;
        while (bucketHasItems) {
          bucketHasItems = false;
          for (const b of formationBuckets) {
            if (bucketIndex < b.length) {
              spotCombos.push(b[bucketIndex]);
              bucketHasItems = true;
            }
          }
          bucketIndex++;
        }

        // Deduplicate combinations within the spot
        const spotUnique = new Map();
        spotCombos.forEach(c => {
          if (!spotUnique.has(c.title)) {
            spotUnique.set(c.title, c);
          }
        });

        let spotList = Array.from(spotUnique.values());

        // Apply spot variety limit (default 35, or admin defined)
        if (combosPerSpotLimit && combosPerSpotLimit > 0 && spotList.length > combosPerSpotLimit) {
          spotList = spotList.slice(0, combosPerSpotLimit);
        }

        spotList.forEach(c => generated.push(c));
      });

      // Filter out redundant duplicates if any
      const uniqueMap = new Map();
      generated.forEach(combo => {
        if (!uniqueMap.has(combo.title + combo.spotId)) {
          uniqueMap.set(combo.title + combo.spotId, combo);
        }
      });

      const result = Array.from(uniqueMap.values());

      // Return generated combos or empty array if none met criteria
      return result;
    },

    /**
     * Filter combos by student budget
     */
    filterByBudget(combos, maxBudget) {
      if (!maxBudget || isNaN(maxBudget) || maxBudget <= 0) return combos;
      return combos.filter(c => c.price <= maxBudget);
    },

    /**
     * Get combos specifically generated for a single vendor spot
     */
    mixForVendor(spotId, items = [], spots = []) {
      const all = this.generateCombos(items, spots);
      return all.filter(c => c.spotId === spotId);
    },

    /**
     * Overview stats of the mixing engine
     */
    getStats(items = [], spots = []) {
      const combos = this.generateCombos(items, spots);
      const prices = combos.map(c => c.price);
      return {
        totalItems: items.length,
        totalCombos: combos.length,
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0
      };
    }
  };

  // Expose globally
  window.RukkysEngine = RukkysEngine;
})();
