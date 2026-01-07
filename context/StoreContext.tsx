import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
    Supplier, Product, PurchaseInvoice, SaleInvoice, Payment, 
    SupplierStats
} from '../types';
import { AppData } from '../services/storage'; 
import { api } from '../services/api';
import { generateId } from '../constants';

interface StoreContextType extends AppData {
    isLoading: boolean;
    error: string | null;
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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<AppData>({
        suppliers: [],
        products: [],
        purchaseInvoices: [],
        saleInvoices: [],
        payments: []
    });

    const handleError = (e: any) => {
        console.error("App Error:", e);
        const msg = e.message || 'An unknown error occurred';
        setError(msg);
    };

    const loadFromApi = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedData = await api.fetchAll();
            setData(fetchedData as unknown as AppData);
        } catch (e: any) {
            handleError(e);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        loadFromApi();
    }, []);

    const refreshData = async () => {
        loadFromApi();
    };

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
        api.addSupplier(newSupplier).catch(e => {
            handleError(e);
            refreshData(); // Revert/Refresh on error
        });
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
        api.deleteSupplier(id).catch(e => {
            handleError(e);
            refreshData();
        });
    };

    // --- Helpers for Optimistic Updates ---
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
                    supplierId: invoice.supplierId
                };
            }
        });
        return updatedProducts;
    };

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
            const isEdit = nextInvoices.some(inv => inv.id === invoice.id);

            // 1. Handle New Products (Must exist in DB before Invoice Items reference them)
            const newProductsToCreate: Product[] = [];
            invoice.items.forEach(item => {
                const exists = nextProducts.find(p => p.id === item.productId);
                if (!exists) {
                    const newProd: Product = {
                        id: item.productId,
                        name: item.productNameSnapshot,
                        supplierId: invoice.supplierId,
                        lastPurchasePrice: item.purchasePrice,
                        salePrice: 0,
                        quantityInStock: 0, // Will be incremented by effect
                        quantitySold: 0
                    };
                    nextProducts.push(newProd);
                    newProductsToCreate.push(newProd);
                    // Add to API explicitly
                    api.addProduct(newProd).catch(e => console.error("API Error (Background)", e));
                }
            });

            // 2. Edit Logic
            if (isEdit) {
                 const oldInvoice = nextInvoices.find(inv => inv.id === invoice.id);
                 if (oldInvoice) {
                     nextProducts = revertPurchaseEffects(nextProducts, oldInvoice);
                     api.deletePurchaseInvoice(invoice.id, oldInvoice.items).then(() => {
                         api.addPurchaseInvoice(invoice);
                     }).catch(e => {
                        handleError(e);
                        refreshData();
                     });
                 }
                 nextInvoices = nextInvoices.map(inv => inv.id === invoice.id ? invoice : inv);
            } else {
                nextInvoices = [invoice, ...nextInvoices];
                // New Invoice
                api.addPurchaseInvoice(invoice).catch(e => {
                    handleError(e);
                    refreshData();
                });
            }

            // 3. Apply Stock Effects
            nextProducts = applyPurchaseEffects(nextProducts, invoice);

            // 4. Update Inventory Stats
            const involvedIds = invoice.items.map(i => i.productId);
            const productsToUpdate = nextProducts.filter(p => involvedIds.includes(p.id));
            api.updateProducts(productsToUpdate).catch(e => console.error("API Error (Background)", e));

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

            const nextProducts = revertPurchaseEffects([...prev.products], invoice);
            
            const involvedIds = invoice.items.map(i => i.productId);
            const productsToUpdate = nextProducts.filter(p => involvedIds.includes(p.id));

            api.deletePurchaseInvoice(id, invoice.items).catch(e => {
                handleError(e);
                refreshData();
            });
            api.updateProducts(productsToUpdate).catch(e => console.error("API Error (Background)", e));

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
            const isEdit = nextInvoices.some(inv => inv.id === invoice.id);

            if (isEdit) {
                const oldInvoice = nextInvoices.find(inv => inv.id === invoice.id);
                if (oldInvoice) {
                    nextProducts = revertSaleEffects(nextProducts, oldInvoice);
                    api.deleteSaleInvoice(invoice.id).then(() => {
                        api.addSaleInvoice(invoice);
                    }).catch(e => {
                        handleError(e);
                        refreshData();
                    });
                }
                nextInvoices = nextInvoices.map(inv => inv.id === invoice.id ? invoice : inv);
            } else {
                nextInvoices = [invoice, ...nextInvoices];
                api.addSaleInvoice(invoice).catch(e => {
                    handleError(e);
                    refreshData();
                });
            }

            nextProducts = applySaleEffects(nextProducts, invoice);

            const involvedIds = invoice.items.map(i => i.productId);
            const productsToUpdate = nextProducts.filter(p => involvedIds.includes(p.id));

            api.updateProducts(productsToUpdate).catch(e => console.error("API Error (Background)", e));

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

            const involvedIds = invoice.items.map(i => i.productId);
            const productsToUpdate = nextProducts.filter(p => involvedIds.includes(p.id));

            api.deleteSaleInvoice(id).catch(e => {
                handleError(e);
                refreshData();
            });
            api.updateProducts(productsToUpdate).catch(e => console.error("API Error (Background)", e));
            
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
                api.editPayment(payment).catch(e => { 
                    handleError(e); 
                    refreshData(); 
                });
            } else {
                nextPayments = [payment, ...nextPayments];
                api.addPayment(payment).catch(e => { 
                    handleError(e); 
                    refreshData(); 
                });
            }
            return { ...prev, payments: nextPayments };
        });
    };

    const deletePayment = (id: string) => {
        setData(prev => {
            api.deletePayment(id).catch(e => { 
                handleError(e); 
                refreshData(); 
            });
            return {
                ...prev,
                payments: prev.payments.filter(p => p.id !== id)
            };
        });
    };

    const updateProductPrice = (productId: string, newPrice: number) => {
        setData(prev => {
            const updatedProducts = prev.products.map(p => {
                if (p.id === productId) {
                    const updated = { ...p, salePrice: newPrice };
                    api.updateProducts([updated]).catch(e => console.error("API Error (Background)", e));
                    return updated;
                }
                return p;
            });
            return { ...prev, products: updatedProducts };
        });
    };

    // --- Calculations ---
    const getSupplierStats = useCallback((supplierId: string): SupplierStats => {
        const supplierInvoices = data.purchaseInvoices.filter(p => p.supplierId === supplierId);
        const totalPurchased = supplierInvoices.reduce((sum, p) => sum + p.totalAmount, 0);
        
        const supplierPayments = data.payments.filter(p => p.supplierId === supplierId);
        const totalPaid = supplierPayments.reduce((sum, p) => sum + p.amount, 0);

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
            isLoading,
            error,
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