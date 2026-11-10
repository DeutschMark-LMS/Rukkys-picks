# Rukky's Picks 🍲

> Authentic Campus Food Budget & Meal Combination App for Wellspring University, Benin City, Nigeria.

Rukky's Picks is a fast, responsive, mobile-first web app that helps university students find balanced, delicious meals tailored to their exact daily budget.

---

## ✨ Features

- **Rukky's Engine (Smart Combiner)**: Automatically mixes individual cafeteria food items (mains, proteins, sides, drinks) into authentic Nigerian meals:
  - **Core Duos**: Main + Protein (e.g., *Jollof Rice + Fried Chicken*)
  - **Meals with Sides**: Adds sides like *Fried Plantain (Dodo)* or *Steamed Salad*
  - **Meals with Drinks**: Adds chilled *Zobo Drink* or *Cold Malt*
  - **Double Protein**: High-energy combos with 2 distinct proteins (*Jollof Rice + Chicken + Boiled Egg*)
  - **Carb & Side Duos**: Pocket-friendly meatless combos (*Honey Beans + Fried Plantain / Dodo*)
  - **Snack & Drink Combos**: Quick between-lecture refuels (*Meat Pie + Cold Zobo*)
  - **Deluxe Feasts**: Full 4-piece plates
  - **Formation Interleaving**: Balanced variety across all formation types without crowding
  - **Incompatible Food Blacklist**: Rules to prevent weird combinations (e.g. Swallow + Bread)
- **Interactive Budget Slider & Quick Presets**: Enter any budget (≤ ₦1,000, ₦1,500, ₦2,000+) to filter meals dynamically.
- **Campus Daily Specials**: Featured meal deals with countdown timers and instant ordering links.
- **Campus Food Canteen Spots**: Direct breakdown by cafeteria and campus eatery.
- **Student Food Suggestions**: Allows students to submit new food ideas and favorite cafeteria meals.
- **Admin & Vendor Dashboards**: Full control over meal items, daily deals, prices, engine rules, and Firestore database wiping/backup tools.
- **Dual-Storage Engine**: Operates in pure offline/localStorage mode or live Firebase Cloud Firestore mode.

---

## 📁 Project Structure

```text
├── index.html            # Student-facing mobile web application
├── admin.html            # Campus Administrator dashboard & engine control
├── vendor.html           # Campus cafeteria vendor portal
├── clear-cloud.html      # Cloud Firestore wiping and maintenance tool
├── js/
│   ├── firebase-config.js # Database service (Dual-write Firestore & localStorage)
│   ├── engine.js          # Rukky's Meal Mixer Engine & formation rules
│   ├── app.js             # Student UI controller
│   ├── admin.js           # Admin UI controller & rules sync
│   ├── vendor.js          # Vendor portal logic
│   └── components/        # Reusable UI component modules
└── .gitignore
```

---

## 🚀 Getting Started

No build step or dependencies required. Open directly in any modern browser or run a lightweight local HTTP server:

```bash
# Start a local server
python3 -m http.server 8080

# Visit in your browser
http://localhost:8080/index.html
```

---

## 🛡️ License

MIT License. Built for students of Wellspring University.
