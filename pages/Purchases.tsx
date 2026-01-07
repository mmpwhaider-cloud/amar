import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency, generateId, formatDate } from '../constants';
import { ShoppingCart, Plus, Check, History, Trash2, Edit, X } from 'lucide-react';
import { PurchaseInvoice, PurchaseItem } from '../types';

export const Purchases: React.FC = () => {
    const { suppliers, products, savePurchaseInvoice, purchaseInvoices, deletePurchaseInvoice, updateProductPrice } = useStore();
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
    
    // Invoice Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
    const [supplierId, setSupplierId] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<PurchaseItem[]>([]);

    // Item Input State
    const [tempProduct, setTempProduct] = useState('');
    const [tempQty, setTempQty] = useState('');
    const [tempCost, setTempCost] = useState('');
    const [tempSale, setTempSale] = useState(''); // New sale price to update product

    const resetForm = () => {
        setEditingId(null);
        setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
        setDate(new Date().toISOString().slice(0, 16));
        setSupplierId('');
        setNotes('');
        setItems([]);
        resetItemInput();
    };

    const resetItemInput = () => {
        setTempProduct('');
        setTempQty('');
        setTempCost('');
        setTempSale('');
    };

    // Initialize logic
    React.useEffect(() => {
        if (!editingId && activeTab === 'new') {
            setInvoiceNumber(`INV-${Date.now().toString().slice(-6)}`);
        }
    }, [activeTab, editingId]);

    const handleProductSelect = (name: string) => {
        setTempProduct(name);
        const existing = products.find(p => p.name.toLowerCase() === name.toLowerCase().trim());
        if (existing) {
            setTempCost(existing.lastPurchasePrice.toString());
            setTempSale(existing.salePrice.toString());
            if (!supplierId) setSupplierId(existing.supplierId);
        }
    };

    const addItem = () => {
        if (!tempProduct || !tempQty || !tempCost) return;
        
        const existingProduct = products.find(p => p.name.toLowerCase() === tempProduct.toLowerCase().trim());
        const productId = existingProduct ? existingProduct.id : generateId();
        
        // If it's a new product and we have sale price, we might want to update it later or store it
        // The StoreContext logic handles product creation. 
        // We will update sale price immediately if provided
        if (tempSale && existingProduct) {
             updateProductPrice(productId, parseFloat(tempSale));
        }

        const newItem: PurchaseItem = {
            productId,
            productNameSnapshot: tempProduct.trim(),
            quantity: parseInt(tempQty),
            purchasePrice: parseFloat(tempCost),
            total: parseInt(tempQty) * parseFloat(tempCost)
        };

        setItems(prev => [...prev, newItem]);
        resetItemInput();
    };

    const removeItem = (idx: number) => {
        setItems(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSaveInvoice = () => {
        if (!supplierId || items.length === 0) {
            alert("يرجى اختيار مجهز وإضافة مواد");
            return;
        }

        const invoice: PurchaseInvoice = {
            id: editingId || generateId(),
            invoiceNumber,
            date: new Date(date).getTime(),
            supplierId,
            notes,
            items,
            totalAmount: items.reduce((sum, item) => sum + item.total, 0),
            createdAt: editingId ? (purchaseInvoices.find(i => i.id === editingId)?.createdAt || Date.now()) : Date.now(),
            updatedAt: Date.now()
        };

        savePurchaseInvoice(invoice);
        
        // Also update sale prices for new products if passed in temp logic (simplified here)
        // Ideally we iterate items and update sale prices if we had a field for it in PurchaseItem, 
        // but for simplicity we rely on 'updateProductPrice' called during Add Item or globally.
        
        resetForm();
        setActiveTab('history');
        alert("تم حفظ القائمة بنجاح");
    };

    const handleEdit = (inv: PurchaseInvoice) => {
        setEditingId(inv.id);
        setInvoiceNumber(inv.invoiceNumber);
        // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
        const d = new Date(inv.date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setDate(d.toISOString().slice(0, 16));
        
        setSupplierId(inv.supplierId);
        setNotes(inv.notes || '');
        setItems(inv.items);
        setActiveTab('new');
    };

    return (
        <div className="space-y-4">
            <div className="flex bg-white rounded-xl shadow-sm border border-slate-100 p-1 mb-4">
                <button 
                    onClick={() => setActiveTab('new')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-primary-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    قائمة جديدة
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-primary-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    سجل الفواتير
                </button>
            </div>

            {activeTab === 'new' ? (
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">{editingId ? 'تعديل فاتورة شراء' : 'فاتورة شراء جديدة'}</h3>
                        {editingId && <button onClick={resetForm} className="text-xs text-red-500">إلغاء التعديل</button>}
                    </div>

                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">رقم القائمة</label>
                            <input 
                                type="text" 
                                value={invoiceNumber} 
                                onChange={e => setInvoiceNumber(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-slate-50 text-sm"
                                disabled
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">التاريخ والوقت</label>
                            <input 
                                type="datetime-local" 
                                value={date} 
                                onChange={e => setDate(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">المجهز</label>
                            <select 
                                value={supplierId} 
                                onChange={e => setSupplierId(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-white text-sm"
                            >
                                <option value="">-- اختر مجهز --</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">ملاحظات</label>
                            <input 
                                type="text" 
                                value={notes} 
                                onChange={e => setNotes(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-white text-sm"
                                placeholder="اختياري"
                            />
                        </div>
                    </div>

                    {/* Add Item Form */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-4">
                        <h4 className="text-xs font-bold text-slate-500 mb-2">إضافة مادة</h4>
                        <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-5">
                                <input 
                                    list="products-list"
                                    placeholder="اسم المادة" 
                                    value={tempProduct}
                                    onChange={e => handleProductSelect(e.target.value)}
                                    className="w-full p-2 text-sm border rounded"
                                />
                                <datalist id="products-list">
                                    {products.map(p => <option key={p.id} value={p.name} />)}
                                </datalist>
                            </div>
                            <div className="col-span-2">
                                <input 
                                    type="number" 
                                    placeholder="عدد" 
                                    value={tempQty}
                                    onChange={e => setTempQty(e.target.value)}
                                    className="w-full p-2 text-sm border rounded"
                                />
                            </div>
                            <div className="col-span-3">
                                <input 
                                    type="number" 
                                    placeholder="سعر الشراء" 
                                    value={tempCost}
                                    onChange={e => setTempCost(e.target.value)}
                                    className="w-full p-2 text-sm border rounded"
                                />
                            </div>
                            <div className="col-span-2">
                                <button 
                                    onClick={addItem}
                                    className="w-full bg-primary-600 text-white h-full rounded text-sm font-bold"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        {tempProduct && (
                            <div className="mt-2">
                                <input 
                                    type="number" 
                                    placeholder="تحديث سعر البيع (اختياري)" 
                                    value={tempSale}
                                    onChange={e => setTempSale(e.target.value)}
                                    className="w-full p-2 text-sm border rounded border-dashed border-primary-300"
                                />
                            </div>
                        )}
                    </div>

                    {/* Items List */}
                    <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-slate-100 text-slate-600 font-medium">
                                <tr>
                                    <th className="p-2">المادة</th>
                                    <th className="p-2">العدد</th>
                                    <th className="p-2">السعر</th>
                                    <th className="p-2">الإجمالي</th>
                                    <th className="p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-2">{item.productNameSnapshot}</td>
                                        <td className="p-2">{item.quantity}</td>
                                        <td className="p-2">{formatCurrency(item.purchasePrice)}</td>
                                        <td className="p-2 font-bold">{formatCurrency(item.total)}</td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => removeItem(idx)} className="text-red-400">
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-slate-400">لا توجد مواد مضافة</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold text-slate-800">
                                <tr>
                                    <td colSpan={3} className="p-2 text-left">المجموع الكلي</td>
                                    <td colSpan={2} className="p-2 text-primary-700 text-lg">
                                        {formatCurrency(items.reduce((sum, i) => sum + i.total, 0))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <button 
                        onClick={handleSaveInvoice}
                        className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 shadow-lg shadow-primary-500/20"
                    >
                        {editingId ? 'حفظ التعديلات' : 'إتمام الفاتورة'}
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {purchaseInvoices.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">لا توجد فواتير سابقة</div>
                    ) : (
                        purchaseInvoices.sort((a,b) => b.date - a.date).map(inv => (
                            <div key={inv.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start border-b border-slate-50 pb-2 mb-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-primary-700">{inv.invoiceNumber}</span>
                                            <span className="text-xs text-slate-400">{formatDate(inv.date)}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-600">
                                            {suppliers.find(s => s.id === inv.supplierId)?.name || 'مجهز محذوف'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(inv)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit size={18}/></button>
                                        <button 
                                            onClick={() => {
                                                if(window.confirm('حذف الفاتورة سيؤثر على المخزون وحساب المجهز. هل أنت متأكد؟')) {
                                                    deletePurchaseInvoice(inv.id);
                                                }
                                            }} 
                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">{inv.items.length} مواد</span>
                                    <span className="font-bold text-slate-800">{formatCurrency(inv.totalAmount)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
