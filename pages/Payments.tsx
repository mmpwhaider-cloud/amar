import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatCurrency, formatDate, generateId } from '../constants';
import { ArrowRightLeft, AlertCircle, Trash2, Edit, CheckCircle } from 'lucide-react';
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
    }, [supplierId, getSupplierStats, payments]); 

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || !amount) return;

        const payAmount = parseFloat(amount);
        
        // Removed logic that blocks overpayment. 
        // We now allow users to enter any amount.

        const payment: Payment = {
            id: editingId || generateId(),
            date: new Date(date).getTime(),
            supplierId,
            amount: payAmount,
            notes
        };

        savePayment(payment);
        setEditingId(null);
        setAmount('');
        setNotes('');
        setDate(new Date().toISOString().slice(0, 16));
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

    return (
        <div className="max-w-xl mx-auto space-y-6 pb-20">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="text-primary" />
                <span>{editingId ? 'تعديل دفعة' : 'تسديد دفعة جديدة'}</span>
            </h2>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-5">
                {editingId && (
                    <div className="bg-amber-50 text-amber-800 p-3 text-sm rounded border border-amber-200 text-center font-bold">
                        جاري تعديل دفعة سابقة. <button type="button" onClick={() => setEditingId(null)} className="underline ml-1">إلغاء</button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">المجهز</label>
                        <select 
                            value={supplierId} 
                            onChange={e => setSupplierId(e.target.value)}
                            className="w-full p-3 border rounded-lg text-sm bg-white"
                            required
                        >
                            <option value="">-- اختر --</option>
                            {suppliers.map(s => {
                                // Show all suppliers, not just indebted ones, to allow advance payments/credits
                                const debt = getSupplierStats(s.id).remainingBalance;
                                return (
                                    <option key={s.id} value={s.id}>{s.name} ({debt > 0 ? `-${formatCurrency(debt)}` : `+${formatCurrency(Math.abs(debt))}`})</option>
                                )
                            })}
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-bold text-slate-700 mb-1">التاريخ</label>
                         <input 
                            type="datetime-local" 
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full p-3 border rounded-lg text-sm"
                         />
                    </div>
                </div>

                {selectedSupplierStats && (
                    <div className={`p-4 rounded-lg flex items-center gap-3 border ${selectedSupplierStats.remainingBalance > 0 ? 'bg-slate-50 border-slate-200' : selectedSupplierStats.remainingBalance < 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50'}`}>
                        {selectedSupplierStats.remainingBalance > 0 ? (
                            <>
                                <AlertCircle size={24} className="shrink-0 text-danger" />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase">مستحق عليه</p>
                                    <p className="text-2xl font-bold text-danger dir-ltr text-right">{formatCurrency(selectedSupplierStats.remainingBalance)}</p>
                                </div>
                            </>
                        ) : selectedSupplierStats.remainingBalance < 0 ? (
                            <>
                                <CheckCircle size={24} className="shrink-0 text-emerald-600" />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-emerald-700 uppercase">رصيد لك عنده</p>
                                    <p className="text-2xl font-bold text-emerald-600 dir-ltr text-right">{formatCurrency(Math.abs(selectedSupplierStats.remainingBalance))}</p>
                                </div>
                            </>
                        ) : (
                            <div className="w-full text-center text-slate-500 font-bold py-1">
                                الحساب متوازن (0)
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">المبلغ</label>
                    <input 
                        type="number" 
                        min="1"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full p-3 border rounded-lg text-lg font-bold"
                        placeholder="0"
                        required
                        disabled={!supplierId}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">ملاحظات</label>
                    <textarea 
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full p-3 border rounded-lg text-sm"
                        rows={2}
                        placeholder="اختياري"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={!supplierId}
                    className="w-full bg-primary hover:bg-primary-hover disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg shadow-sm transition-colors"
                >
                    {editingId ? 'حفظ التعديلات' : 'تسجيل الدفعة'}
                </button>
            </form>

            <div className="space-y-4 pt-6 border-t border-slate-200">
                <h3 className="font-bold text-slate-800">سجل المدفوعات الأخيرة</h3>
                {payments.length === 0 ? (
                    <p className="text-center text-slate-400 py-4 font-medium">لا توجد مدفوعات</p>
                ) : (
                    payments.sort((a,b) => b.date - a.date).slice(0, 10).map(p => {
                        const sup = suppliers.find(s => s.id === p.supplierId);
                        return (
                            <div key={p.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center hover:border-slate-300 transition-colors">
                                <div>
                                    <p className="font-bold text-slate-900">{sup?.name || 'غير معروف'}</p>
                                    <p className="text-xs text-slate-500 font-medium">{formatDate(p.date)}</p>
                                    {p.notes && <p className="text-xs text-slate-500 mt-1">{p.notes}</p>}
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-primary text-lg">{formatCurrency(p.amount)}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(p)} className="text-slate-400 hover:text-primary"><Edit size={16}/></button>
                                        <button onClick={() => { if(confirm('حذف؟')) deletePayment(p.id)}} className="text-slate-400 hover:text-danger"><Trash2 size={16}/></button>
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