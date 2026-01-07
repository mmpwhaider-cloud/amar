import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
    Supplier, Product, PurchaseInvoice, SaleInvoice, Payment, 
    SupplierStats, PurchaseItem, SaleItem
} from '../types';
import { loadData, saveData, AppData } from '../services/storage';
import { generateId } from '../constants';

interface StoreContextType extends AppData {
    // Actions
    addSupplier: (name: string, phone?: string, notes?: string) => void;
    deleteSupplier: (id: string) => Promise<void>;
    
    // Invoice Actions
    savePurchaseInvoice: (invoice: PurchaseInvoice) => void;
    deletePurchaseInvoice: (id: string) => void;
    
    saveSaleInvoice: (invoice: SaleInvoice) => void;
    deleteSaleInvoice: (id: string) => void;
    
    // Payment Actions
    savePayment: (payment: Payment) => void;
    deletePayment: (id: string) => void;

    updateProductPrice: (productId: string, newPrice: number) => void;
    
    // Getters
    getSupplierStats: (supplierId: string) => SupplierStats;
    refreshData: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error("useStore must be used within StoreProvider");
    return context;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [data, setData] = useState<AppData>(loadData);

    useEffect(() => {
        saveData(data);
    }, [data]);

    useEffect(() => {
        const handleStorageChange = () => setData(loadData());
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const refreshData = () => setData(loadData());

    // --- Suppliers ---
    const addSupplier = (name: string, phone?: string, notes?: string) => {
        const newSupplier: Supplier = {
            id: generateId(),
            name: name.trim(),
            phone,
            notes,
            createdAt: Date.now()
        };
        setData(prev => ({ ...prev, suppliers: [newSupplier, ...prev.suppliers] }));
    };

    const deleteSupplier = async (id: string) => {
        const hasProducts = data.products.some(p => p.supplierId === id);
        const hasPurchases = data.purchaseInvoices.some(p => p.supplierId === id);
        
        if (hasProducts || hasPurchases) {
            alert("لا يمكن حذف المجهز لوجود مواد أو فواتير مرتبطة به.");
            return;
        }

        setData(prev => ({
            ...prev,
            suppliers: prev.suppliers.filter(s => s.id !== id)
        }));
    };

    // --- Core Logic Helpers ---
    
    // Helper: Apply Purchase Effects (Increase Stock)
    const applyPurchaseEffects = (products: Product[], invoice: PurchaseInvoice): Product[] => {
        let updatedProducts = [...products];
        
        invoice.items.forEach(item => {
            const existingIndex = updatedProducts.findIndex(p => p.id === item.productId);
            
            if (existingIndex > -1) {
                const p = updatedProducts[existingIndex];
                updatedProducts[existingIndex] = {
                    ...p,
                    quantityInStock: p.quantityInStock + item.quantity,
                    lastPurchasePrice: item.purchasePrice,
                    supplierId: invoice.supplierId // Update supplier link
                };
            } else {
                // Should have been created before, but safety check
                updatedProducts.push({
                    id: item.productId,
                    name: item.productNameSnapshot,
                    supplierId: invoice.supplierId,
                    lastPurchasePrice: item.purchasePrice,
                    salePrice: 0, // Will be set if not provided
                    quantityInStock: item.quantity,
                    quantitySold: 0
                });
            }
        });
        return updatedProducts;
    };

    // Helper: Revert Purchase Effects (Decrease Stock)
    const revertPurchaseEffects = (products: Product[], invoice: PurchaseInvoice): Product[] => {
        let updatedProducts = [...products];
        invoice.items.forEach(item => {
            const idx = updatedProducts.findIndex(p => p.id === item.productId);
            if (idx > -1) {
                updatedProducts[idx] = {
                    ...updatedProducts[idx],
                    quantityInStock: updatedProducts[idx].quantityInStock - item.quantity
                };
            }
        });
        return updatedProducts;
    };

    // Helper: Apply Sale Effects (Decrease Stock, Increase Sold)
    const applySaleEffects = (products: Product[], invoice: SaleInvoice): Product[] => {
        let updatedProducts = [...products];
        invoice.items.forEach(item => {
            const idx = updatedProducts.findIndex(p => p.id === item.productId);
            if (idx > -1) {
                updatedProducts[idx] = {
                    ...updatedProducts[idx],
                    quantityInStock: updatedProducts[idx].quantityInStock - item.quantity,
                    quantitySold: updatedProducts[idx].quantitySold + item.quantity
                };
            }
        });
        return updatedProducts;
    };

    // Helper: Revert Sale Effects (Increase Stock, Decrease Sold)
    const revertSaleEffects = (products: Product[], invoice: SaleInvoice): Product[] => {
        let updatedProducts = [...products];
        invoice.items.forEach(item => {
            const idx = updatedProducts.findIndex(p => p.id === item.productId);
            if (idx > -1) {
                updatedProducts[idx] = {
                    ...updatedProducts[idx],
                    quantityInStock: updatedProducts[idx].quantityInStock + item.quantity,
                    quantitySold: updatedProducts[idx].quantitySold - item.quantity
                };
            }
        });
        return updatedProducts;
    };

    // --- Purchase Invoices ---
    const savePurchaseInvoice = (invoice: PurchaseInvoice) => {
        setData(prev => {
            let nextProducts = [...prev.products];
            let nextInvoices = [...prev.purchaseInvoices];
            
            // 1. Ensure all products exist
            invoice.items.forEach(item => {
                if (!nextProducts.find(p => p.id === item.productId)) {
                    // Create new product if strictly not found (though UI handles ID generation)
                    nextProducts.push({
                        id: item.productId,
                        name: item.productNameSnapshot,
                        supplierId: invoice.supplierId,
                        lastPurchasePrice: item.purchasePrice,
                        salePrice: 0,
                        quantityInStock: 0,
                        quantitySold: 0
                    });
                }
            });

            // 2. Check if Edit or New
            const existingIndex = nextInvoices.findIndex(inv => inv.id === invoice.id);
            if (existingIndex > -1) {
                // Revert old effects
                const oldInvoice = nextInvoices[existingIndex];
                nextProducts = revertPurchaseEffects(nextProducts, oldInvoice);
                // Update list
                nextInvoices[existingIndex] = invoice;
            } else {
                // New
                nextInvoices = [invoice, ...nextInvoices];
            }

            // 3. Apply new effects
            nextProducts = applyPurchaseEffects(nextProducts, invoice);

            return {
                ...prev,
                products: nextProducts,
                purchaseInvoices: nextInvoices
            };
        });
    };

    const deletePurchaseInvoice = (id: string) => {
        setData(prev => {
            const invoice = prev.purchaseInvoices.find(inv => inv.id === id);
            if (!invoice) return prev;

            // Revert effects
            const nextProducts = revertPurchaseEffects([...prev.products], invoice);
            
            return {
                ...prev,
                products: nextProducts,
                purchaseInvoices: prev.purchaseInvoices.filter(inv => inv.id !== id)
            };
        });
    };

    // --- Sale Invoices ---
    const saveSaleInvoice = (invoice: SaleInvoice) => {
        setData(prev => {
            let nextProducts = [...prev.products];
            let nextInvoices = [...prev.saleInvoices];

            // 1. Check stock availability (Only for NEW items or delta)
            // Ideally, the UI handles validation, but here is a safety net.
            // For editing, it's complex because we must consider the "revert" first. 
            // We assume the caller validated logic or we allow negative stock if forcing edit.
            
            // 2. Check if Edit
            const existingIndex = nextInvoices.findIndex(inv => inv.id === invoice.id);
            if (existingIndex > -1) {
                const oldInvoice = nextInvoices[existingIndex];
                nextProducts = revertSaleEffects(nextProducts, oldInvoice);
                nextInvoices[existingIndex] = invoice;
            } else {
                nextInvoices = [invoice, ...nextInvoices];
            }

            // 3. Apply New Effects
            nextProducts = applySaleEffects(nextProducts, invoice);

            return {
                ...prev,
                products: nextProducts,
                saleInvoices: nextInvoices
            };
        });
    };

    const deleteSaleInvoice = (id: string) => {
        setData(prev => {
            const invoice = prev.saleInvoices.find(inv => inv.id === id);
            if (!invoice) return prev;

            const nextProducts = revertSaleEffects([...prev.products], invoice);
            
            return {
                ...prev,
                products: nextProducts,
                saleInvoices: prev.saleInvoices.filter(inv => inv.id !== id)
            };
        });
    };

    // --- Payments ---
    const savePayment = (payment: Payment) => {
        setData(prev => {
            const idx = prev.payments.findIndex(p => p.id === payment.id);
            let nextPayments = [...prev.payments];
            if (idx > -1) {
                nextPayments[idx] = payment;
            } else {
                nextPayments = [payment, ...nextPayments];
            }
            return { ...prev, payments: nextPayments };
        });
    };

    const deletePayment = (id: string) => {
        setData(prev => ({
            ...prev,
            payments: prev.payments.filter(p => p.id !== id)
        }));
    };

    const updateProductPrice = (productId: string, newPrice: number) => {
        setData(prev => ({
            ...prev,
            products: prev.products.map(p => p.id === productId ? { ...p, salePrice: newPrice } : p)
        }));
    };

    // --- Calculations ---
    const getSupplierStats = useCallback((supplierId: string): SupplierStats => {
        const supplierInvoices = data.purchaseInvoices.filter(p => p.supplierId === supplierId);
        const totalPurchased = supplierInvoices.reduce((sum, p) => sum + p.totalAmount, 0);
        
        const supplierPayments = data.payments.filter(p => p.supplierId === supplierId);
        const totalPaid = supplierPayments.reduce((sum, p) => sum + p.amount, 0);

        // Calculate sold value: iterate all sales, check product ownership
        let totalSoldValue = 0;
        data.saleInvoices.forEach(inv => {
            inv.items.forEach(item => {
                const product = data.products.find(p => p.id === item.productId);
                if (product && product.supplierId === supplierId) {
                    totalSoldValue += item.total;
                }
            });
        });

        return {
            totalPurchased,
            totalPaid,
            remainingBalance: totalPurchased - totalPaid,
            totalSoldValue
        };
    }, [data]);

    return (
        <StoreContext.Provider value={{
            ...data,
            addSupplier,
            deleteSupplier,
            savePurchaseInvoice,
            deletePurchaseInvoice,
            saveSaleInvoice,
            deleteSaleInvoice,
            savePayment,
            deletePayment,
            updateProductPrice,
            getSupplierStats,
            refreshData
        }}>
            {children}
        </StoreContext.Provider>
    );
};
