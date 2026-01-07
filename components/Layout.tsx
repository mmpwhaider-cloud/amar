import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingCart, Banknote, ArrowRightLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    
    return (
        <NavLink 
            to={to} 
            className={`flex flex-col items-center justify-center py-2 px-1 text-xs font-bold transition-colors duration-200
                ${isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-700'}`}
        >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
            <span>{label}</span>
        </NavLink>
    );
};

export const Layout: React.FC = () => {
    const { isLoading, error, refreshData } = useStore();

    return (
        <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Header */}
            <header className="bg-white shadow-sm z-10 p-4 flex flex-col gap-2 border-b border-slate-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary text-white p-1.5 rounded-lg">
                            <Package size={20} />
                        </div>
                        <h1 className="text-xl font-bold text-slate-900">المخزن</h1>
                    </div>
                    {isLoading && (
                        <div className="flex items-center gap-2 text-primary bg-primary-light px-3 py-1 rounded-full animate-pulse">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-xs font-bold">جاري المزامنة...</span>
                        </div>
                    )}
                </div>
                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 text-red-800 px-3 py-2 text-xs font-bold rounded-md border border-red-100 flex items-center justify-between leading-relaxed">
                         <div className="flex items-start gap-2">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                         </div>
                         <button 
                            onClick={() => refreshData()}
                            className="bg-white border border-red-200 text-red-700 px-2 py-1 rounded text-xs flex items-center gap-1 hover:bg-red-50"
                         >
                             <RefreshCw size={12} />
                             <span>إعادة المحاولة</span>
                         </button>
                    </div>
                )}
            </header>

            {/* Main Content (Scrollable) */}
            <main className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 md:pb-4 max-w-4xl mx-auto w-full">
                <Outlet />
            </main>

            {/* Bottom Navigation (Mobile First) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50 md:sticky md:top-0">
                <div className="flex justify-around items-center max-w-4xl mx-auto">
                    <NavItem to="/" icon={LayoutDashboard} label="الرئيسية" />
                    <NavItem to="/suppliers" icon={Users} label="المجهزين" />
                    <NavItem to="/inventory" icon={Package} label="المخزن" />
                    <NavItem to="/purchases" icon={ShoppingCart} label="مشتريات" />
                    <NavItem to="/sales" icon={Banknote} label="مبيعات" />
                    <NavItem to="/payments" icon={ArrowRightLeft} label="مدفوعات" />
                </div>
                {/* Safe Area for iPhone */}
                <div className="h-4 bg-white w-full md:hidden"></div>
            </nav>
        </div>
    );
};