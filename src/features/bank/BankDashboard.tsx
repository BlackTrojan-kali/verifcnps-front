import  { useEffect } from 'react';
import { Wallet, Clock, CheckCircle, XCircle, Loader2, Calendar } from 'lucide-react';
import { useBankDashboard } from './useBankDashboard';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell 
} from 'recharts';
import useAuthStore from '../../store/useAuthStore';

export const BankDashboard = () => {
    // Récupération du nom de la banque depuis le store global
    const { user } = useAuthStore();
    const bankName = user?.bank?.bank_name || "Tableau de bord";

    const { stats, isLoading, fetchStats } = useBankDashboard();

    // Chargement initial des données
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Formateur pour l'axe Y du graphique (Convertir 1500000 en 1.5M)
    const formatYAxis = (tickItem: number) => {
        if (tickItem >= 1000000) return `${(tickItem / 1000000).toFixed(1)}M`;
        if (tickItem >= 1000) return `${(tickItem / 1000).toFixed(0)}k`;
        return tickItem.toString();
    };

    // Composant réutilisable pour les cartes KPI
    const KpiCard = ({ title, value, subtitle, icon: Icon, colorClass, bgClass, borderColor }: any) => (
        <div className={`relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100 border-l-4 ${borderColor} transition-all hover:shadow-md`}>
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
                    <div className="text-2xl font-bold text-slate-900">{value}</div>
                </div>
                <div className={`rounded-full p-3 ${bgClass} ${colorClass}`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className="mt-4 text-xs font-medium text-slate-500">
                {subtitle}
            </div>
        </div>
    );

    if (isLoading || !stats) {
        return (
            <div className="flex h-[70vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-slate-500">Génération de vos indicateurs...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Espace {bankName}</h1>
                    <p className="text-sm text-slate-500 mt-1">Supervisez vos encaissements et opérations en attente.</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                    <Calendar size={18} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Vue Globale (7 derniers jours)</span>
                </div>
            </div>

            {/* 4 CARTES KPI */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard 
                    title="Volume Collecté"
                    value={`${stats.kpis.totalCollected.toLocaleString('fr-FR')} FCFA`}
                    subtitle="Total des fonds validés"
                    icon={Wallet}
                    colorClass="text-blue-600"
                    bgClass="bg-blue-50"
                    borderColor="border-l-blue-600"
                />
                <KpiCard 
                    title="À Traiter (Guichet)"
                    value={stats.kpis.pendingCount}
                    subtitle="Dossiers en attente d'action"
                    icon={Clock}
                    colorClass="text-amber-600"
                    bgClass="bg-amber-50"
                    borderColor="border-l-amber-500"
                />
                <KpiCard 
                    title="Dossiers Validés"
                    value={stats.kpis.validatedCount}
                    subtitle="Transférés à la CNPS"
                    icon={CheckCircle}
                    colorClass="text-emerald-600"
                    bgClass="bg-emerald-50"
                    borderColor="border-l-emerald-500"
                />
                <KpiCard 
                    title="Dossiers Rejetés"
                    value={stats.kpis.rejectedCount}
                    subtitle="Anomalies signalées"
                    icon={XCircle}
                    colorClass="text-red-600"
                    bgClass="bg-red-50"
                    borderColor="border-l-red-500"
                />
            </div>

            {/* GRAPHIQUES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* GRAPHIQUE ÉVOLUTION (Prend 2 colonnes) */}
                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
                    <h3 className="text-base font-bold text-slate-900 mb-1">Dynamique des encaissements</h3>
                    <p className="text-xs text-slate-500 mb-6">Évolution quotidienne sur les 7 derniers jours</p>
                    
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={50} />
                                <Tooltip 
                                   formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} FCFA`, 'Montant']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* GRAPHIQUE CAMEMBERT (Prend 1 colonne) */}
                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-1 flex flex-col">
                    <h3 className="text-base font-bold text-slate-900 mb-1">Canaux d'encaissement</h3>
                    <p className="text-xs text-slate-500 mb-6">Volume par mode de paiement</p>
                    
                    <div className="flex-1 min-h-[200px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.paymentModeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.paymentModeData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value: any) => [value, 'Dossiers']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* LÉGENDE */}
                    <div className="mt-4 grid grid-cols-1 gap-y-2">
                        {stats.paymentModeData.map((mode: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <div className="flex items-center text-slate-600 font-medium">
                                    <span 
                                        className="h-3 w-3 rounded-full mr-2 shrink-0 shadow-sm" 
                                        style={{ backgroundColor: mode.color }}
                                    ></span>
                                    {mode.name}
                                </div>
                                <span className="font-bold text-slate-900">{mode.value}</span>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BankDashboard;