import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    colorClass?: string;
    subValue?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass = "text-primary-600", subValue }) => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
                <p className="text-slate-500 text-sm mb-1 font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 dir-ltr text-right font-mono">{value}</h3>
                {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
            </div>
            <div className={`p-3 rounded-full bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
                <Icon className={colorClass} size={24} />
            </div>
        </div>
    );
};
