import React, { useState, useEffect, useCallback } from 'react';
import { 
    Search, 
    Filter, 
    Eye, 
    Loader2, 
    RefreshCw, 
    ChevronLeft, 
    ChevronRight,
    Building2,
    Calendar,
    X,
    FileDown // Utilisé pour le bouton de téléchargement
} from 'lucide-react';
import { useSupervisor, DeclarationFilters } from './useSupervisor';
import { Declaration, Bank } from '../../types';

const SupervisorDeclarations = () => {
    const { fetchDeclarations, fetchDeclarationDetails, isLoading, fetchBanks } = useSupervisor();
    
    // États des données
    const [declarations, setDeclarations] = useState<Declaration[]>([]);
    const [banks, setBanks] = useState<Bank[]>([]); 
    
    // États de pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // États des filtres
    const [filters, setFilters] = useState<DeclarationFilters>({
        search: '',
        status: '',
        payment_mode: '',
        bank_id: '',
        start_date: '',
        end_date: ''
    });

    // État pour la modale de détails
    const [selectedDeclaration, setSelectedDeclaration] = useState<Declaration | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    // 1. Récupérer la liste des banques pour le filtre au montage du composant
    useEffect(() => {
        const loadBanks = async () => {
            try {
                const response = await fetchBanks();
                setBanks(response || response?.data);
            } catch (error) {
                console.error("Erreur de chargement des banques", error);
            }
        };
        loadBanks();
    }, [fetchBanks]);

    // 2. Charger les déclarations
    const loadData = useCallback(async () => {
        const data = await fetchDeclarations({ ...filters, page });
        if (data) {
            setDeclarations(data.data);
            setTotalPages(data.last_page);
            setTotalItems(data.total);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]); 

    // Charger les données au montage et à chaque changement de page
    useEffect(() => {
        loadData();
    }, [loadData]);

    // 3. Gestionnaires d'événements
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); 
        loadData();
    };

    const resetFilters = () => {
        setFilters({ search: '', status: '', payment_mode: '', bank_id: '', start_date: '', end_date: '' });
        setPage(1);
        setTimeout(() => loadData(), 0);
    };

    const handleViewDetails = async (id: number) => {
        setIsDetailsLoading(true);
        const data = await fetchDeclarationDetails(id);
        if (data) setSelectedDeclaration(data);
        setIsDetailsLoading(false);
    };

    // Utilitaires d'affichage
    const formatFCFA = (amount: number | string) => {
        return new Intl.NumberFormat('fr-FR').format(Number(amount)) + ' FCFA';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'cnps_validated': return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200">Clôturé (CNPS)</span>;
            case 'bank_validated': return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 border border-blue-200">Validé (Banque)</span>;
            case 'submited': return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">En attente</span>;
            case 'rejected': return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 border border-red-200">Rejeté</span>;
            default: return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 border border-slate-200">{status}</span>;
        }
    };

    const formatPaymentMode = (mode: string | null) => {
        if (!mode) return '-';
        return mode.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-300">
            
            {/* EN-TÊTE */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Toutes les déclarations</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Recherchez et analysez l'historique complet des transactions sur la plateforme.
                </p>
            </div>

            {/* MOTEUR DE RECHERCHE ET FILTRES */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <form onSubmit={handleFilterSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        
                        {/* Recherche texte */}
                        <div className="xl:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Recherche (Réf, Num employeur, Nom)</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                <input 
                                    type="text" 
                                    placeholder="Ex: DEP-2026..." 
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Filtre Statut */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Statut</label>
                            <select 
                                value={filters.status}
                                onChange={(e) => setFilters({...filters, status: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="submited">En attente guichet</option>
                                <option value="bank_validated">Validé par Banque</option>
                                <option value="cnps_validated">Clôturé par CNPS</option>
                                <option value="rejected">Rejeté</option>
                            </select>
                        </div>

                        {/* Filtre Mode de paiement */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Mode de paiement</label>
                            <select 
                                value={filters.payment_mode}
                                onChange={(e) => setFilters({...filters, payment_mode: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            >
                                <option value="">Tous les modes</option>
                                <option value="virement">Virement (En ligne)</option>
                                <option value="especes">Espèces (Guichet)</option>
                                <option value="ordre_virement">Ordre de Virement (Guichet)</option>
                            </select>
                        </div>

                        {/* Filtre Banque */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Banque partenaire</label>
                            <select 
                                value={filters.bank_id}
                                onChange={(e) => setFilters({...filters, bank_id: e.target.value})}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            >
                                <option value="">Toutes les banques</option>
                                {banks.map(bank => (
                                    <option key={bank.id} value={bank.id.toString()}>{bank.bank_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-2 border-t border-slate-100">
                        {/* Filtre Dates */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Calendar className="h-4 w-4 text-slate-400 hidden sm:block" />
                            <input 
                                type="date" 
                                value={filters.start_date}
                                onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                                className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <span className="text-slate-400">à</span>
                            <input 
                                type="date" 
                                value={filters.end_date}
                                onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                                className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button 
                                type="button" 
                                onClick={resetFilters}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                <RefreshCw className="h-4 w-4" /> Réinitialiser
                            </button>
                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-70"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                                Filtrer les résultats
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* TABLEAU DES RÉSULTATS */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Date & Période</th>
                                <th className="px-6 py-4 font-semibold">Référence</th>
                                <th className="px-6 py-4 font-semibold">Employeur</th>
                                <th className="px-6 py-4 font-semibold">Banque & Mode</th>
                                <th className="px-6 py-4 font-semibold">Montant</th>
                                <th className="px-6 py-4 font-semibold">Statut</th>
                                <th className="px-6 py-4 font-semibold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading && declarations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500 mb-2" />
                                        Chargement des transactions...
                                    </td>
                                </tr>
                            ) : declarations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <Search className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                        Aucune déclaration ne correspond à vos critères.
                                    </td>
                                </tr>
                            ) : (
                                declarations.map((dec) => (
                                    <tr key={dec.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{new Date(dec.created_at).toLocaleDateString('fr-FR')}</div>
                                            <div className="text-xs text-slate-500">Période: {dec.period}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                {dec.reference}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 truncate max-w-[200px]" title={dec.company?.raison_sociale}>
                                                {dec.company?.raison_sociale || 'N/A'}
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono">NIU: {dec.company?.niu}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-900">
                                                <Building2 className="h-3 w-3 text-slate-400" />
                                                <span className="font-medium">{dec.bank?.bank_name || 'Non assigné'}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">{formatPaymentMode(dec.payment_mode)}</div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            {formatFCFA(dec.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(dec.status)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {dec.receipt_path && (
                                                    <a 
                                                        href={dec.receipt_path}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center p-2 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                        title="Ouvrir la quittance"
                                                    >
                                                        <FileDown className="h-5 w-5" />
                                                    </a>
                                                )}
                                                <button 
                                                    onClick={() => handleViewDetails(dec.id)}
                                                    className="inline-flex items-center justify-center p-2 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                    title="Voir les détails"
                                                >
                                                    {isDetailsLoading && selectedDeclaration?.id === dec.id ? (
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <Eye className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                        <div className="text-sm text-slate-500">
                            Affichage de la page <span className="font-medium text-slate-900">{page}</span> sur <span className="font-medium text-slate-900">{totalPages}</span> 
                            <span className="hidden sm:inline"> ({totalItems} résultats)</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isLoading}
                                className="inline-flex items-center p-2 rounded-md bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || isLoading}
                                className="inline-flex items-center p-2 rounded-md bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALE DE DÉTAILS */}
            {selectedDeclaration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <h3 className="text-lg font-bold text-slate-800">Détails de la déclaration</h3>
                            <button onClick={() => setSelectedDeclaration(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Informations Générales</p>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                                        <div>
                                            <span className="text-sm text-slate-500 block">Référence Bancaire</span>
                                            <span className="font-mono font-bold text-slate-900">{selectedDeclaration.reference}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-slate-500 block">Montant Déclaré</span>
                                            <span className="text-lg font-bold text-indigo-600">{formatFCFA(selectedDeclaration.amount)}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-slate-500 block">Statut Actuel</span>
                                            <div className="mt-1">{getStatusBadge(selectedDeclaration.status)}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Acteurs impliqués</p>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                                        <div>
                                            <span className="text-sm text-slate-500 block">Entreprise Emettrice</span>
                                            <span className="font-medium text-slate-900">{selectedDeclaration.company?.raison_sociale}</span>
                                            <span className="text-xs text-slate-500 block font-mono">NIU: {selectedDeclaration.company?.niu}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-slate-500 block">Banque Receptrice</span>
                                            <span className="font-medium text-slate-900">{selectedDeclaration.bank?.bank_name || 'Non spécifié'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section Quittance ajoutée dans la modale */}
                            {selectedDeclaration.receipt_path && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold mb-1">Document Officiel</p>
                                        <p className="text-sm text-emerald-800">La quittance a été délivrée pour cette transaction.</p>
                                    </div>
                                    <a 
                                        href={selectedDeclaration.receipt_path}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors w-full sm:w-auto justify-center"
                                    >
                                        <FileDown size={16} />
                                        Ouvrir la quittance
                                    </a>
                                </div>
                            )}

                            {selectedDeclaration.comment_reject && (
                                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                                    <p className="text-xs text-red-500 uppercase tracking-wider font-semibold mb-1">Motif du rejet</p>
                                    <p className="text-sm text-red-800">{selectedDeclaration.comment_reject}</p>
                                </div>
                            )}

                        </div>
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={() => setSelectedDeclaration(null)}
                                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default SupervisorDeclarations;