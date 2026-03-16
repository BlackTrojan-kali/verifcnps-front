import React, { useEffect, useState } from 'react';
import { Search, Download, Eye, Loader2, CheckCircle, X, AlertTriangle, Building2 } from 'lucide-react';
import { useSupervision } from './useSupervision';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Declaration } from '../../types';

export const Supervision = () => {
    const { 
        declarations, banks, isLoading, filters, handleFilterChange, 
        page, setPage, totalPages, exportPdf, isExporting,
        fetchDeclarations, fetchBanks, reconcilePayment, isActionLoading
    } = useSupervision();

    const [declarationToReconcile, setDeclarationToReconcile] = useState<Declaration | null>(null);

    // On charge les déclarations ET la liste des banques au montage du composant
    useEffect(() => {
        fetchDeclarations();
        fetchBanks(); // <-- Appel de la nouvelle fonction
    }, [fetchDeclarations, fetchBanks]);

    const handleConfirmReconciliation = async () => {
        if (declarationToReconcile) {
            await reconcilePayment(declarationToReconcile.id);
            setDeclarationToReconcile(null);
        }
    };

    return (
        <div className="space-y-6 relative">
            
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Supervision des Cotisations</h1>
                    <p className="text-sm text-slate-500">Gérez l'état des déclarations et paiements des entreprises.</p>
                </div>
                <button 
                    onClick={exportPdf}
                    disabled={isExporting}
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-70"
                >
                    {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                    Exporter le Rapport (PDF)
                </button>
            </div>

            {/* BARRE DE FILTRES */}
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                
                {/* Recherche */}
                <div className="relative min-w-[200px] flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher (NIU, Référence...)" 
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                {/* NOUVEAU : Filtre Banque */}
                <div className="relative min-w-[180px]">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                        value={filters.bank_id}
                        onChange={(e) => handleFilterChange('bank_id', e.target.value)}
                        className="w-full appearance-none rounded-md border border-slate-300 py-2 pl-9 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    >
                        <option value="">Toutes les banques</option>
                        {banks.map((bank) => (
                            <option key={bank.id} value={bank.id}>
                                {bank.bank_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filtre Statut */}
                <select 
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="rounded-md border border-slate-300 py-2 pl-3 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                    <option value="">Tous les statuts</option>
                    <option value="submited">En attente Banque</option>
                    <option value="bank_validated">Validé Banque</option>
                    <option value="cnps_validated">Rapproché (Terminé)</option>
                    <option value="rejected">Rejeté</option>
                </select>

                {/* Filtres Dates */}
                <div className="flex items-center gap-2">
                    <input 
                        type="date" 
                        value={filters.start_date}
                        onChange={(e) => handleFilterChange('start_date', e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-slate-400">à</span>
                    <input 
                        type="date" 
                        value={filters.end_date}
                        onChange={(e) => handleFilterChange('end_date', e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* LE TABLEAU DES DONNÉES (Inchangé) */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Entreprise</th>
                                <th className="px-6 py-4 font-semibold">Banque</th>
                                <th className="px-6 py-4 font-semibold">Montant</th>
                                <th className="px-6 py-4 font-semibold">Statut</th>
                                <th className="px-6 py-4 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-2" />
                                        Chargement des déclarations...
                                    </td>
                                </tr>
                            ) : declarations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500">
                                        Aucune déclaration ne correspond à vos filtres.
                                    </td>
                                </tr>
                            ) : (
                                declarations.map((dec) => (
                                    <tr key={dec.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(dec.created_at).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{dec.company?.raison_sociale || 'N/A'}</div>
                                            <div className="text-xs text-slate-500">NIU: {dec.company?.niu || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {dec.bank ? dec.bank.bank_name : <span className="text-slate-400">-</span>}
                                        </td>
                                        <td className="px-6 py-4 font-semibold whitespace-nowrap">
                                            {Number(dec.amount).toLocaleString('fr-FR')} FCFA
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={dec.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                                            <button className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200">
                                                <Eye size={14} /> Consulter
                                            </button>
                                            
                                            {dec.status === 'bank_validated' && (
                                                <button 
                                                    onClick={() => setDeclarationToReconcile(dec)}
                                                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-200"
                                                >
                                                    <CheckCircle size={14} /> Rapprocher
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!isLoading && totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3">
                        <span className="text-sm text-slate-500">
                            Page <span className="font-semibold text-slate-900">{page}</span> sur <span className="font-semibold text-slate-900">{totalPages}</span>
                        </span>
                        <div className="flex gap-2">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50 hover:bg-slate-50">Précédent</button>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50 hover:bg-slate-50">Suivant</button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALE DE RAPPROCHEMENT (Inchangée) */}
            {declarationToReconcile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <div className="flex items-center gap-2 text-emerald-700">
                                <CheckCircle size={20} />
                                <h3 className="text-lg font-bold">Rapprocher le paiement</h3>
                            </div>
                            <button 
                                onClick={() => setDeclarationToReconcile(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-4 rounded-lg bg-orange-50 p-4 text-sm text-orange-800 flex items-start gap-3 border border-orange-100">
                                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                                <p>En rapprochant ce paiement, vous confirmez que les fonds ont bien été reçus sur les comptes de la CNPS. Cette action est définitive.</p>
                            </div>

                            <div className="space-y-3 text-sm text-slate-600">
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="font-medium text-slate-500">Entreprise :</span>
                                    <span className="font-semibold text-slate-900">{declarationToReconcile.company?.raison_sociale}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="font-medium text-slate-500">Banque ayant validé :</span>
                                    <span className="font-semibold text-slate-900">{declarationToReconcile.bank?.bank_name}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="font-medium text-slate-500">Référence :</span>
                                    <span className="font-mono text-slate-900">{declarationToReconcile.reference}</span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="font-medium text-slate-500">Montant à rapprocher :</span>
                                    <span className="text-lg font-bold text-emerald-600">{Number(declarationToReconcile.amount).toLocaleString('fr-FR')} FCFA</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4 border-t border-slate-100">
                            <button 
                                onClick={() => setDeclarationToReconcile(null)}
                                disabled={isActionLoading}
                                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleConfirmReconciliation}
                                disabled={isActionLoading}
                                className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-70"
                            >
                                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                Confirmer le rapprochement
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};