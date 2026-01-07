import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../constants';
import { Plus, User, Phone, Trash2, X, AlertCircle, CheckCircle } from 'lucide-react';

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
                <h2 className="text-xl font-bold text-slate-900">المجهزين</h2>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-colors"
                >
                    <Plus size={18} />
                    <span>إضافة مجهز</span>
                </button>
            </div>

            <div className="space-y-3">
                {suppliers.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                        <User className="mx-auto text-slate-300 mb-3" size={48} />
                        <p className="text-slate-500 font-medium">لا يوجد مجهزين حالياً</p>
                    </div>
                ) : (
                    suppliers.map(supplier => {
                        const stats = getSupplierStats(supplier.id);
                        return (
                            <div key={supplier.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900">{supplier.name}</h3>
                                        {supplier.phone && (
                                            <div className="flex items-center gap-1 text-slate-500 text-sm mt-1 font-medium">
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
                                        className="text-slate-400 hover:text-danger transition-colors p-1"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                        <p className="text-slate-500 text-xs font-bold mb-1">مجموع المشتريات</p>
                                        <p className="font-bold text-slate-800">{formatCurrency(stats.totalPurchased)}</p>
                                    </div>
                                    
                                    {/* Balance Indicator */}
                                    {stats.remainingBalance > 0 ? (
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <div className="flex items-center gap-1 mb-1">
                                                <AlertCircle size={12} className="text-danger" />
                                                <p className="text-slate-500 text-xs font-bold">مستحق عليه</p>
                                            </div>
                                            <p className="font-bold text-danger">{formatCurrency(stats.remainingBalance)}</p>
                                        </div>
                                    ) : stats.remainingBalance < 0 ? (
                                        <div className="bg-emerald-50 p-2 rounded border border-emerald-100">
                                             <div className="flex items-center gap-1 mb-1">
                                                <CheckCircle size={12} className="text-emerald-600" />
                                                <p className="text-emerald-700 text-xs font-bold">رصيد لك عنده</p>
                                            </div>
                                            <p className="font-bold text-emerald-600">{formatCurrency(Math.abs(stats.remainingBalance))}</p>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <p className="text-slate-400 text-xs font-bold mb-1">الحساب</p>
                                            <p className="font-bold text-slate-500">متوازن</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">إضافة مجهز جديد</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">اسم المجهز <span className="text-danger">*</span></label>
                                <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full p-2.5 border rounded-lg text-sm"
                                    placeholder="اسم الشركة أو الشخص"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">رقم الهاتف</label>
                                <input 
                                    type="tel" 
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full p-2.5 border rounded-lg text-sm"
                                    placeholder="اختياري"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">ملاحظات</label>
                                <textarea 
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full p-2.5 border rounded-lg text-sm"
                                    rows={3}
                                    placeholder="اختياري"
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg font-bold transition-colors mt-2"
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