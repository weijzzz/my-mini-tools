// Ordering and search helpers for supplier / category lists.

// Chinese names sort by pinyin, Spanish names alphabetically (á = a),
// and "Proveedor 2" comes before "Proveedor 10".
const collator = new Intl.Collator(['zh-CN-u-co-pinyin', 'es'], {
  numeric: true,
  sensitivity: 'base',
});

// First Han character of each pinyin initial (A B C D E F G H J K L M N O P
// Q R S T W X Y Z) in pinyin collation order. A character belongs to the
// last boundary it sorts after, which gives its initial without shipping a
// pinyin dictionary.
const PINYIN_BOUNDARIES = '阿八嚓哒妸发旮哈讥咔垃痳拏噢妑七呥扨它穵夕丫帀';
const PINYIN_LETTERS = 'ABCDEFGHJKLMNOPQRSTWXYZ';

/** "Frutas López" → "F", "Ávila" → "A", "张三" → "Z", "7Up" → "#". */
export function initialOf(name) {
  const ch = String(name ?? '').trim().charAt(0);
  if (!ch) return '#';
  const latin = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  if (/[A-Z]/.test(latin)) return latin;
  if (/\p{Script=Han}/u.test(ch)) {
    let letter = '#';
    for (let i = 0; i < PINYIN_BOUNDARIES.length; i++) {
      if (collator.compare(ch, PINYIN_BOUNDARIES[i]) >= 0) letter = PINYIN_LETTERS[i];
      else break;
    }
    return letter;
  }
  return '#';
}

/**
 * Alphabetical with Chinese and Spanish names interleaved by first letter:
 * Ávila, Bebidas, Frutas, 李四 (L), Pérez, 王五 (W), 张三 (Z)…
 */
export function compareNames(a, b) {
  const ia = initialOf(a);
  const ib = initialOf(b);
  if (ia !== ib) {
    if (ia === '#') return 1;
    if (ib === '#') return -1;
    return ia < ib ? -1 : 1;
  }
  return collator.compare(String(a ?? ''), String(b ?? ''));
}

/** Lowercase and strip accents so "lopez" finds "López". */
export function normalizeSearch(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export const SORT_MODES = [
  { key: 'name', label: 'A→Z' },
  { key: 'frequent', label: '常用' },
  { key: 'custom', label: '自定义' },
];

/**
 * Order a list for display.
 * - name: alphabetical (pinyin for Chinese)
 * - frequent: most bills first, ties alphabetical
 * - custom: the order saved by the user (the array order)
 */
export function sortItems(items, mode, counts = new Map()) {
  if (mode === 'name') {
    return [...items].sort((a, b) => compareNames(a.name, b.name));
  }
  if (mode === 'frequent') {
    return [...items].sort(
      (a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0) || compareNames(a.name, b.name),
    );
  }
  return items;
}

/**
 * Split an A→Z sorted list into sections by first letter:
 * [{ letter: 'A', items: [...] }, { letter: 'B', items: [...] }, …]
 */
export function groupByInitial(items) {
  const groups = [];
  for (const item of items) {
    const letter = initialOf(item.name);
    const last = groups[groups.length - 1];
    if (last && last.letter === letter) last.items.push(item);
    else groups.push({ letter, items: [item] });
  }
  return groups;
}

export function filterByQuery(items, query) {
  const q = normalizeSearch(query);
  if (!q) return items;
  return items.filter(
    (item) => normalizeSearch(item.name).includes(q) || normalizeSearch(item.note).includes(q),
  );
}

export function moveItem(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
