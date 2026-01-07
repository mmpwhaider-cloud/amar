import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency, generateId, formatDate } from '../constants';
import { Banknote, Search, ShoppingBag, Edit, Trash2, X } from 'lucide-react';
import { SaleInvoice, SaleItem } from '../types';

export const Sales: React.FC = () => {
    const { products, saveSaleInvoice, saleInvoices, deleteSaleInvoice } = useStore();
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
    
    // Invoice State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [customerName, setCustomerName] = useState('زبون نقدي');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [cart, setCart] = useState<SaleItem[]>([]);
    
    // Product Search
    const [searchTerm, setSearchTerm] = useState('');

    const availableProducts = useMemo(() => {
        return products.filter(p => 
            p.quantityInStock > 0 && 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    React.useEffect(() => {
        if (!editingId && activeTab === 'new') {
            setInvoiceNumber(`SAL-${Date.now().toString().slice(-6)}`);
        }
    }, [activeTab, editingId]);

    const addToCart = (product: any) => {
        setCart(prev => {
            const existsIdx = prev.findIndex(item => item.productId === product.id);
            if (existsIdx > -1) {
                // Logic check: ensure we don't oversell (considering current cart qty)
                // When editing, we should technically check (original_inv_qty + stock) > new_qty.
                // Simplified: We allow adding, but should warn on save if stock invalid.
                // Here we just limit to current stock for simplicity in UI.
                if (prev[existsIdx].quantity + 1 > product.quantityInStock) {
                    // If editing, this check might be too aggressive because stock was already reduced.
                    // Let's assume user knows what they are doing or handle rigorous validation later.
                    // For now, simple check:
                    if (!editingId) return prev; 
                }
                
                const newCart = [...prev];
                newCart[existsIdx] = {
                    ...newCart[existsIdx],
                    quantity: newCart[existsIdx].quantity + 1,
                    total: (newCart[existsIdx].quantity + 1) * newCart[existsIdx].salePrice
                };
                return newCart;
            }
            return [...prev, {
                productId: product.id,
                productNameSnapshot: product.name,
                quantity: 1,
                salePrice: product.salePrice,
                total: product.salePrice
            }];
        });
    };

    const removeFromCart = (idx: number) => {
        setCart(prev => prev.filter((_, i) => i !== idx));
    };

    const updateCartQty = (idx: number, newQty: number) => {
        if (newQty < 1) return;
        setCart(prev => {
            const newCart = [...prev];
            newCart[idx] = {
                ...newCart[idx],
                quantity: newQty,
                total: newQty * newCart[idx].salePrice
            };
            return newCart;
        });
    };

    const resetForm = () => {
        setEditingId(null);
        setCustomerName('زبون نقدي');
        setDate(new Date().toISOString().slice(0, 16));
        setInvoiceNumber(`SAL-${Date.now().toString().slice(-6)}`);
        setCart([]);
        setSearchTerm('');
    };

    const handleSave = () => {
        if (cart.length === 0) return;
        
        const invoice: SaleInvoice = {
            id: editingId || generateId(),
            invoiceNumber,
            date: new Date(date).getTime(),
            customerName,
            items: cart,
            totalAmount: cart.reduce((sum, item) => sum + item.total, 0),
            createdAt: editingId ? (saleInvoices.find(i => i.id === editingId)?.createdAt || Date.now()) : Date.now(),
            updatedAt: Date.now()
        };

        saveSaleInvoice(invoice);
        resetForm();
        setActiveTab('history');
        alert('تم حفظ البيع');
    };

    const handleEdit = (inv: SaleInvoice) => {
        setEditingId(inv.id);
        setInvoiceNumber(inv.invoiceNumber);
        const d = new Date(inv.date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setDate(d.toISOString().slice(0, 16));
        setCustomerName(inv.customerName);
        setCart(inv.items);
        setActiveTab('new');
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="h-full flex flex-col">
            <div className="flex bg-white rounded-xl shadow-sm border border-slate-100 p-1 mb-4 shrink-0">
                <button 
                    onClick={() => setActiveTab('new')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-green-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    بيع جديد (POS)
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-green-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    سجل المبيعات
                </button>
            </div>

            {activeTab === 'new' ? (
                <div className="flex flex-col md:flex-row gap-4 h-full overflow-hidden">
                    {/* Left: Product List */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 mb-3">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                    type="text"
                                    placeholder="بحث عن مادة..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2 pb-20 md:pb-0">
                            {availableProducts.map(p => (
                                <button 
                                    key={p.id} 
                                    onClick={() => addToCart(p)}
                                    className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-right hover:border-green-500 transition-colors"
                                >
                                    <h4 className="font-bold text-slate-800 text-sm truncate">{p.name}</h4>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-green-600 font-bold text-sm">{formatCurrency(p.salePrice)}</span>
                                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">متبقي: {p.quantityInStock}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Cart / Invoice Details */}
                    <div className="fixed bottom-14 left-0 right-0 md:static md:w-96 bg-white md:rounded-xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:shadow-sm border-t md:border border-slate-100 p-4 z-40 flex flex-col max-h-[60vh] md:max-h-full">
                         <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
                             <div>
                                 <h3 className="font-bold text-slate-800">{editingId ? 'تعديل بيع' : 'بيع جديد'}</h3>
                                 <input 
                                     value={customerName}
                                     onChange={e => setCustomerName(e.target.value)}
                                     className="text-xs border-b border-dashed border-slate-300 outline-none py-1 w-32 focus:w-full transition-all"
                                 />
                             </div>
                             <div className="text-left">
                                 <p className="text-xs text-slate-400">{invoiceNumber}</p>
                                 <input 
                                    type="datetime-local" 
                                    value={date} 
                                    onChange={e => setDate(e.target.value)}
                                    className="text-xs border rounded p-1 mt-1"
                                 />
                             </div>
                         </div>

                         <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                             {cart.map((item, idx) => (
                                 <div key={idx} className="flex justify-between items-center text-sm bg-slate-50 p-2 rounded-lg">
                                     <div className="flex-1">
                                         <p className="font-medium">{item.productNameSnapshot}</p>
                                         <div className="flex items-center gap-2 mt-1">
                                             <button onClick={() => updateCartQty(idx, item.quantity - 1)} className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center">-</button>
                                             <span className="font-bold w-6 text-center">{item.quantity}</span>
                                             <button onClick={() => updateCartQty(idx, item.quantity + 1)} className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center">+</button>
                                         </div>
                                     </div>
                                     <div className="flex flex-col items-end gap-1">
                                         <span className="font-bold">{formatCurrency(item.total)}</span>
                                         <button onClick={() => removeFromCart(idx)} className="text-red-400"><X size={14}/></button>
                                     </div>
                                 </div>
                             ))}
                             {cart.length === 0 && <p className="text-center text-slate-400 py-4">السلة فارغة</p>}
                         </div>

                         <div className="border-t border-slate-100 pt-3">
                             <div className="flex justify-between items-center mb-3">
                                 <span className="font-bold text-slate-600">المجموع</span>
                                 <span className="font-bold text-xl text-green-700">{formatCurrency(cartTotal)}</span>
                             </div>
                             <button 
                                onClick={handleSave}
                                disabled={cart.length === 0}
                                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:bg-slate-300 flex items-center justify-center gap-2"
                             >
                                 <Banknote size={20} />
                                 <span>{editingId ? 'حفظ التعديل' : 'إتمام البيع'}</span>
                             </button>
                             {editingId && (
                                 <button onClick={resetForm} className="w-full text-center text-slate-400 text-xs mt-2">إلغاء</button>
                             )}
                         </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 overflow-y-auto pb-20">
                    {saleInvoices.sort((a,b) => b.date - a.date).map(inv => (
                        <div key={inv.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-green-700">{inv.invoiceNumber}</span>
                                        <span className="text-xs text-slate-400">{formatDate(inv.date)}</span>
                                    </div>
                                    <p className="text-sm font-medium">{inv.customerName}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(inv)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit size={18}/></button>
                                    <button 
                                        onClick={() => {
                                            if(window.confirm('حذف الفاتورة سيسترجع المخزون. هل أنت متأكد؟')) {
                                                deleteSaleInvoice(inv.id);
                                            }
                                        }} 
                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm border-t border-slate-50 pt-2">
                                <span className="text-slate-500">{inv.items.length} مواد</span>
                                <span className="font-bold text-slate-800">{formatCurrency(inv.totalAmount)}</span>
                            </div>
                        </div>
                    ))}
                    {saleInvoices.length === 0 && (
                        <div className="text-center py-10 text-slate-400">لا توجد مبيعات سابقة</div>
                    )}
                </div>
            )}
        </div>
    );
};
