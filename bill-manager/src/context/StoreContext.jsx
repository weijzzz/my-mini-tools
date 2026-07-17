import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import {
  getStores,
  saveStores,
  getSuppliers,
  saveSuppliers,
  getBills,
  saveBills,
  getCategories,
  saveCategories,
  generateId,
} from '../utils/storage';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [stores, setStores] = useState(() => getStores());
  const [currentStoreId, setCurrentStoreId] = useState(() => getStores()[0]?.id);
  const [suppliers, setSuppliers] = useState([]);
  const [bills, setBills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState('entry'); // 'entry' | 'dashboard'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // When currentStoreId changes, reload suppliers, bills, categories from storage
  useEffect(() => {
    if (!currentStoreId) return;
    setSuppliers(getSuppliers(currentStoreId));
    setBills(getBills(currentStoreId));
    setCategories(getCategories(currentStoreId));
  }, [currentStoreId]);

  // Derived: filteredBills by selectedMonth
  const filteredBills = useMemo(
    () => bills.filter((b) => b.date?.startsWith(selectedMonth)),
    [bills, selectedMonth]
  );

  // ── Store CRUD ──────────────────────────────────────────────

  const addStore = useCallback(
    (name) => {
      const newStore = {
        id: generateId(),
        name,
        createdAt: new Date().toISOString(),
      };
      const updated = [...stores, newStore];
      setStores(updated);
      saveStores(updated);
      return newStore;
    },
    [stores]
  );

  const updateStore = useCallback(
    (id, updates) => {
      const newName = typeof updates === 'string' ? updates : updates.name;
      const updated = stores.map((s) => (s.id === id ? { ...s, name: newName } : s));
      setStores(updated);
      saveStores(updated);
    },
    [stores]
  );

  const deleteStore = useCallback(
    (id) => {
      const updated = stores.filter((s) => s.id !== id);
      if (updated.length === 0) return; // Prevent deleting the last store

      // Remove this store's data from localStorage
      const prefix = 'billmgr_';
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${prefix}${id}_`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      setStores(updated);
      saveStores(updated);

      // Switch to the first remaining store if we deleted the current one
      if (currentStoreId === id) {
        setCurrentStoreId(updated[0].id);
      }
    },
    [stores, currentStoreId]
  );

  const switchStore = useCallback((id) => {
    setCurrentStoreId(id);
  }, []);

  // ── Supplier CRUD ───────────────────────────────────────────

  const addSupplier = useCallback(
    (name) => {
      const newSupplier = {
        id: generateId(),
        name,
        createdAt: new Date().toISOString(),
      };
      const updated = [...suppliers, newSupplier];
      setSuppliers(updated);
      saveSuppliers(currentStoreId, updated);
      return newSupplier;
    },
    [suppliers, currentStoreId]
  );

  const updateSupplier = useCallback(
    (id, updates) => {
      let updatedName = null;
      const updatedSuppliers = suppliers.map((s) => {
        if (s.id === id) {
          if (updates.name && updates.name !== s.name) {
            updatedName = updates.name;
          }
          return { ...s, ...updates };
        }
        return s;
      });
      setSuppliers(updatedSuppliers);
      saveSuppliers(currentStoreId, updatedSuppliers);

      // If name was updated, sync it to all historical bills
      if (updatedName) {
        const updatedBills = bills.map((b) =>
          b.supplierId === id ? { ...b, supplierName: updatedName } : b
        );
        setBills(updatedBills);
        saveBills(currentStoreId, updatedBills);
      }
    },
    [suppliers, bills, currentStoreId]
  );

  const deleteSupplier = useCallback(
    (id) => {
      const updated = suppliers.filter((s) => s.id !== id);
      setSuppliers(updated);
      saveSuppliers(currentStoreId, updated);
    },
    [suppliers, currentStoreId]
  );

  // ── Bill CRUD ───────────────────────────────────────────────

  const addBill = useCallback(
    (bill) => {
      const newBill = {
        id: generateId(),
        supplierId: bill.supplierId,
        supplierName: bill.supplierName,
        amount: parseFloat(bill.amount) || 0,
        category: bill.category,
        date: bill.date,
        note: bill.note || '',
        createdAt: new Date().toISOString(),
      };
      const updated = [newBill, ...bills]; // Prepend
      setBills(updated);
      saveBills(currentStoreId, updated);
      return newBill;
    },
    [bills, currentStoreId]
  );

  const updateBill = useCallback(
    (id, updates) => {
      const updated = bills.map((b) => {
        if (b.id !== id) return b;
        const merged = { ...b, ...updates };
        if (updates.amount !== undefined) {
          merged.amount = parseFloat(updates.amount) || 0;
        }
        return merged;
      });
      setBills(updated);
      saveBills(currentStoreId, updated);
    },
    [bills, currentStoreId]
  );

  const deleteBill = useCallback(
    (id) => {
      const updated = bills.filter((b) => b.id !== id);
      setBills(updated);
      saveBills(currentStoreId, updated);
    },
    [bills, currentStoreId]
  );

  // ── Category CRUD ───────────────────────────────────────────

  const updateCategories = useCallback(
    (newCats) => {
      setCategories(newCats);
      saveCategories(currentStoreId, newCats);
    },
    [currentStoreId]
  );

  // ── Context Value ───────────────────────────────────────────

  const currentStore = stores.find((s) => s.id === currentStoreId);

  const value = useMemo(
    () => ({
      stores,
      currentStore,
      currentStoreId,
      suppliers,
      bills: filteredBills,
      allBills: bills,
      categories,
      selectedMonth,
      currentPage,
      setCurrentPage,
      setSelectedMonth,
      addStore,
      updateStore,
      deleteStore,
      switchStore,
      addSupplier,
      deleteSupplier,
      updateSupplier,
      addBill,
      updateBill,
      deleteBill,
      updateCategories,
    }),
    [
      stores,
      currentStore,
      currentStoreId,
      suppliers,
      filteredBills,
      bills,
      categories,
      selectedMonth,
      currentPage,
      addStore,
      updateStore,
      deleteStore,
      switchStore,
      addSupplier,
      deleteSupplier,
      updateSupplier,
      addBill,
      updateBill,
      deleteBill,
      updateCategories,
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
