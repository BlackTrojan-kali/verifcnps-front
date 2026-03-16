import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import useAuthStore from '../store/useAuthStore';
import axiosInstance from '../config/axios';

import { CnpsLogin } from '../features/auth/CnpsLogin';
import { BankLogin } from '../features/auth/BankLogin';
import DashboardLayout from '../layouts/DashBoardLayout';
import { Supervision } from '../features/cnps/Supervision';
import { Reporting } from '../features/cnps/Reporting';
import { ManageBanks } from '../features/cnps/ManageBanks';
import { ManageAgents } from '../features/cnps/ManageAgents';
import { BankHistory } from '../features/bank/BankHistory';
import { CompanySSOCallback } from '../features/auth/CompanySSOCallback';
import { CompanyDashboard } from '../features/company/CompanyDashboard';
import { CompanyDeclarations } from '../features/company/CompanyDeclarations';

// L'IMPORT CLÉ DE NOTRE GABARIT :

// Pages temporaires pour voir le résultat visuel
const PlaceholderDashboard = ({ title }: { title: string }) => (
    <div className="rounded-lg bg-white p-10 text-center shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        <p className="mt-2 text-slate-500">Le contenu de cette page sera codé très bientôt !</p>
    </div>
);

export const AppRouter = () => {
    const { token, setUser, setLoading, logout } = useAuthStore();

    useEffect(() => {
        const verifySession = async () => {
            if (token) {
                try {
                    const response = await axiosInstance.get('/me');
                    setUser(response.data);
                } catch (error) {
                    logout();
                }
            } else {
                setLoading(false);
            }
        };
        verifySession();
    }, [token, setUser, setLoading, logout]);

    return (
        <Router>
            <Routes>
                
                {/* NOUVELLE ROUTE : Le point de chute depuis l'API externe */}
         <Route path="/sso/callback" element={<CompanySSOCallback />} />
                {/* ROUTES PUBLIQUES (Sans le Layout, prennent tout l'écran) */}
                <Route path="/login/cnps" element={<CnpsLogin />} />
                <Route path="/login/bank" element={<BankLogin />} />
                <Route path="/login" element={<Navigate to="/login/cnps" replace />} />
                <Route path="/" element={<Navigate to="/login/cnps" replace />} />

                {/* ======================================================== */}
                {/* TOUTES LES ROUTES CI-DESSOUS UTILISENT LE DASHBOARD LAYOUT */}
                {/* ======================================================== */}
                <Route element={<DashboardLayout />}>
                    
                    {/* --- ESPACE ENTREPRISE --- */}
                    <Route element={<ProtectedRoute allowedRoles={['company']} />}>
                        <Route path="/company" element={<CompanyDashboard/>} />
                        <Route path="/company/declarations" element={<CompanyDeclarations />} />
                    </Route>

                    {/* --- ESPACE BANQUE --- */}
                    <Route element={<ProtectedRoute allowedRoles={['bank']} />}>
                        <Route path="/bank" element={<PlaceholderDashboard title="Guichet Bancaire" />} />
                        <Route path="/bank/history" element={<BankHistory />} />
                    </Route>

                    {/* --- ESPACE CNPS --- */}
                    <Route element={<ProtectedRoute allowedRoles={['cnps']} />}>
                        <Route path="/cnps" element={<Supervision/>} />
                        <Route path="/cnps/reporting" element={<Reporting/>} />
                        <Route path="/cnps/quittances" element={<PlaceholderDashboard title="Gestion des Quittances" />} />
                        <Route path="/cnps/banks" element={<ManageBanks/>} />
                        <Route path="/cnps/agents" element={<ManageAgents/>} />
                    </Route>
                    
                </Route>

                {/* Page 404 */}
                <Route path="*" element={<div className="flex h-screen items-center justify-center text-2xl font-bold text-red-600">Erreur 404 : Page introuvable</div>} />
            </Routes>
        </Router>
    );
};