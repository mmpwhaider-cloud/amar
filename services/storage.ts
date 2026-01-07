import { Supplier, Product, PurchaseInvoice, SaleInvoice, Payment } from '../types';

export interface AppData {
    suppliers: Supplier[];
    products: Product[];
    purchaseInvoices: PurchaseInvoice[];
    saleInvoices: SaleInvoice[];
    payments: Payment[];
}

export const loadData = (): AppData => {
    return {
        suppliers: [],
        products: [],
        purchaseInvoices: [],
        saleInvoices: [],
        payments: []
    };
};

export const saveData = (data: AppData): void => {
    // No-op: Local storage is disabled.
};