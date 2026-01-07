import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingCart, Banknote, ArrowRightLeft } from 'lucide-react';

const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    
    return (
        <NavLink 
            to={to} 
            className={`flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors duration-200
                ${isActive ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
            <span>{label}</span>
        </NavLink>
    );
};

export const Layout: React.FC = () => {
    return (
        <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans">
            {/* Header */}
            <header className="bg-white shadow-sm z-10 p-4 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="bg-primary-600 text-white p-1.5 rounded-lg">
                        <Package size={20} />
                    </div>
                    <h1 className="text-xl font-bold text-primary-900">المخزن</h1>
                </div>
            </header>

            {/* Main Content (Scrollable) */}
            <main className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 md:pb-4 max-w-4xl mx-auto w-full">
                <Outlet />
            </main>

            {/* Bottom Navigation (Mobile First) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50 md:sticky md:top-0">
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
