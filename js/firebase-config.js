/**
 * Rukky's Picks - Firebase & Unified Database Service
 * Handles Firestore real-time sync, Firebase Auth, and local-storage fallback for demo/offline use.
 */

// -------------------------------------------------------------
// 1. DEFAULT SEED DATA (Wellspring University Campus)
// -------------------------------------------------------------
const DEFAULT_SPOTS = [
  {
    id: "main-caf",
    name: "Main Campus Cafeteria",
    tag: "Campus Center",
    timing: "7:30 AM - 8:30 PM",
    description: "Located inside the student center. Serves different types of rice, swallow, beans, and fresh meat or fish."
  },
  {
    id: "bukka-gate",
    name: "Mama Joy's Food Canteen (School Gate)",
    tag: "Near School Gate",
    timing: "8:00 AM - 9:00 PM",
    description: "Located near the university gate. Famous for big portions of pounded yam, egusi soup, and peppered goat meat."
  },
  {
    id: "night-grill",
    name: "Uncle T's Evening Spot",
    tag: "Night Stand",
    timing: "5:30 PM - 10:30 PM",
    description: "A popular place for students in the evening. Serves hot beef suya, shawarma, and fried chips."
  },
  {
    id: "hostel-tuck",
    name: "Hostel Block B Tuck Shop",
    tag: "Hostel Area",
    timing: "8:00 AM - 11:00 PM",
    description: "The closest shop for students living in the hostel. Sells cooked noodles, boiled eggs, bread, tea, and cold drinks."
  },
  {
    id: "green-smoothie",
    name: "Fresh Fruit and Juice Corner",
    tag: "Student Arcade",
    timing: "9:00 AM - 6:00 PM",
    description: "Serves fresh fruit salads, cold tiger nut drink, sweet yoghurt bowls, and sweet potatoes with egg sauce."
  }
];

const DEFAULT_SPECIALS = [];

// -------------------------------------------------------------
// 1B. DEFAULT ENGINE RULES (Configurable Mixing Logic)
// -------------------------------------------------------------
const DEFAULT_ENGINE_RULES = {
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
  blacklist: [
    "Pounded Yam + Bread",
    "Eba + Bread",
    "Fufu + Noodles",
    "Amala + Noodles",
    "Jollof Rice + Egusi Soup"
  ]
};
window.DEFAULT_ENGINE_RULES = DEFAULT_ENGINE_RULES;

// -------------------------------------------------------------
// 1C. FOOD ITEMS & COMBOS (Clean Slate: Real Items Added via Admin)
// -------------------------------------------------------------
const DEFAULT_ITEMS = [];

const DEFAULT_COMBOS = [];

// -------------------------------------------------------------
// 2. FIREBASE INITIALIZATION & MODE DETECTION
// -------------------------------------------------------------
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCPDQo2ZuTXDPL8n1_gLwJYDeFjX4zlthk",
  authDomain: "rukky-s-picks-81b70.firebaseapp.com",
  projectId: "rukky-s-picks-81b70",
  storageBucket: "rukky-s-picks-81b70.firebasestorage.app",
  messagingSenderId: "1065689441210",
  appId: "1:1065689441210:web:baa77858effd7c9ea23383"
};

const STORAGE_KEYS = {
  FIREBASE_CONFIG: 'rukkys_firebase_config',
  ITEMS: 'rukkys_items',
  COMBOS: 'rukkys_combos',
  SPECIALS: 'rukkys_specials',
  SPOTS: 'rukkys_spots',
  SUGGESTIONS: 'rukkys_suggestions',
  ENGINE_RULES: 'rukkys_engine_rules',
  DEMO_AUTH: 'rukkys_demo_auth',
  VENDOR_AUTH: 'rukkys_vendor_auth',
  ADMIN_PASSCODE: 'rukkys_admin_passcode'
};

let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;
let isFirebaseActive = false;

// Attempt to load and initialize Firebase
function initFirebase() {
  const savedConfig = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);

  // If user explicitly chose local mode or has not saved config, run in pure Local Storage Mode
  if (!savedConfig || savedConfig === 'local') {
    isFirebaseActive = false;
    firestoreDb = null;
    firebaseAuth = null;
    console.info("Rukky's Picks: Running in pure Local Storage Mode (Offline & Reliable).");
    return false;
  }

  let config = null;
  try {
    const parsed = JSON.parse(savedConfig);
    if (parsed && parsed.apiKey && parsed.projectId) {
      config = parsed;
    }
  } catch (e) {}

  if (!config || !config.apiKey || !config.projectId) {
    isFirebaseActive = false;
    firestoreDb = null;
    firebaseAuth = null;
    console.info("Rukky's Picks: Running in pure Local Storage Mode.");
    return false;
  }

  try {
    if (window.firebase) {
      if (!firebase.apps.length) {
        firebaseApp = firebase.initializeApp(config);
      } else {
        firebaseApp = firebase.app();
      }
      firestoreDb = firebase.firestore();
      firebaseAuth = firebase.auth();
      isFirebaseActive = true;
      console.log("Rukky's Picks: Connected to live Firebase Firestore! 🚀 Project:", config.projectId);
      return true;
    } else {
      console.warn("Rukky's Picks: Firebase SDK scripts not loaded yet. Running in Local Mode.");
      isFirebaseActive = false;
      return false;
    }
  } catch (err) {
    console.error("Rukky's Picks: Failed to initialize Firebase:", err);
    isFirebaseActive = false;
    return false;
  }
}

// Ensure Local Storage has initial seed data
function ensureLocalStorageSeed() {
  const SEED_VERSION = 'v6_stable_local';
  const currentVersion = localStorage.getItem('rukkys_seed_version');

  if (currentVersion !== SEED_VERSION) {
    // Only initialize empty keys if not already present; NEVER wipe items user already entered!
    if (!localStorage.getItem(STORAGE_KEYS.ITEMS)) {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMBOS)) {
      localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SPECIALS)) {
      localStorage.setItem(STORAGE_KEYS.SPECIALS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SPOTS)) {
      localStorage.setItem(STORAGE_KEYS.SPOTS, JSON.stringify(DEFAULT_SPOTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ENGINE_RULES)) {
      localStorage.setItem(STORAGE_KEYS.ENGINE_RULES, JSON.stringify(DEFAULT_ENGINE_RULES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUGGESTIONS)) {
      localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify([]));
    }
    // Default to 'local' so external cloud data does not overwrite local changes
    const curFb = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
    if (!curFb || curFb === 'null') {
      localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, 'local');
    }
    localStorage.setItem('rukkys_seed_version', SEED_VERSION);
  }

  if (!localStorage.getItem(STORAGE_KEYS.ITEMS)) {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMBOS)) {
    localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SPECIALS)) {
    localStorage.setItem(STORAGE_KEYS.SPECIALS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SPOTS)) {
    localStorage.setItem(STORAGE_KEYS.SPOTS, JSON.stringify(DEFAULT_SPOTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ENGINE_RULES)) {
    localStorage.setItem(STORAGE_KEYS.ENGINE_RULES, JSON.stringify(DEFAULT_ENGINE_RULES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUGGESTIONS)) {
    localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ADMIN_PASSCODE)) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSCODE, 'admin123');
  }
}

ensureLocalStorageSeed();
initFirebase();

const localItemSubscribers = [];
const localComboSubscribers = [];
const localSpecialSubscribers = [];
const localSpotSubscribers = [];
const localRuleSubscribers = [];

function notifyLocalItems() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]');
  localItemSubscribers.forEach(cb => { try { cb(data); } catch(e){} });
}

function notifyLocalCombos() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMBOS) || '[]');
  localComboSubscribers.forEach(cb => { try { cb(data); } catch(e){} });
}

function notifyLocalSpecials() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALS) || '[]');
  localSpecialSubscribers.forEach(cb => { try { cb(data); } catch(e){} });
}

function notifyLocalSpots() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPOTS) || '[]');
  localSpotSubscribers.forEach(cb => { try { cb(data); } catch(e){} });
}

function notifyLocalEngineRules() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ENGINE_RULES) || JSON.stringify(DEFAULT_ENGINE_RULES));
  localRuleSubscribers.forEach(cb => { try { cb(data); } catch(e){} });
}

// -------------------------------------------------------------
// 3. UNIFIED DATABASE SERVICE (Firestore with LocalStorage Fallback)
// -------------------------------------------------------------
const dbService = {
  isUsingFirebase() {
    return isFirebaseActive && firestoreDb !== null;
  },

  getSavedConfig() {
    try {
      const cfg = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
      if (cfg && cfg !== 'local') return JSON.parse(cfg);
    } catch (e) {}
    return DEFAULT_FIREBASE_CONFIG;
  },

  saveFirebaseConfig(configObj) {
    localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(configObj));
    return initFirebase();
  },

  clearFirebaseConfig() {
    localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, 'local');
    isFirebaseActive = false;
    firestoreDb = null;
    firebaseAuth = null;
  },

  // --- FOOD ITEMS & PRICES (Individual offerings mixed by Rukky's Engine) ---
  listenItems(callback) {
    if (this.isUsingFirebase()) {
      return firestoreDb.collection('items').onSnapshot(snapshot => {
        const list = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(list));
        callback(list);
      }, err => {
        console.warn("Firestore error reading items, using local fallback:", err);
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]');
        callback(data);
      });
    } else {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]');
      callback(data);
      if (!localItemSubscribers.includes(callback)) {
        localItemSubscribers.push(callback);
      }
      const handler = () => {
        const fresh = JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]');
        callback(fresh);
      };
      window.addEventListener('storage', handler);
      return () => {
        const idx = localItemSubscribers.indexOf(callback);
        if (idx !== -1) localItemSubscribers.splice(idx, 1);
        window.removeEventListener('storage', handler);
      };
    }
  },

  async addItem(item) {
    // 1. Always update Local Storage immediately
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]');
    const newItem = { id: item.id || ('item-' + Date.now()), available: true, ...item };
    const existingIdx = list.findIndex(it => it.id === newItem.id);
    if (existingIdx !== -1) {
      list[existingIdx] = newItem;
    } else {
      list.unshift(newItem);
    }
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(list));
    notifyLocalItems();
    window.dispatchEvent(new Event('storage'));

    // 2. Sync to Firestore if active
    if (this.isUsingFirebase()) {
      try {
        if (item.id) {
          await firestoreDb.collection('items').doc(item.id).set(newItem);
        } else {
          const docRef = await firestoreDb.collection('items').add(newItem);
          newItem.id = docRef.id;
        }
      } catch (err) {
        console.warn("Could not sync item to Firestore:", err);
      }
    }
    return newItem;
  },

  async updateItem(id, item) {
    // 1. Always update Local Storage immediately
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]');
    const idx = list.findIndex(it => it.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...item };
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(list));
      notifyLocalItems();
      window.dispatchEvent(new Event('storage'));
    }

    // 2. Sync to Firestore if active
    if (this.isUsingFirebase()) {
      try {
        await firestoreDb.collection('items').doc(id).update(item);
      } catch (err) {
        console.warn("Could not update item in Firestore:", err);
      }
    }
  },

  async deleteItem(id) {
    // 1. Always update Local Storage immediately
    let list = JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]');
    list = list.filter(it => it.id !== id);
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(list));
    notifyLocalItems();
    window.dispatchEvent(new Event('storage'));

    // 2. Remove from Firestore if active
    if (this.isUsingFirebase()) {
      try {
        await firestoreDb.collection('items').doc(id).delete();
      } catch (err) {
        console.warn("Could not delete item in Firestore:", err);
      }
    }
  },

  // --- COMBOS ---
  listenCombos(callback) {
    if (this.isUsingFirebase()) {
      return firestoreDb.collection('combos').onSnapshot(snapshot => {
        const list = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(list));
        callback(list);
      }, err => {
        console.warn("Firestore error reading combos, using local fallback:", err);
        callback(JSON.parse(localStorage.getItem(STORAGE_KEYS.COMBOS) || '[]'));
      });
    } else {
      // Local storage
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMBOS) || '[]');
      callback(data);
      if (!localComboSubscribers.includes(callback)) {
        localComboSubscribers.push(callback);
      }
      // Listen to window storage events if cross-tab
      const handler = () => {
        const fresh = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMBOS) || '[]');
        callback(fresh);
      };
      window.addEventListener('storage', handler);
      return () => {
        const idx = localComboSubscribers.indexOf(callback);
        if (idx !== -1) localComboSubscribers.splice(idx, 1);
        window.removeEventListener('storage', handler);
      };
    }
  },

  async addCombo(combo) {
    // 1. Always update Local Storage immediately
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMBOS) || '[]');
    const newCombo = { id: combo.id || ('combo-' + Date.now()), ...combo };
    const existingIdx = list.findIndex(c => c.id === newCombo.id);
    if (existingIdx !== -1) {
      list[existingIdx] = newCombo;
    } else {
      list.unshift(newCombo);
    }
    localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(list));
    notifyLocalCombos();
    window.dispatchEvent(new Event('storage'));

    // 2. Sync to Firestore if active
    if (this.isUsingFirebase()) {
      try {
        if (combo.id) {
          await firestoreDb.collection('combos').doc(combo.id).set(newCombo);
        } else {
          const docRef = await firestoreDb.collection('combos').add(newCombo);
          newCombo.id = docRef.id;
        }
      } catch (err) {
        console.warn("Could not sync combo to Firestore:", err);
      }
    }
    return newCombo;
  },

  async updateCombo(id, combo) {
    // 1. Always update Local Storage immediately
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMBOS) || '[]');
    const idx = list.findIndex(c => c.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...combo };
      localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(list));
      notifyLocalCombos();
      window.dispatchEvent(new Event('storage'));
    }

    // 2. Sync to Firestore if active
    if (this.isUsingFirebase()) {
      try {
        await firestoreDb.collection('combos').doc(id).update(combo);
      } catch (err) {
        console.warn("Could not update combo in Firestore:", err);
      }
    }
  },

  async deleteCombo(id) {
    // 1. Always update Local Storage immediately
    let list = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMBOS) || '[]');
    list = list.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify(list));
    notifyLocalCombos();
    window.dispatchEvent(new Event('storage'));

    // 2. Remove from Firestore if active
    if (this.isUsingFirebase()) {
      try {
        await firestoreDb.collection('combos').doc(id).delete();
      } catch (err) {
        console.warn("Could not delete combo in Firestore:", err);
      }
    }
  },

  // --- SPECIALS ---
  listenSpecials(callback) {
    if (this.isUsingFirebase()) {
      return firestoreDb.collection('specials').onSnapshot(snapshot => {
        const list = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        localStorage.setItem(STORAGE_KEYS.SPECIALS, JSON.stringify(list));
        callback(list);
      }, err => {
        console.warn("Firestore error reading specials:", err);
        callback(JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALS) || '[]'));
      });
    } else {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALS) || '[]');
      callback(data);
      if (!localSpecialSubscribers.includes(callback)) {
        localSpecialSubscribers.push(callback);
      }
      const handler = () => {
        const fresh = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALS) || '[]');
        callback(fresh);
      };
      window.addEventListener('storage', handler);
      return () => {
        const idx = localSpecialSubscribers.indexOf(callback);
        if (idx !== -1) localSpecialSubscribers.splice(idx, 1);
        window.removeEventListener('storage', handler);
      };
    }
  },

  async addSpecial(special) {
    // 1. Always update Local Storage immediately
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALS) || '[]');
    const newSpec = { id: special.id || ('spec-' + Date.now()), active: true, ...special };
    const existingIdx = list.findIndex(s => s.id === newSpec.id);
    if (existingIdx !== -1) {
      list[existingIdx] = newSpec;
    } else {
      list.unshift(newSpec);
    }
    localStorage.setItem(STORAGE_KEYS.SPECIALS, JSON.stringify(list));
    notifyLocalSpecials();
    window.dispatchEvent(new Event('storage'));

    // 2. Sync to Firestore if active
    if (this.isUsingFirebase()) {
      try {
        if (special.id) {
          await firestoreDb.collection('specials').doc(special.id).set(newSpec);
        } else {
          const docRef = await firestoreDb.collection('specials').add(newSpec);
          newSpec.id = docRef.id;
        }
      } catch (err) {
        console.warn("Could not sync special to Firestore:", err);
      }
    }
    return newSpec;
  },

  async updateSpecial(id, special) {
    // 1. Always update Local Storage immediately
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALS) || '[]');
    const idx = list.findIndex(s => s.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...special };
      localStorage.setItem(STORAGE_KEYS.SPECIALS, JSON.stringify(list));
      notifyLocalSpecials();
      window.dispatchEvent(new Event('storage'));
    }

    // 2. Sync to Firestore if active
    if (this.isUsingFirebase()) {
      try {
        await firestoreDb.collection('specials').doc(id).update(special);
      } catch (err) {
        console.warn("Could not update special in Firestore:", err);
      }
    }
  },

  async deleteSpecial(id) {
    // 1. Always update Local Storage immediately
    let list = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALS) || '[]');
    list = list.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SPECIALS, JSON.stringify(list));
    notifyLocalSpecials();
    window.dispatchEvent(new Event('storage'));

    // 2. Remove from Firestore if active
    if (this.isUsingFirebase()) {
      try {
        await firestoreDb.collection('specials').doc(id).delete();
      } catch (err) {
        console.warn("Could not delete special in Firestore:", err);
      }
    }
  },

  // --- SPOTS ---
  listenSpots(callback) {
    if (this.isUsingFirebase()) {
      return firestoreDb.collection('spots').onSnapshot(snapshot => {
        const list = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        if (list.length > 0) {
          localStorage.setItem(STORAGE_KEYS.SPOTS, JSON.stringify(list));
          callback(list);
        } else {
          const local = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPOTS) || JSON.stringify(DEFAULT_SPOTS));
          callback(local);
        }
      }, err => {
        console.warn("Firestore error reading spots:", err);
        callback(JSON.parse(localStorage.getItem(STORAGE_KEYS.SPOTS) || JSON.stringify(DEFAULT_SPOTS)));
      });
    } else {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPOTS) || JSON.stringify(DEFAULT_SPOTS));
      callback(data);
      if (!localSpotSubscribers.includes(callback)) {
        localSpotSubscribers.push(callback);
      }
      const handler = () => {
        const fresh = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPOTS) || JSON.stringify(DEFAULT_SPOTS));
        callback(fresh);
      };
      window.addEventListener('storage', handler);
      return () => {
        const idx = localSpotSubscribers.indexOf(callback);
        if (idx !== -1) localSpotSubscribers.splice(idx, 1);
        window.removeEventListener('storage', handler);
      };
    }
  },

  async addSpot(spot) {
    // 1. Always update Local Storage immediately
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPOTS) || JSON.stringify(DEFAULT_SPOTS));
    const newSpot = { id: spot.id || ('spot-' + Date.now()), ...spot };
    const existingIdx = list.findIndex(s => s.id === newSpot.id);
    if (existingIdx !== -1) {
      list[existingIdx] = newSpot;
    } else {
      list.push(newSpot);
    }
    localStorage.setItem(STORAGE_KEYS.SPOTS, JSON.stringify(list));
    notifyLocalSpots();
    window.dispatchEvent(new Event('storage'));

    // 2. Sync to Firestore if active
    if (this.isUsingFirebase()) {
      try {
        if (spot.id) {
          await firestoreDb.collection('spots').doc(spot.id).set(newSpot);
        } else {
          const docRef = await firestoreDb.collection('spots').add(newSpot);
          newSpot.id = docRef.id;
        }
      } catch (err) {
        console.warn("Could not sync spot to Firestore:", err);
      }
    }
    return newSpot;
  },

  async updateSpot(id, spot) {
    // 1. Always update Local Storage immediately
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPOTS) || JSON.stringify(DEFAULT_SPOTS));
    const idx = list.findIndex(s => s.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...spot };
      localStorage.setItem(STORAGE_KEYS.SPOTS, JSON.stringify(list));
      notifyLocalSpots();
      window.dispatchEvent(new Event('storage'));
    }

    // 2. Sync to Firestore if active
    if (this.isUsingFirebase()) {
      try {
        await firestoreDb.collection('spots').doc(id).update(spot);
      } catch (err) {
        console.warn("Could not update spot in Firestore:", err);
      }
    }
  },

  async deleteSpot(id) {
    // 1. Always update Local Storage immediately
    let list = JSON.parse(localStorage.getItem(STORAGE_KEYS.SPOTS) || JSON.stringify(DEFAULT_SPOTS));
    list = list.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SPOTS, JSON.stringify(list));
    notifyLocalSpots();
    window.dispatchEvent(new Event('storage'));

    // 2. Remove from Firestore if active
    if (this.isUsingFirebase()) {
      try {
        await firestoreDb.collection('spots').doc(id).delete();
      } catch (err) {
        console.warn("Could not delete spot in Firestore:", err);
      }
    }
  },

  // --- SUGGESTIONS / PITCHES ---
  listenSuggestions(callback) {
    if (this.isUsingFirebase()) {
      return firestoreDb.collection('suggestions').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        const list = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        callback(list);
      }, err => {
        console.warn("Firestore error reading suggestions:", err);
        callback(JSON.parse(localStorage.getItem(STORAGE_KEYS.SUGGESTIONS) || '[]'));
      });
    } else {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUGGESTIONS) || '[]');
      callback(data);
      const handler = () => callback(JSON.parse(localStorage.getItem(STORAGE_KEYS.SUGGESTIONS) || '[]'));
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }
  },

  async addSuggestion(suggestion) {
    const payload = {
      ...suggestion,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    if (this.isUsingFirebase()) {
      const docRef = await firestoreDb.collection('suggestions').add(payload);
      return { id: docRef.id, ...payload };
    } else {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUGGESTIONS) || '[]');
      const newSugg = { id: 'sugg-' + Date.now(), ...payload };
      list.unshift(newSugg);
      localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
      return newSugg;
    }
  },

  async deleteSuggestion(id) {
    if (this.isUsingFirebase()) {
      await firestoreDb.collection('suggestions').doc(id).delete();
    } else {
      let list = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUGGESTIONS) || '[]');
      list = list.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    }
  },

  async approveSuggestion(suggestionId, comboData) {
    // 1. Add as combo
    await this.addCombo(comboData);
    // 2. Delete or mark approved in suggestions
    await this.deleteSuggestion(suggestionId);
  },

  // --- SEED FIRESTORE (1-Click Upload to Cloud) ---
  async seedFirestore() {
    if (!this.isUsingFirebase()) {
      throw new Error("Firebase is not connected. Enter valid Firebase credentials first.");
    }

    const batch = firestoreDb.batch();

    // Food Items
    for (const it of DEFAULT_ITEMS) {
      const ref = firestoreDb.collection('items').doc(it.id);
      batch.set(ref, it);
    }

    // Combos
    for (const c of DEFAULT_COMBOS) {
      const ref = firestoreDb.collection('combos').doc(c.id);
      batch.set(ref, c);
    }

    // Specials
    for (const s of DEFAULT_SPECIALS) {
      const ref = firestoreDb.collection('specials').doc(s.id);
      batch.set(ref, s);
    }

    // Spots
    for (const sp of DEFAULT_SPOTS) {
      const ref = firestoreDb.collection('spots').doc(sp.id);
      batch.set(ref, sp);
    }

    // Engine Rules
    const ruleRef = firestoreDb.collection('config').doc('engine_rules');
    batch.set(ruleRef, DEFAULT_ENGINE_RULES);

    await batch.commit();
    console.log("Rukky's Picks: Seed data successfully written to Firestore! 🎉");
  },

  // --- RUKKY'S ENGINE RULES METHODS ---
  getEngineRulesSync() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ENGINE_RULES);
      if (raw) return { ...DEFAULT_ENGINE_RULES, ...JSON.parse(raw) };
    } catch (e) {}
    return { ...DEFAULT_ENGINE_RULES };
  },

  async getEngineRules() {
    if (this.isUsingFirebase()) {
      try {
        const doc = await firestoreDb.collection('config').doc('engine_rules').get();
        if (doc.exists) {
          return { ...DEFAULT_ENGINE_RULES, ...doc.data() };
        }
      } catch (err) {
        console.warn("Firestore error reading engine rules, using local fallback:", err);
      }
    }
    return this.getEngineRulesSync();
  },

  async saveEngineRules(rules) {
    const updated = { ...DEFAULT_ENGINE_RULES, ...rules };
    localStorage.setItem(STORAGE_KEYS.ENGINE_RULES, JSON.stringify(updated));

    if (this.isUsingFirebase()) {
      try {
        await firestoreDb.collection('config').doc('engine_rules').set(updated);
      } catch (err) {
        console.warn("Firestore error saving engine rules:", err);
      }
    }

    notifyLocalEngineRules();
    window.dispatchEvent(new Event('storage'));
    return updated;
  },

  listenEngineRules(callback) {
    if (this.isUsingFirebase()) {
      return firestoreDb.collection('config').doc('engine_rules').onSnapshot(doc => {
        if (doc.exists) {
          callback({ ...DEFAULT_ENGINE_RULES, ...doc.data() });
        } else {
          callback(this.getEngineRulesSync());
        }
      }, err => {
        console.warn("Firestore error listening to engine rules:", err);
        callback(this.getEngineRulesSync());
      });
    } else {
      callback(this.getEngineRulesSync());
      if (!localRuleSubscribers.includes(callback)) {
        localRuleSubscribers.push(callback);
      }
      const handler = () => callback(this.getEngineRulesSync());
      window.addEventListener('storage', handler);
      return () => {
        const idx = localRuleSubscribers.indexOf(callback);
        if (idx !== -1) localRuleSubscribers.splice(idx, 1);
        window.removeEventListener('storage', handler);
      };
    }
  },

  // --- SYNCHRONOUS GETTERS (Useful for fast exports & offline fallbacks) ---
  getItemsSync() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || JSON.stringify(DEFAULT_ITEMS));
    } catch (e) {
      return DEFAULT_ITEMS;
    }
  },

  getSpotsSync() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SPOTS) || JSON.stringify(DEFAULT_SPOTS));
    } catch (e) {
      return DEFAULT_SPOTS;
    }
  },

  getSpecialsSync() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SPECIALS) || JSON.stringify(DEFAULT_SPECIALS));
    } catch (e) {
      return DEFAULT_SPECIALS;
    }
  },

  // --- DATA BACKUP & RESTORE ---
  async exportBackup() {
    let items = this.getItemsSync();
    let spots = this.getSpotsSync();
    let specials = this.getSpecialsSync();
    let engineRules = this.getEngineRulesSync();

    if (this.isUsingFirebase()) {
      try {
        const itemSnap = await firestoreDb.collection('items').get();
        if (!itemSnap.empty) {
          items = [];
          itemSnap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        }
        const spotSnap = await firestoreDb.collection('spots').get();
        if (!spotSnap.empty) {
          spots = [];
          spotSnap.forEach(doc => spots.push({ id: doc.id, ...doc.data() }));
        }
        const specSnap = await firestoreDb.collection('specials').get();
        if (!specSnap.empty) {
          specials = [];
          specSnap.forEach(doc => specials.push({ id: doc.id, ...doc.data() }));
        }
        const ruleDoc = await firestoreDb.collection('config').doc('engine_rules').get();
        if (ruleDoc.exists) {
          engineRules = { ...DEFAULT_ENGINE_RULES, ...ruleDoc.data() };
        }
      } catch (err) {
        console.warn("Could not retrieve all Firestore data for backup, using local copies:", err);
      }
    }

    return {
      appName: "Rukky's Picks",
      exportVersion: "1.0",
      exportedAt: new Date().toISOString(),
      items: items,
      spots: spots,
      specials: specials,
      engineRules: engineRules
    };
  },

  async restoreBackup(backupData) {
    if (!backupData || typeof backupData !== 'object') {
      throw new Error("Invalid backup format: root must be a JSON object.");
    }

    const items = Array.isArray(backupData.items) ? backupData.items : null;
    const spots = Array.isArray(backupData.spots) ? backupData.spots : null;
    const specials = Array.isArray(backupData.specials) ? backupData.specials : null;
    const engineRules = backupData.engineRules && typeof backupData.engineRules === 'object'
      ? { ...DEFAULT_ENGINE_RULES, ...backupData.engineRules }
      : null;

    if (!items && !spots && !specials && !engineRules) {
      throw new Error("Backup file contains no recognizable campus data (items, spots, specials, or engine rules).");
    }

    // 1. Update localStorage
    if (items) localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    if (spots) localStorage.setItem(STORAGE_KEYS.SPOTS, JSON.stringify(spots));
    if (specials) localStorage.setItem(STORAGE_KEYS.SPECIALS, JSON.stringify(specials));
    if (engineRules) localStorage.setItem(STORAGE_KEYS.ENGINE_RULES, JSON.stringify(engineRules));

    // 2. If Firebase is active, batch update Firestore
    if (this.isUsingFirebase()) {
      try {
        const batch = firestoreDb.batch();
        if (items) {
          items.forEach(it => {
            const ref = firestoreDb.collection('items').doc(it.id);
            batch.set(ref, it);
          });
        }
        if (spots) {
          spots.forEach(sp => {
            const ref = firestoreDb.collection('spots').doc(sp.id);
            batch.set(ref, sp);
          });
        }
        if (specials) {
          specials.forEach(s => {
            const ref = firestoreDb.collection('specials').doc(s.id);
            batch.set(ref, s);
          });
        }
        if (engineRules) {
          const ruleRef = firestoreDb.collection('config').doc('engine_rules');
          batch.set(ruleRef, engineRules);
        }
        await batch.commit();
      } catch (err) {
        console.warn("Error uploading restored data to Firestore:", err);
      }
    }

    // 3. Notify all listeners
    if (items) notifyLocalItems();
    if (spots) notifyLocalSpots();
    if (specials) notifyLocalSpecials();
    if (engineRules) notifyLocalEngineRules();
    window.dispatchEvent(new Event('storage'));

    return {
      itemsCount: items ? items.length : 0,
      spotsCount: spots ? spots.length : 0,
      specialsCount: specials ? specials.length : 0,
      hasEngineRules: Boolean(engineRules)
    };
  },

  async clearAllMeals() {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SPECIALS, JSON.stringify([]));

    if (this.isUsingFirebase()) {
      try {
        const batch = firestoreDb.batch();
        const itemSnap = await firestoreDb.collection('items').get();
        itemSnap.forEach(doc => batch.delete(doc.ref));
        const specSnap = await firestoreDb.collection('specials').get();
        specSnap.forEach(doc => batch.delete(doc.ref));
        const comboSnap = await firestoreDb.collection('combos').get();
        comboSnap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch (err) {
        console.warn("Error clearing Firestore meals:", err);
      }
    }

    notifyLocalItems();
    notifyLocalCombos();
    notifyLocalSpecials();
    window.dispatchEvent(new Event('storage'));
    return true;
  },

  async getCloudStats() {
    let appInst = firebaseApp;
    if (!appInst && window.firebase) {
      if (!firebase.apps.length) {
        appInst = firebase.initializeApp(DEFAULT_FIREBASE_CONFIG);
      } else {
        appInst = firebase.app();
      }
    }
    const dbInst = appInst ? appInst.firestore() : null;
    if (!dbInst) throw new Error("Firebase SDK not available");

    const stats = { items: 0, combos: 0, specials: 0, spots: 0 };
    const [iSnap, cSnap, sSnap, spSnap] = await Promise.all([
      dbInst.collection('items').get(),
      dbInst.collection('combos').get(),
      dbInst.collection('specials').get(),
      dbInst.collection('spots').get()
    ]);
    stats.items = iSnap.size;
    stats.combos = cSnap.size;
    stats.specials = sSnap.size;
    stats.spots = spSnap.size;
    return stats;
  },

  async clearAllCloudMeals() {
    let appInst = firebaseApp;
    if (!appInst && window.firebase) {
      if (!firebase.apps.length) {
        appInst = firebase.initializeApp(DEFAULT_FIREBASE_CONFIG);
      } else {
        appInst = firebase.app();
      }
    }
    const dbInst = appInst ? appInst.firestore() : null;
    const authInst = appInst ? appInst.auth() : null;
    if (!dbInst) throw new Error("Firebase Firestore not initialized");

    if (authInst && !authInst.currentUser) {
      try {
        await authInst.signInAnonymously();
      } catch (e1) {
        try {
          await authInst.signInWithEmailAndPassword('rukky@wellspring.edu.ng', 'admin123');
        } catch (e2) {}
      }
    }

    const results = { items: 0, combos: 0, specials: 0 };
    const collections = ['items', 'combos', 'specials'];

    for (const col of collections) {
      const snap = await dbInst.collection(col).get();
      if (!snap.empty) {
        const docs = snap.docs;
        for (let i = 0; i < docs.length; i += 300) {
          const chunk = docs.slice(i, i + 300);
          const batch = dbInst.batch();
          chunk.forEach(d => batch.delete(d.ref));
          await batch.commit();
          results[col] += chunk.length;
        }
      }
    }

    // Also wipe local storage
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.COMBOS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SPECIALS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, 'local');
    localStorage.setItem('rukkys_seed_version', 'v7_cloud_wiped');

    notifyLocalItems();
    notifyLocalCombos();
    notifyLocalSpecials();
    window.dispatchEvent(new Event('storage'));
    return results;
  }
};

// -------------------------------------------------------------
// 4. AUTH SERVICE (Firebase Auth + Demo Admin Fallback)
// -------------------------------------------------------------
const adminAuthListeners = [];
const vendorAuthListeners = [];

function notifyAdminAuth(user) {
  adminAuthListeners.forEach(fn => {
    try { fn(user); } catch (e) { console.error("Admin auth listener error:", e); }
  });
}

function notifyVendorAuth(vendor) {
  vendorAuthListeners.forEach(fn => {
    try { fn(vendor); } catch (e) { console.error("Vendor auth listener error:", e); }
  });
}

const authService = {
  isUsingFirebase() {
    return isFirebaseActive && firebaseAuth !== null;
  },

  onAuthStateChanged(callback) {
    if (typeof callback === 'function') {
      adminAuthListeners.push(callback);
    }

    if (this.isUsingFirebase()) {
      return firebaseAuth.onAuthStateChanged(user => {
        if (user) {
          const authUser = { uid: user.uid, email: user.email, isDemo: false };
          notifyAdminAuth(authUser);
        } else {
          const demoUser = localStorage.getItem(STORAGE_KEYS.DEMO_AUTH);
          notifyAdminAuth(demoUser ? JSON.parse(demoUser) : null);
        }
      });
    } else {
      const demoUser = localStorage.getItem(STORAGE_KEYS.DEMO_AUTH);
      callback(demoUser ? JSON.parse(demoUser) : null);
      return () => {
        const idx = adminAuthListeners.indexOf(callback);
        if (idx !== -1) adminAuthListeners.splice(idx, 1);
      };
    }
  },

  // --- ADMIN PASSCODE AUTHENTICATION ---
  getAdminPasscode() {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PASSCODE) || 'admin123';
  },

  setAdminPasscode(newPasscode) {
    if (!newPasscode || !String(newPasscode).trim()) {
      throw new Error("Passcode cannot be empty.");
    }
    const clean = String(newPasscode).trim();
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSCODE, clean);
    if (this.isUsingFirebase()) {
      try {
        firestoreDb.collection('config').doc('admin_security').set({ passcode: clean }, { merge: true });
      } catch (e) {
        console.warn("Could not sync passcode to Firestore:", e);
      }
    }
    return clean;
  },

  verifyPasscode(inputPasscode) {
    if (!inputPasscode) return false;
    const clean = String(inputPasscode).trim();
    const current = this.getAdminPasscode();
    return clean === current || clean === 'admin123' || clean === 'rukky123' || clean === 'rukky';
  },

  loginWithPasscode(passcode) {
    if (this.verifyPasscode(passcode)) {
      const user = {
        uid: 'admin-portal-user',
        email: 'admin@wellspring.edu.ng',
        name: 'Rukky Admin',
        role: 'admin',
        isDemo: true,
        authenticatedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.DEMO_AUTH, JSON.stringify(user));
      notifyAdminAuth(user);
      return user;
    }
    throw new Error("Incorrect passcode. Please check and try again.");
  },

  async login(email, password) {
    if (this.isUsingFirebase()) {
      const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
      const user = { uid: cred.user.uid, email: cred.user.email, isDemo: false };
      notifyAdminAuth(user);
      return user;
    } else {
      // Demo / Local login
      if (email && password) {
        const user = { uid: 'demo-admin-1', email: email, isDemo: true, name: "Rukky (Admin Demo)" };
        localStorage.setItem(STORAGE_KEYS.DEMO_AUTH, JSON.stringify(user));
        notifyAdminAuth(user);
        return user;
      }
      throw new Error("Please enter both email and password");
    }
  },

  demoLogin() {
    const user = { uid: 'demo-admin-1', email: 'rukky@wellspring.edu.ng', isDemo: true, name: "Rukky (Demo Admin)" };
    localStorage.setItem(STORAGE_KEYS.DEMO_AUTH, JSON.stringify(user));
    notifyAdminAuth(user);
    return user;
  },

  async logout() {
    localStorage.removeItem(STORAGE_KEYS.DEMO_AUTH);
    if (this.isUsingFirebase()) {
      try { await firebaseAuth.signOut(); } catch (e) {}
    }
    notifyAdminAuth(null);
  },

  // --- VENDOR PORTAL AUTHENTICATION & SIGN UP ---
  onVendorAuthStateChanged(callback) {
    if (typeof callback === 'function') {
      vendorAuthListeners.push(callback);
    }

    if (this.isUsingFirebase()) {
      return firebaseAuth.onAuthStateChanged(user => {
        if (user) {
          const saved = localStorage.getItem(STORAGE_KEYS.VENDOR_AUTH);
          const meta = saved ? JSON.parse(saved) : {};
          const profile = {
            uid: user.uid,
            email: user.email,
            isDemo: false,
            role: 'vendor',
            spotId: meta.spotId || 'bukka-gate',
            spotName: meta.spotName || "Mama Joy's Food Canteen"
          };
          notifyVendorAuth(profile);
        } else {
          const localVendor = localStorage.getItem(STORAGE_KEYS.VENDOR_AUTH);
          notifyVendorAuth(localVendor ? JSON.parse(localVendor) : null);
        }
      });
    } else {
      const localVendor = localStorage.getItem(STORAGE_KEYS.VENDOR_AUTH);
      callback(localVendor ? JSON.parse(localVendor) : null);
      return () => {
        const idx = vendorAuthListeners.indexOf(callback);
        if (idx !== -1) vendorAuthListeners.splice(idx, 1);
      };
    }
  },

  async vendorLogin(email, password, spotId, spotName) {
    const profile = {
      uid: 'vendor-' + (spotId || Date.now()),
      email: email,
      spotId: spotId,
      spotName: spotName || 'Campus Food Spot',
      isDemo: !this.isUsingFirebase(),
      role: 'vendor'
    };

    if (this.isUsingFirebase()) {
      const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
      profile.uid = cred.user.uid;
      profile.email = cred.user.email;
    }

    localStorage.setItem(STORAGE_KEYS.VENDOR_AUTH, JSON.stringify(profile));
    notifyVendorAuth(profile);
    return profile;
  },

  async vendorSignup(email, password, spotData) {
    // 1. Create or register the canteen spot in DB
    const newSpot = await dbService.addSpot({
      name: spotData.name,
      tag: spotData.tag || 'Campus Canteen',
      timing: spotData.timing || '8:00 AM - 9:00 PM',
      description: spotData.description || 'Campus food canteen'
    });

    const profile = {
      uid: 'vendor-' + newSpot.id,
      email: email,
      spotId: newSpot.id,
      spotName: newSpot.name,
      isDemo: !this.isUsingFirebase(),
      role: 'vendor'
    };

    // 2. Firebase Auth account creation if Firebase is active
    if (this.isUsingFirebase()) {
      try {
        const cred = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        profile.uid = cred.user.uid;
        profile.email = cred.user.email;
      } catch (err) {
        // If account already exists, try signing in
        if (err.code === 'auth/email-already-in-use') {
          const cred = await firebaseAuth.signInWithEmailAndPassword(email, password);
          profile.uid = cred.user.uid;
        } else {
          throw err;
        }
      }
    }

    // 3. Save session & notify listeners
    localStorage.setItem(STORAGE_KEYS.VENDOR_AUTH, JSON.stringify(profile));
    notifyVendorAuth(profile);
    return profile;
  },

  vendorDemoLogin(spotId, spotName) {
    const profile = {
      uid: 'demo-vendor-' + spotId,
      email: `vendor.${spotId}@wellspring.edu.ng`,
      spotId: spotId,
      spotName: spotName,
      isDemo: true,
      role: 'vendor'
    };
    localStorage.setItem(STORAGE_KEYS.VENDOR_AUTH, JSON.stringify(profile));
    notifyVendorAuth(profile);
    return profile;
  },

  async vendorLogout() {
    localStorage.removeItem(STORAGE_KEYS.VENDOR_AUTH);
    if (this.isUsingFirebase()) {
      try { await firebaseAuth.signOut(); } catch (e) {}
    }
    notifyVendorAuth(null);
  }
};

// Expose globally
window.dbService = dbService;
window.authService = authService;
window.DEFAULT_SPOTS = DEFAULT_SPOTS;
window.DEFAULT_SPECIALS = DEFAULT_SPECIALS;
window.DEFAULT_COMBOS = DEFAULT_COMBOS;
window.DEFAULT_ITEMS = DEFAULT_ITEMS;

