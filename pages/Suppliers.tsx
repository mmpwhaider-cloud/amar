import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../constants';
import { Plus, User, Phone, Trash2, X } from 'lucide-react';

export const Suppliers: React.FC = () => {
    const { suppliers, addSupplier, deleteSupplier, getSupplierStats } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        addSupplier(name, phone, notes);
        setName('');
        setPhone('');
        setNotes('');
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">المجهزين</h2>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md active:scale-95 transition-transform"
                >
                    <Plus size={18} />
                    <span>إضافة مجهز</span>
                </button>
            </div>

            <div className="grid gap-4">
                {suppliers.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-slate-100">
                        <User className="mx-auto text-slate-300 mb-2" size={48} />
                        <p className="text-slate-500">لا يوجد مجهزين حالياً</p>
                    </div>
                ) : (
                    suppliers.map(supplier => {
                        const stats = getSupplierStats(supplier.id);
                        return (
                            <div key={supplier.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{supplier.name}</h3>
                                        {supplier.phone && (
                                            <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                                                <Phone size={14} />
                                                <span>{supplier.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if(window.confirm('هل أنت متأكد من حذف هذا المجهز؟')) {
                                                deleteSupplier(supplier.id);
                                            }
                                        }}
                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-sm mt-4 pt-4 border-t border-slate-50 bg-slate-50 rounded-lg p-2">
                                    <div>
                                        <p className="text-slate-400 text-xs">مجموع المشتريات</p>
                                        <p className="font-bold text-slate-700">{formatCurrency(stats.totalPurchased)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs">الدين المتبقي</p>
                                        <p className={`font-bold ${stats.remainingBalance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                                            {formatCurrency(stats.remainingBalance)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">إضافة مجهز جديد</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">اسم المجهز <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="اسم الشركة أو الشخص"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                                <input 
                                    type="tel" 
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="اختياري"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
                                <textarea 
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                    rows={3}
                                    placeholder="اختياري"
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold hover:bg-primary-700 transition-colors"
                            >
                                حفظ المجهز
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
