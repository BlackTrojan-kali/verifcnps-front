import React from 'react';
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
        return `${tickItem / 1000000}M`;
    };

    // Composant interne pour les "Cartes" (KPI) pour éviter de répéter le code
    const KpiCard = ({ title, value, subtitle, icon: Icon, colorClass, borderColor }: any) => (
        <div className={`relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-slate-100 border-l-4 ${borderColor}`}>
            <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
            <div className="text-2xl font-bold text-slate-900 mb-2">{value}</div>
            <div className={`flex items-center text-xs font-medium ${colorClass}`}>
                <Icon size={14} className="mr-1.5" />
                {subtitle}
            </div>
        </div>
    );

    if (isLoading || !stats) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
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
                    {/* Faux Sélecteur de Date (Pour le visuel de la maquette) */}
                    <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                        <Calendar size={18} className="text-slate-400" />
                        <span className="text-sm text-slate-600">01 Jan 2026 - 31 Mar 2026</span>
                    </div>

                    <button 
                        onClick={exportReport}
                        disabled={isExporting}
                        className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-900 disabled:opacity-70"
                    >
                        {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        Exporter le Rapport (PDF/Excel)
                    </button>
                </div>
            </div>

            {/* 2. LES 3 CARTES KPI (Grille CSS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard 
                    title="Total Collecté (Période)"
                    value={`${stats.kpis.totalCollected.toLocaleString('fr-FR')} FCFA`}
                    subtitle="+12.5% vs période précédente"
                    icon={TrendingUp}
                    colorClass="text-emerald-600"
                    borderColor="border-l-emerald-500"
                />
                <KpiCard 
                    title="Taux de Rapprochement"
                    value={`${stats.kpis.reconciliationRate}%`}
                    subtitle="Excellent taux de correspondance"
                    icon={Clock}
                    colorClass="text-blue-600"
                    borderColor="border-l-blue-600"
                />
                <KpiCard 
                    title="Paiements Rejetés / Anomalies"
                    value={stats.kpis.rejectedCount}
                    subtitle="Nécessite une vérification"
                    icon={AlertTriangle}
                    colorClass="text-red-500"
                    borderColor="border-l-red-500"
                />
            </div>

            {/* 3. LES GRAPHIQUES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* GRAPHIQUE BARRE (Prend 2 colonnes sur 3 sur grand écran) */}
                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
                    <h3 className="text-base font-bold text-slate-900 mb-6">Évolution des encaissements par banque partenaire</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.bankChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis tickFormatter={formatYAxis} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    formatter={(value: number) => [`${value.toLocaleString('fr-FR')} FCFA`, 'Montant']}
                                />
                                {/* Le fameux bleu de la maquette */}
                                <Bar dataKey="amount" fill="#1e40af" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Légende personnalisée centrée en bas */}
                    <div className="mt-4 flex justify-center items-center gap-2 text-xs text-blue-800 font-medium">
                        <div className="h-3 w-3 bg-blue-800 rounded-sm"></div>
                        Montant (FCFA)
                    </div>
                </div>

                {/* GRAPHIQUE CAMEMBERT (Prend 1 colonne sur 3) */}
                <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-1 flex flex-col">
                    <h3 className="text-base font-bold text-slate-900 mb-6">Répartition par Mode de Paiement</h3>
                    <div className="flex-1 min-h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.paymentModeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {stats.paymentModeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => [`${value}%`, 'Part']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};