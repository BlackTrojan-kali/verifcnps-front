import React, { useEffect, useState } from 'react';
import { 
    Wallet, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    TrendingUp,
    Activity,
    Filter,
    RefreshCw
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { useSupervisor, DashboardFilters } from './useSupervisor';
import { Bank } from '../../types';

// Typage des données attendues depuis le backend
interface DashboardStats {
    kpis: {
        totalVolume: number;
        totalReconciled: number;
        totalDeclarations: number;
        pendingCount: number;
        rejectedCount: number;
    };
    bankPerformanceData: { name: string; amount: number; transactions: number }[];
    paymentModeData: { name: string; value: number; color: string }[];
    trendData: { date: string; amount: number }[];
}

export const SupervisorDashboard = () => {
    const { fetchDashboardStats, fetchBanks, isLoading, error } = useSupervisor();
    
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [banks, setBanks] = useState<Bank[]>([]);
    
    // État pour les filtres
    const [filters, setFilters] = useState<DashboardFilters>({
        bank_id: '',
        start_date: '',
        end_date: ''
    });

    // 1. Charger les banques au montage pour le menu déroulant
    useEffect(() => {
        const loadBanks = async () => {
            const data = await fetchBanks();
            if (data) setBanks(data);
        };
        loadBanks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2. Fonction pour charger les stats en fonction des filtres
    const loadStats = async (currentFilters: DashboardFilters) => {
        const data = await fetchDashboardStats(currentFilters);
        if (data) setStats(data);
    };

    // 3. Charger les stats initiales au montage
    useEffect(() => {
        loadStats(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Gestion de la soumission du formulaire de filtres
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loadStats(filters);
    };

    // Réinitialiser les filtres
    const handleResetFilters = () => {
        const emptyFilters = { bank_id: '', start_date: '', end_date: '' };
        setFilters(emptyFilters);
        loadStats(emptyFilters);
    };

    // Fonction de formatage pour les montants en FCFA
    const formatFCFA = (amount: number) => {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            
            {/* EN-TÊTE */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Vue Globale du Système</h1>
                <p className="text-slate-500 mt-1">Supervision en temps réel des encaissements et des performances bancaires.</p>
            </div>

            {/* BARRE DE FILTRES */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <form onSubmit={handleFilterSubmit} className="flex flex-col md:flex-row items-end gap-4">
                    
                    <div className="w-full md:w-1/3">
                        <label className="block text-xs font-medium text-slate-700 mb-1">Filtrer par Banque</label>
                        <select 
                            value={filters.bank_id}
                            onChange={(e) => setFilters({...filters, bank_id: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">Toutes les banques</option>
                            {banks.map(bank => (
                                <option key={bank.id} value={bank.id}>{bank.bank_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full md:w-1/3">
                        <label className="block text-xs font-medium text-slate-700 mb-1">Période</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                value={filters.start_date}
                                onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <span className="text-slate-400">à</span>
                            <input 
                                type="date" 
                                value={filters.end_date}
                                onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-1/3 flex gap-2">
                        <button 
                            type="button" 
                            onClick={handleResetFilters}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" /> Réinitialiser
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-70"
                        >
                            <Filter className="h-4 w-4" /> Filtrer
                        </button>
                    </div>
                </form>
            </div>

            {/* GESTION DU CHARGEMENT / ERREURS */}
            {isLoading && !stats ? (
                <div className="flex h-[40vh] items-center justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                </div>
            ) : error ? (
                <div className="rounded-lg bg-red-50 p-4 border border-red-200 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                        <h3 className="text-lg font-medium text-red-800">Erreur</h3>
                        <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                </div>
            ) : stats ? (
                <>
                    {/* 1. SECTION DES KPIs */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Volume Total Traité</p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">{formatFCFA(stats.kpis.totalVolume)}</p>
                                <p className="mt-1 text-xs text-slate-400">{stats.kpis.totalDeclarations} déclarations</p>
                            </div>
                            <div className="rounded-full bg-blue-50 p-3"><Wallet className="h-6 w-6 text-blue-600" /></div>
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Rapproché</p>
                                <p className="mt-2 text-2xl font-bold text-emerald-600">{formatFCFA(stats.kpis.totalReconciled)}</p>
                                <p className="mt-1 text-xs text-slate-400">Argent sécurisé</p>
                            </div>
                            <div className="rounded-full bg-emerald-50 p-3"><CheckCircle2 className="h-6 w-6 text-emerald-600" /></div>
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">En Attente Guichet</p>
                                <p className="mt-2 text-2xl font-bold text-amber-600">{stats.kpis.pendingCount}</p>
                                <p className="mt-1 text-xs text-slate-400">Dossiers à traiter</p>
                            </div>
                            <div className="rounded-full bg-amber-50 p-3"><Clock className="h-6 w-6 text-amber-600" /></div>
                        </div>

                        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Rejets Banques</p>
                                <p className="mt-2 text-2xl font-bold text-red-600">{stats.kpis.rejectedCount}</p>
                                <p className="mt-1 text-xs text-slate-400">Dossiers litigieux</p>
                            </div>
                            <div className="rounded-full bg-red-50 p-3"><AlertCircle className="h-6 w-6 text-red-600" /></div>
                        </div>
                    </div>

                    {/* 2. GRAPHIQUE PRINCIPAL : Évolution */}
                    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6">
                            <Activity className="h-5 w-5 text-slate-400" />
                            <h2 className="text-lg font-semibold text-slate-800">Tendance des Encaissements</h2>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                                    <RechartsTooltip formatter={(value: number) => [formatFCFA(value), 'Montant']} />
                                    <Line type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#3730A3' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. GRAPHIQUES SECONDAIRES */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Performances par banque */}
                        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 mb-6">
                                <TrendingUp className="h-5 w-5 text-slate-400" />
                                <h2 className="text-lg font-semibold text-slate-800">Performances par Banque</h2>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.bankPerformanceData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} width={100} />
                                        <RechartsTooltip formatter={(value: number) => [formatFCFA(value), 'Collecté']} />
                                        <Bar dataKey="amount" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Modes de paiement */}
                        <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 mb-6">
                                <Wallet className="h-5 w-5 text-slate-400" />
                                <h2 className="text-lg font-semibold text-slate-800">Répartition par Mode</h2>
                            </div>
                            <div className="h-[300px] w-full flex items-center justify-center relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={stats.paymentModeData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={2} dataKey="value" stroke="none">
                                            {stats.paymentModeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip formatter={(value: number) => [`${value} déclarations`, 'Quantité']} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                                    <span className="text-3xl font-bold text-slate-800">{stats.kpis.totalDeclarations}</span>
                                    <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Total</span>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap justify-center gap-4">
                                {stats.paymentModeData.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                                        <span className="text-sm text-slate-600">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default SupervisorDashboard;