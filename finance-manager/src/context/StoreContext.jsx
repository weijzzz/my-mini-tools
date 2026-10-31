import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  getMainCategories,
  saveMainCategories,
  getSubCategories,
  saveSubCategories,
  getTransactions,
  saveTransactions,
  readPref,
  writePref,
  generateId,
} from '../utils/storage';
import { currentMonthString } from '../utils/date';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [mainCategories, setMainCategories] = useState(() => getMainCategories());
  const [subCategories, setSubCategories] = useState(() => getSubCategories());
  const [transactions, setTransactions] = useState(() => getTransactions());
  
  // Controls the active tab (Main Category) in the entry view
  const [currentMainCategoryId, setCurrentMainCategoryId] = useState(() => mainCategories[0]?.id);
  
  const [currentPage, setCurrentPage] = useState('entry'); // 'entry' | 'dashboard'
  const [selectedMonth, setSelectedMonth] = useState(() => currentMonthString());
  // Order of the 项目 cards: 'name' (A→Z), 'frequent' or 'custom'.
  const [subSort, setSubSortState] = useState(() => readPref('sub_sort', 'custom'));

  const setSubSort = useCallback((mode) => {
    setSubSortState(mode);
    writePref('sub_sort', mode);
  }, []);

  // Derived: filteredTransactions by selectedMonth
  const filteredTransactions = useMemo(
    () => transactions.filter((t) => t.date?.startsWith(selectedMonth)),
    [transactions, selectedMonth]
  );

  // ── Main Category CRUD (Optional if we want to let users add main tabs) ──
  const addMainCategory = useCallback(
    (name, type, icon = 'Tag') => {
      const newCat = { id: generateId(), name, type, icon };
      const updated = [...mainCategories, newCat];
      setMainCategories(updated);
      saveMainCategories(updated);
      return newCat;
    },
    [mainCategories]
  );

  /** Save the tab order chosen by the user (array order = display order). */
  const reorderMainCategories = useCallback(
    (orderedIds) => {
      const byId = new Map(mainCategories.map((c) => [c.id, c]));
      const next = orderedIds.map((id) => byId.get(id)).filter(Boolean);
      mainCategories.forEach((c) => {
        if (!orderedIds.includes(c.id)) next.push(c);
      });
      setMainCategories(next);
      saveMainCategories(next);
    },
    [mainCategories]
  );

  const renameMainCategory = useCallback(
    (id, name) => {
      const next = mainCategories.map((c) => (c.id === id ? { ...c, name } : c));
      setMainCategories(next);
      saveMainCategories(next);
      // Keep history readable under the new name.
      const updatedTrans = transactions.map((t) => (t.mainId === id ? { ...t, mainName: name } : t));
      setTransactions(updatedTrans);
      saveTransactions(updatedTrans);
    },
    [mainCategories, transactions]
  );

  /** Remove a tab and its 项目. Past transactions are kept (they store names). */
  const deleteMainCategory = useCallback(
    (id) => {
      if (mainCategories.length <= 1) return false;
      const next = mainCategories.filter((c) => c.id !== id);
      setMainCategories(next);
      saveMainCategories(next);
      const subs = subCategories.filter((s) => s.mainId !== id);
      setSubCategories(subs);
      saveSubCategories(subs);
      if (currentMainCategoryId === id) setCurrentMainCategoryId(next[0].id);
      return true;
    },
    [mainCategories, subCategories, currentMainCategoryId]
  );

  // ── Sub Category CRUD ───────────────────────────────────────────

  /** Reorder the 项目 of one tab; other tabs keep their order. */
  const reorderSubCategories = useCallback(
    (mainId, orderedIds) => {
      const mine = subCategories.filter((s) => s.mainId === mainId);
      const byId = new Map(mine.map((s) => [s.id, s]));
      const ordered = orderedIds.map((id) => byId.get(id)).filter(Boolean);
      mine.forEach((s) => {
        if (!orderedIds.includes(s.id)) ordered.push(s);
      });
      const next = [...subCategories.filter((s) => s.mainId !== mainId), ...ordered];
      setSubCategories(next);
      saveSubCategories(next);
    },
    [subCategories]
  );

  const addSubCategory = useCallback(
    (mainId, name, note = '') => {
      const newSub = {
        id: generateId(),
        mainId,
        name,
        note,
        createdAt: new Date().toISOString(),
      };
      const updated = [...subCategories, newSub];
      setSubCategories(updated);
      saveSubCategories(updated);
      return newSub;
    },
    [subCategories]
  );

  const updateSubCategory = useCallback(
    (id, updates) => {
      let updatedName = null;
      const updatedSubs = subCategories.map((s) => {
        if (s.id === id) {
          if (updates.name && updates.name !== s.name) {
            updatedName = updates.name;
          }
          return { ...s, ...updates };
        }
        return s;
      });
      setSubCategories(updatedSubs);
      saveSubCategories(updatedSubs);

      // Sync name to historical transactions
      if (updatedName) {
        const updatedTrans = transactions.map((t) =>
          t.subId === id ? { ...t, subName: updatedName } : t
        );
        setTransactions(updatedTrans);
        saveTransactions(updatedTrans);
      }
    },
    [subCategories, transactions]
  );

  const deleteSubCategory = useCallback(
    (id) => {
      const updated = subCategories.filter((s) => s.id !== id);
      setSubCategories(updated);
      saveSubCategories(updated);
    },
    [subCategories]
  );

  // ── Transaction CRUD ───────────────────────────────────────────────

  const addTransaction = useCallback(
    (txn) => {
      // txn expects { mainId, subId, amount, date, note }
      const mainCat = mainCategories.find(m => m.id === txn.mainId);
      const subCat = subCategories.find(s => s.id === txn.subId);
      
      const newTxn = {
        id: generateId(),
        mainId: txn.mainId,
        mainName: mainCat?.name || '未知',
        subId: txn.subId,
        subName: subCat?.name || '未知',
        type: mainCat?.type || 'expense', // 'expense' or 'income'
        amount: parseFloat(txn.amount) || 0,
        date: txn.date,
        note: txn.note || '',
        createdAt: new Date().toISOString(),
      };
      
      const updated = [newTxn, ...transactions];
      setTransactions(updated);
      saveTransactions(updated);
      return newTxn;
    },
    [transactions, mainCategories, subCategories]
  );

  const updateTransaction = useCallback(
    (id, updates) => {
      const updated = transactions.map((t) => {
        if (t.id !== id) return t;
        const merged = { ...t, ...updates };
        if (updates.amount !== undefined) {
          merged.amount = parseFloat(updates.amount) || 0;
        }
        return merged;
      });
      setTransactions(updated);
      saveTransactions(updated);
    },
    [transactions]
  );

  const deleteTransaction = useCallback(
    (id) => {
      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);
      saveTransactions(updated);
    },
    [transactions]
  );

  // ── Context Value ───────────────────────────────────────────

  const value = useMemo(
    () => ({
      mainCategories,
      subCategories,
      transactions: filteredTransactions,
      allTransactions: transactions,
      
      currentMainCategoryId,
      setCurrentMainCategoryId,
      
      selectedMonth,
      setSelectedMonth,
      
      currentPage,
      setCurrentPage,
      
      addMainCategory,
      reorderMainCategories,
      renameMainCategory,
      deleteMainCategory,

      subSort,
      setSubSort,
      reorderSubCategories,
      
      addSubCategory,
      updateSubCategory,
      deleteSubCategory,
      
      addTransaction,
      updateTransaction,
      deleteTransaction,
    }),
    [
      mainCategories,
      subCategories,
      filteredTransactions,
      transactions,
      currentMainCategoryId,
      selectedMonth,
      currentPage,
      addMainCategory,
      reorderMainCategories,
      renameMainCategory,
      deleteMainCategory,
      subSort,
      setSubSort,
      reorderSubCategories,
      addSubCategory,
      updateSubCategory,
      deleteSubCategory,
      addTransaction,
      updateTransaction,
      deleteTransaction,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
}
