import { APP_KEY } from '../constants';
import { Supplier, Product, PurchaseInvoice, SaleInvoice, Payment } from '../types';

export interface AppData {
    suppliers: Supplier[];
    products: Product[];
    purchaseInvoices: PurchaseInvoice[];
    saleInvoices: SaleInvoice[];
    payments: Payment[];
}

const INITIAL_DATA: AppData = {
    suppliers: [],
    products: [],
    purchaseInvoices: [],
    saleInvoices: [],
    payments: []
};

export const loadData = (): AppData => {
    try {
        const stored = localStorage.getItem(APP_KEY);
        if (!stored) return INITIAL_DATA;
        
        const parsed = JSON.parse(stored);
        
        // Migration check: if old data exists (purchases/sales arrays instead of invoices), reset or migrate.
        // For simplicity in this context, we assume clean structure or manual reset if needed.
        if (parsed.purchases && !parsed.purchaseInvoices) {
            return { ...INITIAL_DATA, suppliers: parsed.suppliers, products: parsed.products, payments: parsed.payments };
        }
        
        return parsed;
    } catch (e) {
        console.error("Failed to load data", e);
        return INITIAL_DATA;
    }
};

export const saveData = (data: AppData): void => {
    try {
        localStorage.setItem(APP_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save data", e);
    }
};
