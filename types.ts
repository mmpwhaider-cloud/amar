// Enums
export enum TransactionType {
    PURCHASE = 'PURCHASE',
    SALE = 'SALE',
    PAYMENT = 'PAYMENT'
}

// Entities
export interface Supplier {
    id: string;
    name: string;
    phone?: string;
    notes?: string;
    createdAt: number;
}

export interface Product {
    id: string;
    name: string;
    supplierId: string;
    lastPurchasePrice: number;
    salePrice: number;
    quantityInStock: number;
    quantitySold: number;
}

// Purchase Invoice System
export interface PurchaseItem {
    productId: string;
    productNameSnapshot: string;
    quantity: number;
    purchasePrice: number;
    total: number;
}

export interface PurchaseInvoice {
    id: string;
    invoiceNumber: string;
    date: number; // Full timestamp
    supplierId: string;
    notes?: string;
    items: PurchaseItem[];
    totalAmount: number;
    createdAt: number;
    updatedAt?: number;
}

// Sales Invoice System
export interface SaleItem {
    productId: string;
    productNameSnapshot: string;
    quantity: number;
    salePrice: number;
    total: number;
}

export interface SaleInvoice {
    id: string;
    invoiceNumber: string;
    date: number; // Full timestamp
    customerName: string; // Default: زبون نقدي
    notes?: string;
    items: SaleItem[];
    totalAmount: number;
    createdAt: number;
    updatedAt?: number;
}

export interface Payment {
    id: string;
    date: number;
    supplierId: string;
    amount: number;
    notes?: string;
}

// Reports & Computed Types
export interface SupplierStats {
    totalPurchased: number;
    totalSoldValue: number;
    totalPaid: number;
    remainingBalance: number;
}
