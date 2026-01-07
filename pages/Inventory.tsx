import React, { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../constants';
import { Search, Package, AlertTriangle } from 'lucide-react';

export const Inventory: React.FC = () => {
    const { products, suppliers, updateProductPrice } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [tempPrice, setTempPrice] = useState<number>(0);

    const filteredProducts = useMemo(() => {
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm]);

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
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">المخزن (المواد)</h2>
            
            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text"
                    placeholder="بحث عن مادة..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-lg border border-slate-300 focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm text-slate-900"
                />
            </div>

            <div className="space-y-3">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="mx-auto text-slate-300 mb-3" size={48} />
                        <p className="text-slate-500 font-medium">لا توجد مواد مطابقة</p>
                    </div>
                ) : (
                    filteredProducts.map(product => (
                        <div key={product.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">{product.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">المجهز: {getSupplierName(product.supplierId)}</p>
                                </div>
                                <div className={`px-3 py-1 rounded text-xs font-bold border ${product.quantityInStock > 0 ? 'bg-primary-light text-primary border-primary-light' : 'bg-danger-light text-danger border-danger-light'}`}>
                                    العدد: {product.quantityInStock}
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                <div>
                                    <p className="text-xs text-slate-500 font-bold mb-1">سعر الشراء</p>
                                    <p className="text-sm font-bold text-slate-600">{formatCurrency(product.lastPurchasePrice)}</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-slate-500 font-bold mb-1">سعر البيع</p>
                                    {editingPriceId === product.id ? (
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number" 
                                                value={tempPrice}
                                                onChange={e => setTempPrice(Number(e.target.value))}
                                                className="w-24 p-1 text-sm border rounded"
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
                                <div className="flex items-center gap-2 text-danger bg-danger-light p-2 rounded-md text-xs font-bold border border-danger-light">
                                    <AlertTriangle size={14} />
                                    <span>المخزون نفد، يرجى الشراء لإعادة التعبئة</span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};