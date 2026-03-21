
import { Calendar, Download, TrendingUp, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useReporting } from './useReporting';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell 
} from 'recharts';

export const Reporting = () => {
    const { stats, isLoading, exportReport, isExporting } = useReporting();

    // Formateur pour l'axe Y (Convertir 120000000 en 120M)
    const formatYAxis = (tickItem: number) => {
        if (tickItem >= 1000000) return `${(tickItem / 1000000).toFixed(1)}M`;
        if (tickItem >= 1000) return `${(tickItem / 1000).toFixed(0)}k`;
        return tickItem.toString();
    };

    // Composant interne pour les "Cartes" (KPI) pour éviter de répéter le code
    const KpiCard = ({ title, value, subtitle, icon: Icon, colorClass, borderColor }: any) => (
        <div className={`relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100 border-l-4 ${borderColor} transition-all hover:shadow-md`}>
            <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
            <div className="text-2xl font-bold text-slate-900 mb-2">{value}</div>
            <div className={`flex items-center text-xs font-medium ${colorClass}`}>
                <Icon size={14} className="mr-1.5" />
                {subtitle}
            </div>
        </div>
    );

    if (isLoading || !stats) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="text-sm text-slate-500 font-medium">Génération des statistiques...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* 1. EN-TÊTE ET ACTIONS */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Reporting & Statistiques</h1>
                    <p className="text-sm text-slate-500 mt-1">Analyses et rapports détaillés des encaissements</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Sélecteur de Date (Visuel) */}
                    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                        <Calendar size={18} className="text-slate-400" />
                        <span className="text-sm text-slate-600 font-medium">Cumul Global</span>
                    </div>

                    <button 
                        onClick={exportReport}
                        disabled={isExporting}
                        className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-900 disabled:opacity-70"
                    >
                        {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        Exporter le Rapport (PDF)
                    </button>
                </div>
            </div>

            {/* 2. LES 3 CARTES KPI (Grille CSS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard 
                    title="Total Collecté (Validé CNPS)"
                    value={`${stats.kpis.totalCollected.toLocaleString('fr-FR')} FCFA`}
                    subtitle="Fonds sécurisés"
                    icon={TrendingUp}
                    colorClass="text-emerald-600"
                    borderColor="border-l-emerald-500"
                />
                <KpiCard 
                    title="Taux de Rapprochement"
                    value={`${stats.kpis.reconciliationRate}%`}
                    subtitle="Des fonds déclarés par la banque"
                    icon={Clock}
                    colorClass="text-blue-600"
                    borderColor="border-l-blue-600"
                />
                <KpiCard 
                    title="Paiements Rejetés"
                    value={stats.kpis.rejectedCount}
                    subtitle="Anomalies détectées"
                    icon={AlertTriangle}
                    colorClass="text-red-500"
                    borderColor="border-l-red-500"
                />
            </div>

            {/* 3. LES GRAPHIQUES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* GRAPHIQUE BARRE (Prend 2 colonnes) */}
                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
                    <h3 className="text-base font-bold text-slate-900 mb-6">Performances d'encaissement par Banque</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.bankChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={60} />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                   formatter={(value: any) => [`${Number(value).toLocaleString('fr-FR')} FCFA`, 'Montant encaissé']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="amount" fill="#1e40af" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* GRAPHIQUE CAMEMBERT (Prend 1 colonne) */}
                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-1 flex flex-col">
                    <h3 className="text-base font-bold text-slate-900 mb-2">Modes de Paiement</h3>
                    <p className="text-xs text-slate-500 mb-6">Répartition en pourcentage</p>
                    
                    <div className="flex-1 min-h-[220px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.paymentModeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={95}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.paymentModeData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                   formatter={(value: any) => [`${value}%`, 'Part']} 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Centre du camembert (Optionnel, pour le style) */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xl font-bold text-slate-800">100%</span>
                        </div>
                    </div>

                    {/* LÉGENDE DYNAMIQUE (Générée à partir de vos données Laravel) */}
                    <div className="mt-6 grid grid-cols-2 gap-y-3 gap-x-2">
                        {stats.paymentModeData.map((mode: any, idx: number) => (
                            <div key={idx} className="flex items-center text-xs text-slate-600 font-medium">
                                <span 
                                    className="h-3 w-3 rounded-full mr-2 shrink-0" 
                                    style={{ backgroundColor: mode.color }}
                                ></span>
                                <span className="truncate" title={mode.name}>{mode.name}</span>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};