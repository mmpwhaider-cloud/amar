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
                // Warning logic disabled to allow free flow, relies on visual checks
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
            const item = newCart[idx];
            newCart[idx] = {
                ...item,
                quantity: newQty,
                total: newQty * item.salePrice
            };
            return newCart;
        });
    };

    const updateCartPrice = (idx: number, rawValue: string) => {
        // Strip non-digits to handle commas
        const cleanValue = rawValue.replace(/,/g, '').replace(/[^\d]/g, '');
        const newPrice = cleanValue ? parseFloat(cleanValue) : 0;
        
        setCart(prev => {
            const newCart = [...prev];
            const item = newCart[idx];
            newCart[idx] = {
                ...item,
                salePrice: newPrice,
                total: item.quantity * newPrice
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
            <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1 mb-4 shrink-0">
                <button 
                    onClick={() => setActiveTab('new')}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'new' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    بيع جديد (POS)
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    سجل المبيعات
                </button>
            </div>

            {activeTab === 'new' ? (
                <div className="flex flex-col md:flex-row gap-4 h-full overflow-hidden">
                    {/* Left: Product List */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 mb-3">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input 
                                    type="text"
                                    placeholder="بحث عن مادة..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-slate-300 bg-white outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-900"
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-3 pb-20 md:pb-0">
                            {availableProducts.map(p => (
                                <button 
                                    key={p.id} 
                                    onClick={() => addToCart(p)}
                                    className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm text-right hover:border-primary hover:shadow-md transition-all group"
                                >
                                    <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-primary">{p.name}</h4>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-primary font-bold text-base">{formatCurrency(p.salePrice)}</span>
                                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold border border-slate-200">متبقي: {p.quantityInStock}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Cart / Invoice Details */}
                    <div className="fixed bottom-14 left-0 right-0 md:static md:w-96 bg-white md:rounded-lg shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:shadow-sm border-t md:border border-slate-200 p-4 z-40 flex flex-col max-h-[60vh] md:max-h-full">
                         <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                             <div>
                                 <h3 className="font-bold text-slate-900 mb-1">{editingId ? 'تعديل بيع' : 'بيع جديد'}</h3>
                                 <input 
                                     value={customerName}
                                     onChange={e => setCustomerName(e.target.value)}
                                     className="text-xs border-b border-dashed border-slate-300 outline-none py-1 w-32 focus:w-full focus:border-primary transition-all text-slate-700"
                                 />
                             </div>
                             <div className="text-left">
                                 <p className="text-xs text-slate-400 font-mono mb-1">{invoiceNumber}</p>
                                 <input 
                                    type="datetime-local" 
                                    value={date} 
                                    onChange={e => setDate(e.target.value)}
                                    className="text-[10px] border rounded p-1 text-slate-500"
                                 />
                             </div>
                         </div>

                         <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
                             {cart.map((item, idx) => (
                                 <div key={idx} className="flex flex-col bg-slate-50 p-3 rounded-lg border border-slate-100 gap-2">
                                     <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-1">
                                         <p className="font-bold text-slate-800 text-sm">{item.productNameSnapshot}</p>
                                         <button onClick={() => removeFromCart(idx)} className="text-slate-400 hover:text-danger p-1"><X size={16}/></button>
                                     </div>
                                     
                                     <div className="flex items-end justify-between gap-3">
                                         {/* Qty Control */}
                                         <div className="flex flex-col gap-1 items-center">
                                             <span className="text-[10px] text-slate-400 font-bold">العدد</span>
                                             <div className="flex items-center gap-1">
                                                <button onClick={() => updateCartQty(idx, item.quantity - 1)} className="w-8 h-8 bg-white border border-slate-300 rounded flex items-center justify-center hover:border-slate-500 text-slate-700 font-bold text-lg active:bg-slate-100">-</button>
                                                <span className="font-bold w-6 text-center text-slate-900 text-lg">{item.quantity}</span>
                                                <button onClick={() => updateCartQty(idx, item.quantity + 1)} className="w-8 h-8 bg-white border border-slate-300 rounded flex items-center justify-center hover:border-slate-500 text-slate-700 font-bold text-lg active:bg-slate-100">+</button>
                                             </div>
                                         </div>

                                         {/* Price Control */}
                                         <div className="flex-1">
                                             <span className="text-[10px] text-slate-400 font-bold block mb-1">سعر البيع (دينار)</span>
                                             <input 
                                                type="text"
                                                inputMode="numeric"
                                                value={item.salePrice.toLocaleString()}
                                                onChange={e => updateCartPrice(idx, e.target.value)}
                                                className="w-full p-2 text-lg font-bold border border-slate-300 rounded text-center focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none shadow-sm text-slate-900 placeholder-slate-300"
                                                placeholder="0"
                                             />
                                         </div>

                                         {/* Total */}
                                         <div className="flex flex-col items-end min-w-[80px]">
                                             <span className="text-[10px] text-slate-400 font-bold mb-1">الإجمالي</span>
                                             <span className="font-bold text-primary text-lg" dir="ltr">{item.total.toLocaleString()}</span>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                             {cart.length === 0 && <p className="text-center text-slate-400 py-8 italic text-sm">أضف مواد للسلة</p>}
                         </div>

                         <div className="border-t border-slate-100 pt-3 bg-slate-50 -mx-4 -mb-4 p-4 rounded-b-lg">
                             <div className="flex justify-between items-center mb-4">
                                 <span className="font-bold text-slate-600">المجموع النهائي</span>
                                 <span className="font-bold text-3xl text-primary font-mono tracking-tight">{formatCurrency(cartTotal)}</span>
                             </div>
                             <button 
                                onClick={handleSave}
                                disabled={cart.length === 0}
                                className="w-full bg-primary text-white py-4 rounded-lg font-bold hover:bg-primary-hover disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-lg shadow-md"
                             >
                                 <Banknote size={24} />
                                 <span>{editingId ? 'حفظ التعديل' : 'إتمام البيع'}</span>
                             </button>
                             {editingId && (
                                 <button onClick={resetForm} className="w-full text-center text-slate-500 text-xs mt-3 hover:text-slate-800">إلغاء العملية</button>
                             )}
                         </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 overflow-y-auto pb-20">
                    {saleInvoices.sort((a,b) => b.date - a.date).map(inv => (
                        <div key={inv.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                             <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-primary font-mono">{inv.invoiceNumber}</span>
                                        <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{formatDate(inv.date)}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-700">{inv.customerName}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(inv)} className="p-1.5 text-primary border border-primary-light bg-primary-light rounded hover:bg-primary hover:text-white transition-colors"><Edit size={16}/></button>
                                    <button 
                                        onClick={() => {
                                            if(window.confirm('حذف الفاتورة سيسترجع المخزون. هل أنت متأكد؟')) {
                                                deleteSaleInvoice(inv.id);
                                            }
                                        }} 
                                        className="p-1.5 text-danger border border-danger-light bg-danger-light rounded hover:bg-danger hover:text-white transition-colors"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3">
                                <span className="text-slate-500 font-medium">{inv.items.length} مواد</span>
                                <span className="font-bold text-slate-900 text-lg">{formatCurrency(inv.totalAmount)}</span>
                            </div>
                        </div>
                    ))}
                    {saleInvoices.length === 0 && (
                        <div className="text-center py-12 text-slate-400 font-medium">لا توجد مبيعات سابقة</div>
                    )}
                </div>
            )}
        </div>
    );
};