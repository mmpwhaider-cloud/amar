import React from 'react';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    isDanger?: boolean;
    subValue?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, isDanger = false, subValue }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
                <p className="text-slate-600 text-sm mb-1 font-bold">{title}</p>
                <h3 className={`text-2xl font-bold dir-ltr text-right font-mono ${isDanger ? 'text-danger' : 'text-slate-900'}`}>{value}</h3>
                {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
            </div>
            <div className={`p-3 rounded-full ${isDanger ? 'bg-danger-light text-danger' : 'bg-primary-light text-primary'}`}>
                <Icon size={24} />
            </div>
        </div>
    );
};