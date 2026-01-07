import { initializeApp } from "firebase/app";
import { 
    getFirestore, collection, getDocs, doc, setDoc, deleteDoc, 
    updateDoc, writeBatch 
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { Supplier, Product, PurchaseInvoice, SaleInvoice, Payment } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyA8ACGLEP_oUsjJehpUR-M2OY2k_VD8ZP4",
  authDomain: "amar-3995d.firebaseapp.com",
  projectId: "amar-3995d",
  storageBucket: "amar-3995d.firebasestorage.app",
  messagingSenderId: "248377903450",
  appId: "1:248377903450:web:ac50f94e194d5264f40b63",
  measurementId: "G-JTZ1H0HQRS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Helper to remove undefined values because Firestore rejects them
const sanitize = (obj: any) => JSON.parse(JSON.stringify(obj));

export const api = {
    // --- FETCH ALL ---
    fetchAll: async () => {
        try {
            const [supSnap, prodSnap, purSnap, saleSnap, paySnap] = await Promise.all([
                getDocs(collection(db, 'suppliers')),
                getDocs(collection(db, 'products')),
                getDocs(collection(db, 'purchaseInvoices')),
                getDocs(collection(db, 'saleInvoices')),
                getDocs(collection(db, 'payments'))
            ]);

            const suppliers = supSnap.docs.map(d => d.data() as Supplier);
            const products = prodSnap.docs.map(d => d.data() as Product);
            const purchaseInvoices = purSnap.docs.map(d => d.data() as PurchaseInvoice);
            const saleInvoices = saleSnap.docs.map(d => d.data() as SaleInvoice);
            const payments = paySnap.docs.map(d => d.data() as Payment);

            return { suppliers, products, purchaseInvoices, saleInvoices, payments };
        } catch (error: any) {
            console.error("Firebase Fetch Error", error);
            throw new Error("فشل الاتصال بقاعدة البيانات. يرجى التحقق من اتصال الإنترنت.");
        }
    },

    // --- SUPPLIERS ---
    addSupplier: async (s: Supplier) => {
        await setDoc(doc(db, 'suppliers', s.id), sanitize(s));
    },
    deleteSupplier: async (id: string) => {
        await deleteDoc(doc(db, 'suppliers', id));
    },

    // --- PRODUCTS ---
    addProduct: async (p: Product) => {
        await setDoc(doc(db, 'products', p.id), sanitize(p));
    },
    updateProducts: async (products: Product[]) => {
        const batch = writeBatch(db);
        products.forEach(p => {
            const ref = doc(db, 'products', p.id);
            batch.update(ref, sanitize(p));
        });
        await batch.commit();
    },

    // --- PURCHASE INVOICES ---
    // Note: Items are now embedded in the invoice document for consistency
    addPurchaseInvoice: async (inv: PurchaseInvoice) => {
        await setDoc(doc(db, 'purchaseInvoices', inv.id), sanitize(inv));
    },
    deletePurchaseInvoice: async (id: string, items?: any[]) => {
        // We ignore 'items' here because we delete the whole document which contains the items
        await deleteDoc(doc(db, 'purchaseInvoices', id));
    },

    // --- SALE INVOICES ---
    addSaleInvoice: async (inv: SaleInvoice) => {
        await setDoc(doc(db, 'saleInvoices', inv.id), sanitize(inv));
    },
    deleteSaleInvoice: async (id: string) => {
        await deleteDoc(doc(db, 'saleInvoices', id));
    },

    // --- PAYMENTS ---
    addPayment: async (p: Payment) => {
        await setDoc(doc(db, 'payments', p.id), sanitize(p));
    },
    editPayment: async (p: Payment) => {
        await updateDoc(doc(db, 'payments', p.id), sanitize(p));
    },
    deletePayment: async (id: string) => {
        await deleteDoc(doc(db, 'payments', id));
    },
};