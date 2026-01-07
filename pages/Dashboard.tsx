import React from 'react';
import { useStore } from '../context/StoreContext';
import { StatCard } from '../components/StatCard';
import { ArrowDownLeft, ArrowUpRight, Wallet, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../constants';

export const Dashboard: React.FC = () => {
    const { purchaseInvoices, saleInvoices, payments, getSupplierStats, suppliers } = useStore();

    // Aggregates
    const totalPurchases = purchaseInvoices.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalSales = saleInvoices.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    
    // Total Debt Calculation
    const totalDebt = suppliers.reduce((sum, s) => {
        return sum + getSupplierStats(s.id).remainingBalance;
    }, 0);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">ملخص العمل</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard 
                    title="إجمالي المبيعات" 
                    value={formatCurrency(totalSales)} 
                    icon={ArrowUpRight} 
                    colorClass="text-green-600"
                />
                <StatCard 
                    title="إجمالي المشتريات" 
                    value={formatCurrency(totalPurchases)} 
                    icon={ArrowDownLeft} 
                    colorClass="text-blue-600"
                />
                <StatCard 
                    title="ديون المجهزين المتبقية" 
                    value={formatCurrency(totalDebt)} 
                    icon={AlertCircle} 
                    colorClass="text-red-500"
                    subValue="مبالغ واجبة الدفع"
                />
                <StatCard 
                    title="المدفوعات للمجهزين" 
                    value={formatCurrency(totalPayments)} 
                    icon={Wallet} 
                    colorClass="text-primary-600"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                <h3 className="font-bold text-lg mb-4 text-slate-700">آخر الحركات</h3>
                {saleInvoices.length === 0 && purchaseInvoices.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">لا توجد حركات بعد</p>
                ) : (
                    <div className="space-y-3">
                        {saleInvoices.slice(0, 3).map(sale => (
                            <div key={sale.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-full text-green-600">
                                        <ArrowUpRight size={16} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">بيع: {sale.invoiceNumber}</p>
                                        <p className="text-xs text-slate-400">{formatDate(sale.date)} - {sale.items.length} مواد</p>
                                    </div>
                                </div>
                                <span className="font-bold text-green-600 text-sm">{formatCurrency(sale.totalAmount)}</span>
                            </div>
                        ))}
                         {purchaseInvoices.slice(0, 3).map(purchase => (
                            <div key={purchase.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                        <ArrowDownLeft size={16} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">شراء: {purchase.invoiceNumber}</p>
                                        <p className="text-xs text-slate-400">{formatDate(purchase.date)} - {purchase.items.length} مواد</p>
                                    </div>
                                </div>
                                <span className="font-bold text-blue-600 text-sm">{formatCurrency(purchase.totalAmount)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
