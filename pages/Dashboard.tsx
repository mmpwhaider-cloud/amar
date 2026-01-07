import React from 'react';
import { useStore } from '../context/StoreContext';
import { StatCard } from '../components/StatCard';
import { ArrowDownLeft, ArrowUpRight, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../constants';

export const Dashboard: React.FC = () => {
    const { purchaseInvoices, saleInvoices, payments, getSupplierStats, suppliers } = useStore();

    // Aggregates
    const totalPurchases = purchaseInvoices.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalSales = saleInvoices.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate Net Debts (Payables - Red) and Net Credits (Receivables - Green)
    let totalPayables = 0;
    let totalReceivables = 0;

    suppliers.forEach(s => {
        const bal = getSupplierStats(s.id).remainingBalance;
        if (bal > 0) {
            totalPayables += bal;
        } else if (bal < 0) {
            totalReceivables += Math.abs(bal);
        }
    });

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">ملخص العمل</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard 
                    title="إجمالي المبيعات" 
                    value={formatCurrency(totalSales)} 
                    icon={ArrowUpRight} 
                />
                <StatCard 
                    title="إجمالي المشتريات" 
                    value={formatCurrency(totalPurchases)} 
                    icon={ArrowDownLeft} 
                />
                
                {/* Payables (Red) */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-slate-600 text-sm mb-1 font-bold">مستحق للمجهزين (ديون)</p>
                        <h3 className="text-2xl font-bold dir-ltr text-right font-mono text-danger">{formatCurrency(totalPayables)}</h3>
                        <p className="text-xs text-slate-500 mt-1">مبالغ واجبة الدفع</p>
                    </div>
                    <div className="p-3 rounded-full bg-danger-light text-danger">
                        <AlertCircle size={24} />
                    </div>
                </div>

                {/* Receivables (Green) */}
                {totalReceivables > 0 && (
                     <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
                        <div>
                            <p className="text-emerald-700 text-sm mb-1 font-bold">أرصدة عند المجهزين</p>
                            <h3 className="text-2xl font-bold dir-ltr text-right font-mono text-emerald-600">{formatCurrency(totalReceivables)}</h3>
                            <p className="text-xs text-emerald-600/70 mt-1">مبالغ مدفوعة مقدماً</p>
                        </div>
                        <div className="p-3 rounded-full bg-emerald-50 text-emerald-600">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                )}
                
                <StatCard 
                    title="إجمالي المدفوعات" 
                    value={formatCurrency(totalPayments)} 
                    icon={Wallet} 
                />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
                     <h3 className="font-bold text-lg text-slate-800">آخر الحركات</h3>
                </div>
                
                {saleInvoices.length === 0 && purchaseInvoices.length === 0 ? (
                    <p className="text-slate-500 text-center py-6">لا توجد حركات بعد</p>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {saleInvoices.slice(0, 3).map(sale => (
                            <div key={sale.id} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary-light p-2 rounded-full text-primary">
                                        <ArrowUpRight size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">بيع: {sale.invoiceNumber}</p>
                                        <p className="text-xs text-slate-500">{formatDate(sale.date)} • {sale.items.length} مواد</p>
                                    </div>
                                </div>
                                <span className="font-bold text-slate-900 text-sm">{formatCurrency(sale.totalAmount)}</span>
                            </div>
                        ))}
                         {purchaseInvoices.slice(0, 3).map(purchase => (
                            <div key={purchase.id} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-100 p-2 rounded-full text-slate-600">
                                        <ArrowDownLeft size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">شراء: {purchase.invoiceNumber}</p>
                                        <p className="text-xs text-slate-500">{formatDate(purchase.date)} • {purchase.items.length} مواد</p>
                                    </div>
                                </div>
                                <span className="font-bold text-slate-600 text-sm">{formatCurrency(purchase.totalAmount)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};