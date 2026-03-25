import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import useAuthStore from '../store/useAuthStore';
import axiosInstance from '../config/axios';

import { CnpsLogin } from '../features/auth/CnpsLogin';
import { BankLogin } from '../features/auth/BankLogin';
import SuperLogin from '../features/auth/SuperLogin';

import DashboardLayout from '../layouts/DashBoardLayout';
import { Supervision } from '../features/cnps/Supervision';
import { Reporting } from '../features/cnps/Reporting';
import { ManageAgents } from '../features/cnps/ManageAgents';
import { Quittances } from '../features/cnps/Quittances';
// import { ManageBanks } from '../features/cnps/ManageBanks'; // Transféré au Superviseur

import BankDashboard from '../features/bank/BankDashboard';
import { BankHistory } from '../features/bank/BankHistory';
import { BankAgents } from '../features/bank/BankAgents'; // <-- NOUVEL IMPORT

import { CompanySSOCallback } from '../features/auth/CompanySSOCallback';
import { CompanyDashboard } from '../features/company/CompanyDashboard';
import { CompanyDeclarations } from '../features/company/CompanyDeclarations';
import SupervisorDashboard from '../features/supervisor/SupervisorDashboard';
import SupervisorDeclarations from '../features/supervisor/SupervisorDeclarations';

// import { SupervisorBanks } from '../features/supervisor/SupervisorBanks'; 

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
                <Route path="/login/super" element={<SuperLogin />} />
                
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
                        <Route path="/bank" element={<BankDashboard />} />
                        <Route path="/bank/history" element={<BankHistory />} />
                        <Route path="/bank/agents" element={<BankAgents />} /> {/* <-- NOUVELLE ROUTE */}
                    </Route>

                    {/* --- ESPACE CNPS --- */}
                    <Route element={<ProtectedRoute allowedRoles={['cnps']} />}>
                        <Route path="/cnps" element={<Supervision/>} />
                        <Route path="/cnps/reporting" element={<Reporting/>} />
                        <Route path="/cnps/quittances" element={<Quittances />} />
                        <Route path="/cnps/agents" element={<ManageAgents/>} />
                        {/* <Route path="/cnps/banks" element={<ManageBanks/>} /> */} 
                    </Route>

                    {/* --- ESPACE SUPERVISEUR --- */}
                    <Route element={<ProtectedRoute allowedRoles={['supervisor']} />}>
                        <Route path="/supervisor" element={<SupervisorDashboard />} />
                        <Route path="/supervisor/declarations" element={<SupervisorDeclarations />} />
                        {/* <Route path="/supervisor/banks" element={<SupervisorBanks />} /> */}
                    </Route>
                    
                </Route>

                {/* Page 404 */}
                <Route path="*" element={<div className="flex h-screen items-center justify-center text-2xl font-bold text-red-600">Erreur 404 : Page introuvable</div>} />
            </Routes>
        </Router>
    );
};