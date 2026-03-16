import React, { useEffect, useState } from 'react';
import { Search, Landmark, FileDown, Eye, ChevronDown, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useBankHistory } from './useBankHistory';
import { Declaration } from '../../types';

export const BankHistory = () => {
    const { 
        declarations, isLoading, fetchDeclarations, page, setPage, totalPages,
        searchTerm, setSearchTerm, validatePayment, rejectPayment, isActionLoading
    } = useBankHistory();

    const [actionModal, setActionModal] = useState<{ type: 'validate' | 'reject', declaration: Declaration } | null>(null);
    
    // Champs pour les formulaires d'action
    const [reference, setReference] = useState('');
    const [orderReference, setOrderReference] = useState('');
    const [rejectComment, setRejectComment] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchDeclarations();
    }, [fetchDeclarations]);

    const openAction = (type: 'validate' | 'reject', dec: Declaration) => {
        setActionModal({ type, declaration: dec });
        setReference(dec.reference || '');
        setOrderReference('');
        setRejectComment('');
        setErrorMsg('');
    };

    const handleActionSubmit = async () => {
        if (!actionModal) return;
        setErrorMsg('');

        let result;
        if (actionModal.type === 'validate') {
            if (!reference) return setErrorMsg('La référence est requise.');
            if (actionModal.declaration.payment_mode === 'ordre_virement' && !orderReference) {
                return setErrorMsg('La référence de l\'ordre de virement est requise.');
            }
            result = await validatePayment(actionModal.declaration.id, reference, orderReference);
        } else {
            if (!rejectComment) return setErrorMsg('Le motif du rejet est obligatoire.');
            result = await rejectPayment(actionModal.declaration.id, rejectComment);
        }

        if (result.success) {
            setActionModal(null);
        } else {
            setErrorMsg(result.message);
        }
    };

    // Helpers pour le design exact de la maquette
    const formatStatus = (status: string) => {
        switch (status) {
            case 'cnps_validated': return <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Rapproché</span>;
            case 'bank_validated': return <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Transféré</span>;
            case 'submited': return <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">En attente</span>;
            case 'rejected': return <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Rejeté</span>;
            default: return <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{status}</span>;
        }
    };

    const formatPaymentMode = (mode: string | null) => {
        if (mode === 'virement') return <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">Virement</span>;
        if (mode === 'especes') return <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">Espèces</span>;
        return <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 uppercase">{mode?.replace('_', ' ')}</span>;
    };

    return (
        <div className="animate-in fade-in duration-300">
            
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {/* Header stylé comme sur la maquette */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <Landmark size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Historique Global des Encaissements CNPS</h2>
                    </div>
                    
                    <div className="relative mt-4 sm:mt-0 w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Rechercher par Référence Unique ou Identifiant..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchDeclarations()}
                            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>

                {/* Tableau */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Date Transaction</th>
                                <th className="px-6 py-4">Référence Unique Banque</th>
                                <th className="px-6 py-4">Numéro Identifiant Unique Entreprise</th>
                                <th className="px-6 py-4 text-center">Type de Dépôt</th>
                                <th className="px-6 py-4 text-right">Montant (FCFA)</th>
                                <th className="px-6 py-4 text-center">Statut CNPS</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={7} className="py-12 text-center text-slate-400"><Loader2 className="mx-auto animate-spin mb-2" />Chargement...</td></tr>
                            ) : declarations.length === 0 ? (
                                <tr><td colSpan={7} className="py-12 text-center text-slate-400">Aucune transaction trouvée.</td></tr>
                            ) : (
                                declarations.map((dec) => (
                                    <tr key={dec.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(dec.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium">
                                            {dec.reference}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-blue-600 hover:underline cursor-pointer">
                                                {dec.company?.niu || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {formatPaymentMode(dec.payment_mode)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                                            {Number(dec.amount).toLocaleString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {formatStatus(dec.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button className="text-slate-400 hover:text-blue-600 transition-colors"><FileDown size={18} /></button>
                                                <div className="flex flex-col items-center cursor-pointer group text-slate-400 hover:text-blue-600 transition-colors">
                                                    <Eye size={16} className="mb-0.5" />
                                                    <span className="text-[10px] font-medium leading-none">Voir<br/>Détails</span>
                                                </div>
                                                
                                                {/* Bouton d'action uniquement si en attente */}
                                                {dec.status === 'submited' ? (
                                                    <div className="relative group inline-block">
                                                        <button className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700">
                                                            Traiter <ChevronDown size={14} />
                                                        </button>
                                                        {/* Menu déroulant au survol */}
                                                        <div className="absolute right-0 top-full mt-1 hidden w-36 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg group-hover:flex z-10">
                                                            <button onClick={() => openAction('validate', dec)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-700 hover:bg-slate-50 text-left">
                                                                <CheckCircle size={14} /> Valider
                                                            </button>
                                                            <div className="h-px bg-slate-100"></div>
                                                            <button onClick={() => openAction('reject', dec)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-slate-50 text-left">
                                                                <XCircle size={14} /> Rejeter
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-[88px]"></div> // Espaceur pour l'alignement
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALE D'ACTION (Validation ou Rejet) */}
            {actionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className={`border-b px-6 py-4 ${actionModal.type === 'validate' ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-red-100 bg-red-50 text-red-800'}`}>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                {actionModal.type === 'validate' ? <><CheckCircle size={20}/> Valider le paiement</> : <><XCircle size={20}/> Rejeter le paiement</>}
                            </h3>
                        </div>

                        <div className="p-6">
                            {errorMsg && (
                                <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="mb-6 space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div className="flex justify-between"><span className="font-medium">Entreprise :</span> <span className="font-semibold text-slate-900">{actionModal.declaration.company?.raison_sociale}</span></div>
                                <div className="flex justify-between"><span className="font-medium">Montant :</span> <span className="font-bold text-slate-900">{Number(actionModal.declaration.amount).toLocaleString('fr-FR')} FCFA</span></div>
                                <div className="flex justify-between"><span className="font-medium">Mode :</span> <span className="uppercase text-slate-900">{actionModal.declaration.payment_mode?.replace('_', ' ')}</span></div>
                            </div>

                            {actionModal.type === 'validate' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Référence de transaction (Banque) <span className="text-red-500">*</span></label>
                                        <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                                    </div>
                                    {actionModal.declaration.payment_mode === 'ordre_virement' && (
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">Référence Ordre de Virement <span className="text-red-500">*</span></label>
                                            <input type="text" value={orderReference} onChange={(e) => setOrderReference(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Motif du rejet <span className="text-red-500">*</span></label>
                                    <textarea value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} rows={3} placeholder="Expliquez brièvement pourquoi ce dépôt est rejeté..." className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"></textarea>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4 border-t border-slate-100">
                            <button onClick={() => setActionModal(null)} disabled={isActionLoading} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200">
                                Annuler
                            </button>
                            <button onClick={handleActionSubmit} disabled={isActionLoading} className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-70 ${actionModal.type === 'validate' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : actionModal.type === 'validate' ? 'Valider le dépôt' : 'Confirmer le rejet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};