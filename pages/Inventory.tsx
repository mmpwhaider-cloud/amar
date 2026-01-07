import React, { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../constants';
import { Search, Package, AlertTriangle, Filter, Calculator, Coins } from 'lucide-react';

export const Inventory: React.FC = () => {
    const { products, suppliers, updateProductPrice } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [tempPrice, setTempPrice] = useState<number>(0);

    // Filter Logic
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSupplier = selectedSupplierId === 'all' || p.supplierId === selectedSupplierId;
            return matchesSearch && matchesSupplier;
        });
    }, [products, searchTerm, selectedSupplierId]);

    // Calculate Total Value of currently displayed inventory (Cost basis)
    const totalInventoryValue = useMemo(() => {
        return filteredProducts.reduce((sum, p) => sum + (p.quantityInStock * p.lastPurchasePrice), 0);
    }, [filteredProducts]);

    const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || 'غير معروف';

    const handlePriceEdit = (product: any) => {
        setEditingPriceId(product.id);
        setTempPrice(product.salePrice);
    };

    const savePrice = (id: string) => {
        updateProductPrice(id, tempPrice);
        setEditingPriceId(null);
    };

    return (
        <div className="space-y-4 pb-20">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Package className="text-primary" />
                <span>المخزن (المواد)</span>
            </h2>
            
            {/* Total Value Summary Card */}
            <div className="bg-slate-800 text-white p-4 rounded-lg shadow-md flex items-center justify-between">
                <div>
                    <p className="text-slate-300 text-xs font-bold mb-1">
                        {selectedSupplierId === 'all' 
                            ? 'إجمالي قيمة المخزون (سعر الشراء)' 
                            : `قيمة بضاعة المجهز (${getSupplierName(selectedSupplierId)}) المتوفرة`
                        }
                    </p>
                    <h3 className="text-2xl font-bold dir-ltr text-right font-mono text-emerald-400">
                        {formatCurrency(totalInventoryValue)}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                        العدد المتوفر × سعر الشراء
                    </p>
                </div>
                <div className="bg-slate-700 p-3 rounded-full text-emerald-400">
                    <Coins size={24} />
                </div>
            </div>

            {/* Controls: Search & Filter */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text"
                        placeholder="بحث عن مادة..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm text-slate-900"
                    />
                </div>
                <div className="relative md:w-1/3">
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <select
                        value={selectedSupplierId}
                        onChange={e => setSelectedSupplierId(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-300 bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm text-slate-900 appearance-none"
                    >
                        <option value="all">كافة المجهزين</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-3">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="mx-auto text-slate-300 mb-3" size={48} />
                        <p className="text-slate-500 font-medium">لا توجد مواد مطابقة</p>
                    </div>
                ) : (
                    filteredProducts.map(product => {
                        const itemTotalValue = product.quantityInStock * product.lastPurchasePrice;
                        
                        return (
                            <div key={product.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-3">
                                {/* Header */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg">{product.name}</h3>
                                        <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
                                            <span className="text-slate-400">المجهز:</span>
                                            <span className="text-slate-700 bg-slate-100 px-1.5 rounded">{getSupplierName(product.supplierId)}</span>
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded text-xs font-bold border ${product.quantityInStock > 0 ? 'bg-primary-light text-primary border-primary-light' : 'bg-danger-light text-danger border-danger-light'}`}>
                                        العدد: {product.quantityInStock}
                                    </div>
                                </div>
                                
                                {/* Consignment Calculation Section */}
                                <div className="bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Calculator size={14} />
                                        <span>قيمة المتوفر:</span>
                                        <span className="font-mono text-slate-800" dir="ltr">{product.quantityInStock} × {formatCurrency(product.lastPurchasePrice)}</span>
                                    </div>
                                    <span className="font-bold text-slate-900 text-sm bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                                        {formatCurrency(itemTotalValue)}
                                    </span>
                                </div>

                                {/* Pricing Controls */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold mb-1">سعر الشراء (للقطعة)</p>
                                        <p className="text-sm font-bold text-slate-600">{formatCurrency(product.lastPurchasePrice)}</p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-slate-400 font-bold mb-1">سعر البيع (للقطعة)</p>
                                        {editingPriceId === product.id ? (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" 
                                                    value={tempPrice}
                                                    onChange={e => setTempPrice(Number(e.target.value))}
                                                    className="w-24 p-1 text-sm border rounded dir-ltr"
                                                    autoFocus
                                                />
                                                <button onClick={() => savePrice(product.id)} className="text-xs bg-primary text-white px-3 py-1.5 rounded font-bold">حفظ</button>
                                            </div>
                                        ) : (
                                            <p 
                                                onClick={() => handlePriceEdit(product)}
                                                className="text-lg font-bold text-primary cursor-pointer border-b border-dashed border-primary-light hover:border-primary transition-colors"
                                            >
                                                {formatCurrency(product.salePrice)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                {product.quantityInStock === 0 && (
                                    <div className="flex items-center gap-2 text-danger bg-danger-light p-2 rounded-md text-xs font-bold border border-danger-light mt-1">
                                        <AlertTriangle size={14} />
                                        <span>المخزون نفد</span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};