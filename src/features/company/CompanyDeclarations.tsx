import { useEffect } from 'react';
import { Search, Building2, Download, Eye, Loader2, FileText } from 'lucide-react';
import { useCompanyDashboard } from './useCompanyDashboard';
import { StatusBadge } from '../../components/ui/StatusBadge'; 

export const CompanyDeclarations = () => {
    const { 
        declarations, banks, isLoading, 
        fetchDeclarations, fetchBanks,
        filters, handleFilterChange,
        page, setPage, totalPages,
        downloadReceipt // <-- MISE À JOUR : On importe la fonction pour la quittance finale
    } = useCompanyDashboard();

    // Chargement initial
    useEffect(() => {
        fetchDeclarations();
        if (banks.length === 0) fetchBanks();
    }, [fetchDeclarations, fetchBanks, banks.length]);

    // Helper pour formater le mode de paiement
    const formatPaymentMode = (mode: string | null) => {
        if (!mode) return '-';
        if (mode === 'virement') return 'Virement en ligne';
        if (mode === 'ordre_virement') return 'Ordre de virement';
        if (mode === 'especes') return 'Espèces';
        if (mode === 'mobile_money') return 'Mobile Money';
        return mode;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Mes Déclarations</h1>
                    <p className="text-sm text-slate-500 mt-1">Consultez et filtrez l'historique complet de vos cotisations CNPS.</p>
                </div>
            </div>

            {/* BARRE DE FILTRES */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                
                {/* Recherche par Référence */}
                <div className="relative min-w-[250px] flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher par référence..." 
                        value={filters.reference}
                        onChange={(e) => handleFilterChange('reference', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                </div>

                {/* Filtre Banque */}
                <div className="relative min-w-[200px]">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                        value={filters.bank_id}
                        onChange={(e) => handleFilterChange('bank_id', e.target.value)}
                        className="w-full appearance-none rounded-lg border border-slate-300 py-2 pl-9 pr-8 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    >
                        <option value="">Toutes les banques</option>
                        {banks.map((bank) => (
                            <option key={bank.id} value={bank.id}>
                                {bank.bank_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filtres Dates */}
                <div className="flex items-center gap-2">
                    <input 
                        type="date" 
                        value={filters.start_date}
                        onChange={(e) => handleFilterChange('start_date', e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 focus:border-blue-600 focus:outline-none"
                    />
                    <span className="text-slate-400 font-medium">à</span>
                    <input 
                        type="date" 
                        value={filters.end_date}
                        onChange={(e) => handleFilterChange('end_date', e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 focus:border-blue-600 focus:outline-none"
                    />
                </div>
            </div>

            {/* TABLEAU DES DONNÉES */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Date / Période</th>
                                <th className="px-6 py-4">Référence</th>
                                <th className="px-6 py-4">Banque & Mode</th>
                                <th className="px-6 py-4 text-right">Montant (FCFA)</th>
                                <th className="px-6 py-4 text-center">Statut</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-2" />
                                        Chargement de l'historique...
                                    </td>
                                </tr>
                            ) : declarations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-500">
                                        <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                        Aucune déclaration ne correspond à vos critères.
                                    </td>
                                </tr>
                            ) : (
                                declarations.map((dec) => (
                                    <tr key={dec.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-slate-900">
                                                {new Date(dec.period).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Déposé le {new Date(dec.created_at).toLocaleDateString('fr-FR')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-600">
                                            {dec.reference}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{dec.bank?.bank_name || '-'}</div>
                                            <div className="text-xs text-slate-500">{formatPaymentMode(dec.payment_mode)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                                            {Number(dec.amount).toLocaleString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <StatusBadge status={dec.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                                            <button className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200">
                                                <Eye size={14} /> Voir
                                            </button>
                                            
                                            {/* MISE À JOUR : Appel de downloadReceipt et sécurité sur la présence du fichier */}
                                            <button 
                                                onClick={() => downloadReceipt(dec.id, dec.reference)}
                                                disabled={dec.status !== 'cnps_validated' || !dec.receipt_path} 
                                                className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50 disabled:hover:bg-blue-50"
                                                title={(!dec.receipt_path || dec.status !== 'cnps_validated') ? 'En attente de la quittance CNPS' : 'Télécharger la quittance officielle'}
                                            >
                                                <Download size={14} /> Quittance
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {!isLoading && totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3">
                        <span className="text-sm text-slate-500">
                            Page <span className="font-bold text-slate-900">{page}</span> sur <span className="font-bold text-slate-900">{totalPages}</span>
                        </span>
                        <div className="flex gap-2">
                            <button 
                                disabled={page === 1} 
                                onClick={() => setPage(p => p - 1)} 
                                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Précédent
                            </button>
                            <button 
                                disabled={page === totalPages} 
                                onClick={() => setPage(p => p + 1)} 
                                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};