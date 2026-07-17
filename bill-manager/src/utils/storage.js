// Key scheme:
// billmgr_stores -> [{id, name, createdAt}]
// billmgr_{storeId}_suppliers -> [{id, name, createdAt}]
// billmgr_{storeId}_bills -> [{id, supplierId, supplierName, amount, category, date, note, createdAt}]
// billmgr_{storeId}_categories -> [string]

const PREFIX = 'billmgr_';

const DEFAULT_CATEGORIES = ['进货/货品', '水电杂费', '包装耗材', '物流运费', '固定资产', '其他'];

function readKey(key) {
  try {
    const raw = localStorage.getItem(`${PREFIX}${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeKey(key, value) {
  localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
}

export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getStores() {
  const stores = readKey('stores');
  if (stores && stores.length > 0) return stores;

  const defaultStore = [
    { id: 'store_1', name: '总店', createdAt: new Date().toISOString() },
  ];
  writeKey('stores', defaultStore);
  return defaultStore;
}

export function saveStores(stores) {
  writeKey('stores', stores);
}

export function getSuppliers(storeId) {
  return readKey(`${storeId}_suppliers`) || [];
}

export function saveSuppliers(storeId, suppliers) {
  writeKey(`${storeId}_suppliers`, suppliers);
}

export function getBills(storeId) {
  return readKey(`${storeId}_bills`) || [];
}

export function saveBills(storeId, bills) {
  writeKey(`${storeId}_bills`, bills);
}

export function getCategories(storeId) {
  const cats = readKey(`${storeId}_categories`);
  if (cats && cats.length > 0) return cats;
  return [...DEFAULT_CATEGORIES];
}

export function saveCategories(storeId, categories) {
  writeKey(`${storeId}_categories`, categories);
}

export function getAllStorageData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(PREFIX)) {
      try {
        data[key] = JSON.parse(localStorage.getItem(key));
      } catch {
        data[key] = localStorage.getItem(key);
      }
    }
  }
  return data;
}

export function restoreAllStorageData(data) {
  // Clear all existing billmgr_ keys
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  // Restore from backup object
  Object.entries(data).forEach(([key, value]) => {
    if (key.startsWith(PREFIX)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });
}
