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
            <h2 className="text-xl font-bold text-slate-800">المخزن (المواد)</h2>
            
            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text"
                    placeholder="بحث عن مادة..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
                />
            </div>

            <div className="space-y-3">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-10">
                        <Package className="mx-auto text-slate-300 mb-2" size={48} />
                        <p className="text-slate-500">لا توجد مواد مطابقة</p>
                    </div>
                ) : (
                    filteredProducts.map(product => (
                        <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-slate-800">{product.name}</h3>
                                    <p className="text-xs text-slate-400 mt-1">المجهز: {getSupplierName(product.supplierId)}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${product.quantityInStock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    العدد: {product.quantityInStock}
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                <div>
                                    <p className="text-xs text-slate-400">سعر الشراء الأخير</p>
                                    <p className="text-sm font-medium text-slate-600">{formatCurrency(product.lastPurchasePrice)}</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-slate-400">سعر البيع</p>
                                    {editingPriceId === product.id ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <input 
                                                type="number" 
                                                value={tempPrice}
                                                onChange={e => setTempPrice(Number(e.target.value))}
                                                className="w-20 p-1 text-sm border border-primary-300 rounded"
                                            />
                                            <button onClick={() => savePrice(product.id)} className="text-xs bg-primary-600 text-white px-2 py-1 rounded">حفظ</button>
                                        </div>
                                    ) : (
                                        <p 
                                            onClick={() => handlePriceEdit(product)}
                                            className="text-lg font-bold text-primary-600 cursor-pointer border-b border-dashed border-primary-200 hover:border-primary-600"
                                        >
                                            {formatCurrency(product.salePrice)}
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            {product.quantityInStock === 0 && (
                                <div className="flex items-center gap-2 text-amber-500 bg-amber-50 p-2 rounded-lg text-xs">
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
