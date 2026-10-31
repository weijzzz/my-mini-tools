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

let quotaWarned = false;

function writeKey(key, value) {
  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    return true;
  } catch (err) {
    // Storage full or blocked (e.g. private mode). Tell the user once instead
    // of failing silently and losing what they just typed.
    console.error('[storage] write failed', key, err);
    if (!quotaWarned) {
      quotaWarned = true;
      alert('保存失败：手机浏览器存储空间不足或被禁用。请先「备份数据」再清理。');
    }
    return false;
  }
}

export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// Remember which store was open so reopening the app lands on it again.
export function getLastStoreId() {
  return readKey('current_store');
}

export function saveLastStoreId(storeId) {
  writeKey('current_store', storeId);
}

export function removeStoreData(storeId) {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`${PREFIX}${storeId}_`)) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
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
    if (key && key.startsWith(PREFIX)) {
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
  // Refuse a file from another app before wiping anything: clearing first and
  // then finding nothing to restore would silently delete every bill.
  const hasOwnKeys = Object.keys(data || {}).some((key) => key.startsWith(PREFIX));
  if (!hasOwnKeys) {
    throw new Error('这不是「账单管家」的备份文件');
  }

  // Clear all existing billmgr_ keys
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
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
