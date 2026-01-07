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
    const [tempSale, setTempSale] = useState('');

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
        resetForm();
        setActiveTab('history');
    };

    const handleEdit = (inv: PurchaseInvoice) => {
        setEditingId(inv.id);
        setInvoiceNumber(inv.invoiceNumber);
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
            <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1 mb-4">
                <button 
                    onClick={() => setActiveTab('new')}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    قائمة جديدة
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    سجل الفواتير
                </button>
            </div>

            {activeTab === 'new' ? (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-5">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <h3 className="font-bold text-slate-900">{editingId ? 'تعديل فاتورة شراء' : 'فاتورة شراء جديدة'}</h3>
                        {editingId && <button onClick={resetForm} className="text-xs text-danger font-bold hover:underline">إلغاء التعديل</button>}
                    </div>

                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">رقم القائمة</label>
                            <input 
                                type="text" 
                                value={invoiceNumber} 
                                className="w-full p-2.5 border rounded-lg bg-slate-50 text-slate-500 font-mono text-sm"
                                disabled
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">التاريخ والوقت</label>
                            <input 
                                type="datetime-local" 
                                value={date} 
                                onChange={e => setDate(e.target.value)}
                                className="w-full p-2.5 border rounded-lg text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">المجهز</label>
                            <select 
                                value={supplierId} 
                                onChange={e => setSupplierId(e.target.value)}
                                className="w-full p-2.5 border rounded-lg text-sm"
                            >
                                <option value="">-- اختر مجهز --</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">ملاحظات</label>
                            <input 
                                type="text" 
                                value={notes} 
                                onChange={e => setNotes(e.target.value)}
                                className="w-full p-2.5 border rounded-lg text-sm"
                                placeholder="اختياري"
                            />
                        </div>
                    </div>

                    {/* Add Item Form */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4">
                        <h4 className="text-xs font-bold text-slate-600 mb-3">إضافة مادة للقائمة</h4>
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-5">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">المادة</label>
                                <input 
                                    list="products-list"
                                    placeholder="بحث/جديد" 
                                    value={tempProduct}
                                    onChange={e => handleProductSelect(e.target.value)}
                                    className="w-full p-2 text-sm border rounded bg-white"
                                />
                                <datalist id="products-list">
                                    {products.map(p => <option key={p.id} value={p.name} />)}
                                </datalist>
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">العدد</label>
                                <input 
                                    type="number" 
                                    placeholder="0" 
                                    value={tempQty}
                                    onChange={e => setTempQty(e.target.value)}
                                    className="w-full p-2 text-sm border rounded bg-white text-center"
                                />
                            </div>
                            <div className="col-span-3">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">سعر الشراء</label>
                                <input 
                                    type="number" 
                                    placeholder="0" 
                                    value={tempCost}
                                    onChange={e => setTempCost(e.target.value)}
                                    className="w-full p-2 text-sm border rounded bg-white"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">&nbsp;</label>
                                <button 
                                    onClick={addItem}
                                    className="w-full bg-primary hover:bg-primary-hover text-white h-[38px] rounded text-sm font-bold flex items-center justify-center"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                        {tempProduct && (
                            <div className="mt-3">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1">تحديث سعر البيع (اختياري)</label>
                                <input 
                                    type="number" 
                                    placeholder="اتركه فارغاً للإبقاء على السعر القديم" 
                                    value={tempSale}
                                    onChange={e => setTempSale(e.target.value)}
                                    className="w-full p-2 text-sm border rounded border-dashed border-slate-300 bg-white"
                                />
                            </div>
                        )}
                    </div>

                    {/* Items List */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                <tr>
                                    <th className="p-3">المادة</th>
                                    <th className="p-3">العدد</th>
                                    <th className="p-3">السعر</th>
                                    <th className="p-3">الإجمالي</th>
                                    <th className="p-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-3 text-slate-800 font-medium">{item.productNameSnapshot}</td>
                                        <td className="p-3 text-slate-600">{item.quantity}</td>
                                        <td className="p-3 text-slate-600">{formatCurrency(item.purchasePrice)}</td>
                                        <td className="p-3 font-bold text-slate-900">{formatCurrency(item.total)}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-danger">
                                                <X size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-slate-400 italic">أضف مواد للقائمة أعلاه</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                                <tr>
                                    <td colSpan={3} className="p-3 text-left">المجموع الكلي</td>
                                    <td colSpan={2} className="p-3 text-primary text-lg">
                                        {formatCurrency(items.reduce((sum, i) => sum + i.total, 0))}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <button 
                        onClick={handleSaveInvoice}
                        className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 rounded-lg font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <Check size={20} />
                        <span>{editingId ? 'حفظ التعديلات' : 'إتمام الفاتورة'}</span>
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {purchaseInvoices.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-medium">لا توجد فواتير سابقة</div>
                    ) : (
                        purchaseInvoices.sort((a,b) => b.date - a.date).map(inv => (
                            <div key={inv.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                                <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-primary font-mono">{inv.invoiceNumber}</span>
                                            <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-50 rounded border border-slate-100">{formatDate(inv.date)}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-700">
                                            {suppliers.find(s => s.id === inv.supplierId)?.name || 'مجهز محذوف'}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(inv)} className="p-1.5 text-primary border border-primary-light bg-primary-light rounded hover:bg-primary hover:text-white transition-colors"><Edit size={16}/></button>
                                        <button 
                                            onClick={() => {
                                                if(window.confirm('حذف الفاتورة سيؤثر على المخزون وحساب المجهز. هل أنت متأكد؟')) {
                                                    deletePurchaseInvoice(inv.id);
                                                }
                                            }} 
                                            className="p-1.5 text-danger border border-danger-light bg-danger-light rounded hover:bg-danger hover:text-white transition-colors"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">{inv.items.length} مواد</span>
                                    <span className="font-bold text-slate-900 text-lg">{formatCurrency(inv.totalAmount)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};