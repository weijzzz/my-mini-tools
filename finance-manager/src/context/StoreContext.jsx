import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import {
  getMainCategories,
  saveMainCategories,
  getSubCategories,
  saveSubCategories,
  getTransactions,
  saveTransactions,
  generateId,
} from '../utils/storage';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [mainCategories, setMainCategories] = useState(() => getMainCategories());
  const [subCategories, setSubCategories] = useState(() => getSubCategories());
  const [transactions, setTransactions] = useState(() => getTransactions());
  
  // Controls the active tab (Main Category) in the entry view
  const [currentMainCategoryId, setCurrentMainCategoryId] = useState(() => mainCategories[0]?.id);
  
  const [currentPage, setCurrentPage] = useState('entry'); // 'entry' | 'dashboard'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

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

  // ── Sub Category CRUD ───────────────────────────────────────────

  const addSubCategory = useCallback(
    (mainId, name) => {
      const newSub = {
        id: generateId(),
        mainId,
        name,
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
