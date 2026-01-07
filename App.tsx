import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Suppliers } from './pages/Suppliers';
import { Inventory } from './pages/Inventory';
import { Purchases } from './pages/Purchases';
import { Sales } from './pages/Sales';
import { Payments } from './pages/Payments';

const App: React.FC = () => {
    return (
        <StoreProvider>
            <HashRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="suppliers" element={<Suppliers />} />
                        <Route path="inventory" element={<Inventory />} />
                        <Route path="purchases" element={<Purchases />} />
                        <Route path="sales" element={<Sales />} />
                        <Route path="payments" element={<Payments />} />
                    </Route>
                </Routes>
            </HashRouter>
        </StoreProvider>
    );
};

export default App;
