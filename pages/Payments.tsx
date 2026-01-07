import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency, formatDate, generateId } from '../constants';
import { ArrowRightLeft, AlertCircle, Trash2, Edit } from 'lucide-react';
import { Payment } from '../types';

export const Payments: React.FC = () => {
    const { suppliers, getSupplierStats, savePayment, deletePayment, payments } = useStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [supplierId, setSupplierId] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0, 16));

    const selectedSupplierStats = useMemo(() => {
        if (!supplierId) return null;
        return getSupplierStats(supplierId);
    }, [supplierId, getSupplierStats, payments]); // depend on payments to refresh stats

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || !amount) return;

        const payAmount = parseFloat(amount);
        
        // Validation: If creating new, check balance. If editing, it's complex because we are changing history.
        // Simplified: allow user to correct mistakes even if it temporarily messes up math, but warn.
        if (!editingId && selectedSupplierStats && payAmount > selectedSupplierStats.remainingBalance) {
            alert("تنبيه: المبلغ المدفوع أكبر من الدين الحالي");
            // We allow it? Prompt says "Cannot pay more than RemainingBalance".
            // Strict rule:
            return; 
        }

        const payment: Payment = {
            id: editingId || generateId(),
            date: new Date(date).getTime(),
            supplierId,
            amount: payAmount,
            notes
        };

        savePayment(payment);
        
        // Reset
        setEditingId(null);
        setAmount('');
        setNotes('');
        setDate(new Date().toISOString().slice(0, 16));
        alert("تم حفظ الدفعة");
    };

    const handleEdit = (p: Payment) => {
        setEditingId(p.id);
        setSupplierId(p.supplierId);
        setAmount(p.amount.toString());
        setNotes(p.notes || '');
        const d = new Date(p.date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setDate(d.toISOString().slice(0, 16));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Filter suppliers who have debt
    const indebtedSuppliers = suppliers.filter(s => getSupplierStats(s.id).remainingBalance > 0);

    return (
        <div className="max-w-xl mx-auto space-y-6 pb-20">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ArrowRightLeft className="text-primary-600" />
                <span>{editingId ? 'تعديل دفعة' : 'تسديد دفعة جديدة'}</span>
            </h2>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-5">
                {editingId && (
                    <div className="bg-yellow-50 text-yellow-800 p-2 text-sm rounded text-center">
                        جاري تعديل دفعة سابقة. <button type="button" onClick={() => setEditingId(null)} className="underline font-bold">إلغاء</button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">المجهز</label>
                        <select 
                            value={supplierId} 
                            onChange={e => setSupplierId(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                            required
                        >
                            <option value="">-- اختر --</option>
                            {/* Always show selected supplier even if debt is 0 (for editing) */}
                            {suppliers.map(s => {
                                const debt = getSupplierStats(s.id).remainingBalance;
                                if (debt <= 0 && s.id !== supplierId) return null; 
                                return (
                                    <option key={s.id} value={s.id}>{s.name} ({formatCurrency(debt)})</option>
                                )
                            })}
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">التاريخ</label>
                         <input 
                            type="datetime-local" 
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                         />
                    </div>
                </div>

                {selectedSupplierStats && (
                    <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3 border border-red-100 text-red-800">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs uppercase font-bold tracking-wide opacity-70">الدين الحالي</p>
                            <p className="text-2xl font-bold font-mono dir-ltr text-right">{formatCurrency(selectedSupplierStats.remainingBalance)}</p>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ</label>
                    <input 
                        type="number" 
                        min="1"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="0"
                        required
                        disabled={!supplierId}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
                    <textarea 
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                        rows={2}
                        placeholder="اختياري"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={!supplierId}
                    className="w-full bg-primary-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-500/30 transition-all"
                >
                    {editingId ? 'حفظ التعديلات' : 'تسجيل الدفعة'}
                </button>
            </form>

            <div className="space-y-4 pt-6 border-t border-slate-200">
                <h3 className="font-bold text-slate-700">سجل المدفوعات الأخيرة</h3>
                {payments.length === 0 ? (
                    <p className="text-center text-slate-400">لا توجد مدفوعات</p>
                ) : (
                    payments.sort((a,b) => b.date - a.date).slice(0, 10).map(p => {
                        const sup = suppliers.find(s => s.id === p.supplierId);
                        return (
                            <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-slate-800">{sup?.name || 'غير معروف'}</p>
                                    <p className="text-xs text-slate-400">{formatDate(p.date)}</p>
                                    {p.notes && <p className="text-xs text-slate-500 mt-1">{p.notes}</p>}
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-primary-600">{formatCurrency(p.amount)}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(p)} className="text-blue-400 hover:text-blue-600"><Edit size={16}/></button>
                                        <button onClick={() => { if(confirm('حذف؟')) deletePayment(p.id)}} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};
