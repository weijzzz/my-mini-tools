const PREFIX = 'finmgr_';

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
    // Storage full or blocked: say so once instead of silently losing data.
    console.error('[storage] write failed', key, err);
    if (!quotaWarned) {
      quotaWarned = true;
      alert('保存失败：手机浏览器存储空间不足或被禁用。请先导出备份再清理。');
    }
    return false;
  }
}

export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// ── Main Categories (Tabs) ──
const DEFAULT_MAIN_CATEGORIES = [
  { id: 'cat_food', name: '餐饮', type: 'expense', icon: 'Utensils' },
  { id: 'cat_trans', name: '交通', type: 'expense', icon: 'Car' },
  { id: 'cat_shop', name: '购物', type: 'expense', icon: 'ShoppingBag' },
  { id: 'cat_income', name: '收入', type: 'income', icon: 'Wallet' },
];

export function getMainCategories() {
  const cats = readKey('main_categories');
  if (cats && cats.length > 0) return cats;
  writeKey('main_categories', DEFAULT_MAIN_CATEGORIES);
  return DEFAULT_MAIN_CATEGORIES;
}

export function saveMainCategories(cats) {
  writeKey('main_categories', cats);
}

// ── Sub Categories (Grid Cards) ──
export function getSubCategories() {
  return readKey('sub_categories') || [];
}

export function saveSubCategories(subs) {
  writeKey('sub_categories', subs);
}

// ── Transactions (Bills) ──
export function getTransactions() {
  return readKey('transactions') || [];
}

export function saveTransactions(transactions) {
  writeKey('transactions', transactions);
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
  // Check the file before wiping anything: a backup from another app would
  // otherwise delete every record and restore nothing.
  const hasOwnKeys = Object.keys(data || {}).some((key) => key.startsWith(PREFIX));
  if (!hasOwnKeys) {
    throw new Error('这不是「个人记账本」的备份文件');
  }

  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  Object.entries(data).forEach(([key, value]) => {
    if (key.startsWith(PREFIX)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  });
}

