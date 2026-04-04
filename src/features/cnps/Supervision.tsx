import { useEffect, useState } from 'react';
import { 
    Search, Download, Eye, Loader2, CheckCircle, 
    X, AlertTriangle, Building2, FileDown, XCircle, Link
} from 'lucide-react';
import { useSupervision } from './useSupervision';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Declaration } from '../../types';

export const Supervision = () => {
    const { 
        declarations, banks, isLoading, filters, handleFilterChange, 
        page, setPage, totalPages, exportPdf, isExporting,
        fetchDeclarations, fetchBanks, reconcilePayment, isActionLoading,
        downloadProof, rejectPayment, uploadReceipt // NOUVELLES FONCTIONS IMPORTÉES
    } = useSupervision();

    // États pour les modales
    const [declarationToReconcile, setDeclarationToReconcile] = useState<Declaration | null>(null);
    const [declarationToReject, setDeclarationToReject] = useState<Declaration | null>(null);
    const [declarationToReceipt, setDeclarationToReceipt] = useState<Declaration | null>(null);

    // États des formulaires internes aux modales
    const [commentReject, setCommentReject] = useState('');
    const [receiptUrl, setReceiptUrl] = useState('');
    const [actionError, setActionError] = useState('');

    // On charge les déclarations ET la liste des banques au montage du composant
    useEffect(() => {
        fetchDeclarations();
        fetchBanks();
    }, [fetchDeclarations, fetchBanks]);

    // ==========================================
    // GESTIONNAIRES D'ACTIONS
    // ==========================================
    const handleConfirmReconciliation = async () => {
        if (declarationToReconcile) {
            const res = await reconcilePayment(declarationToReconcile.id);
            if (res.success) setDeclarationToReconcile(null);
            else setActionError(res.message || "Erreur de rapprochement");
        }
    };

    const handleConfirmReject = async () => {
        if (!declarationToReject) return;
        if (commentReject.length < 5) return setActionError("Le motif doit contenir au moins 5 caractères.");
        
        const res = await rejectPayment(declarationToReject.id, commentReject);
        if (res.success) {
            setDeclarationToReject(null);
            setCommentReject('');
            setActionError('');
        } else {
            setActionError(res.message || "Erreur lors du rejet");
        }
    };

    const handleConfirmReceipt = async () => {
        if (!declarationToReceipt) return;
        if (!receiptUrl.trim()) return setActionError("L'URL de la quittance est requise.");
        
        const res = await uploadReceipt(declarationToReceipt.id, receiptUrl);
        if (res.success) {
            setDeclarationToReceipt(null);
            setReceiptUrl('');
            setActionError('');
        } else {
            setActionError(res.message || "Erreur lors de l'association de la quittance");
        }
    };

    // Helper pour formater le mode de paiement
    const formatPaymentMode = (mode: string | null) => {
        if (!mode) return '-';
        if (mode === 'virement') return 'Virement en ligne';
        if (mode === 'ordre_virement') return 'Ordre de virement';
        if (mode === 'especes') return 'Espèces';
        if (mode === 'mobile_money') return 'Mobile Money';
        if (mode === 'orange_money') return 'Orange Money';
        return mode.replace('_', ' ');
    };

    return (
        <div className="space-y-6 relative animate-in fade-in duration-300">
            
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
                <div className="relative min-w-[250px] flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher (Num Employeur, Réf...)" 
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                {/* Filtre Banque */}
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

                {/* Filtre Mode de paiement (NOUVEAU) */}
                <select 
                    value={filters.payment_mode}
                    onChange={(e) => handleFilterChange('payment_mode', e.target.value)}
                    className="rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                    <option value="">Tous les modes</option>
                    <option value="virement">Virement</option>
                    <option value="especes">Espèces</option>
                    <option value="ordre_virement">Ordre de Virement</option>
                    <option value="mobile_money">Mobile Money (MTN)</option>
                    <option value="orange_money">Orange Money</option>
                </select>

                {/* Filtre Statut */}
                <select 
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                    <option value="">Tous les statuts</option>
                    <option value="submited">En attente Banque</option>
                    <option value="bank_validated">Validé Banque (À Rapprocher)</option>
                    <option value="cnps_validated">Rapproché (Terminé)</option>
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

            {/* TABLEAU DES DONNÉES */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Date / Réf</th>
                                <th className="px-6 py-4">Entreprise</th>
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
                                        Chargement des données...
                                    </td>
                                </tr>
                            ) : declarations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-500">
                                        Aucune déclaration ne correspond à vos critères.
                                    </td>
                                </tr>
                            ) : (
                                declarations.map((dec) => (
                                    <tr key={dec.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-semibold text-slate-900">
                                                {new Date(dec.period).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-xs font-mono text-slate-500 mt-0.5">
                                                {dec.reference || dec.mobile_reference || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{dec.company?.raison_sociale || 'Inconnue'}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                N° Emp: {dec.company?.numero_employeur || dec.employer_number || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{dec.bank?.bank_name || 'Direct (Mobile)'}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{formatPaymentMode(dec.payment_mode)}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                                            {Number(dec.amount).toLocaleString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <StatusBadge status={dec.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                                            
                                            {dec.proof_path && (
                                                <button 
                                                    onClick={() => downloadProof(dec.id, dec.reference || dec.mobile_reference || String(dec.id))}
                                                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                                                    title="Preuve entreprise/banque"
                                                >
                                                    <FileDown size={14} /> Preuve
                                                </button>
                                            )}
                                            
                                            <button className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                                                <Eye size={14} /> Voir
                                            </button>

                                            {/* Actions de Rapprochement / Rejet */}
                                            {dec.status === 'bank_validated' && (
                                                <>
                                                    <button 
                                                        onClick={() => { setDeclarationToReconcile(dec); setActionError(''); }}
                                                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200"
                                                    >
                                                        <CheckCircle size={14} /> Rapprocher
                                                    </button>
                                                    <button 
                                                        onClick={() => { setDeclarationToReject(dec); setActionError(''); }}
                                                        className="inline-flex items-center gap-1.5 rounded-md bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
                                                    >
                                                        <XCircle size={14} /> Rejeter
                                                    </button>
                                                </>
                                            )}

                                            {/* Action d'attachement de la quittance */}
                                            {dec.status === 'cnps_validated' && !dec.receipt_path && (
                                                <button 
                                                    onClick={() => { setDeclarationToReceipt(dec); setActionError(''); }}
                                                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                                                    title="Attacher la quittance officielle"
                                                >
                                                    <Link size={14} /> Lier Quittance
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
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

            {/* ======================================================== */}
            {/* MODALE DE RAPPROCHEMENT */}
            {/* ======================================================== */}
            {declarationToReconcile && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <div className="flex items-center gap-2 text-emerald-700">
                                <CheckCircle size={20} />
                                <h3 className="text-lg font-bold">Rapprocher le paiement</h3>
                            </div>
                            <button onClick={() => setDeclarationToReconcile(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4 rounded-lg bg-orange-50 p-4 text-sm text-orange-800 flex items-start gap-3 border border-orange-100">
                                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                                <p>En rapprochant ce paiement, vous confirmez que les fonds ont bien été reçus sur les comptes de la CNPS et les informations seront transmises au système central. Action définitive.</p>
                            </div>
                            
                            {actionError && <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">{actionError}</p>}

                            <div className="space-y-3 text-sm text-slate-600">
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="font-medium text-slate-500">Entreprise :</span>
                                    <span className="font-semibold text-slate-900">{declarationToReconcile.company?.raison_sociale}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="font-medium text-slate-500">Banque ayant validé :</span>
                                    <span className="font-semibold text-slate-900">{declarationToReconcile.bank?.bank_name || 'Direct (Mobile Money)'}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="font-medium text-slate-500">Référence :</span>
                                    <span className="font-mono text-slate-900">{declarationToReconcile.reference || declarationToReconcile.mobile_reference}</span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="font-medium text-slate-500">Montant à rapprocher :</span>
                                    <span className="text-lg font-bold text-emerald-600">{Number(declarationToReconcile.amount).toLocaleString('fr-FR')} FCFA</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4 border-t border-slate-100">
                            <button onClick={() => setDeclarationToReconcile(null)} disabled={isActionLoading} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50">Annuler</button>
                            <button onClick={handleConfirmReconciliation} disabled={isActionLoading} className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-70">
                                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                Confirmer le rapprochement
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODALE DE REJET */}
            {/* ======================================================== */}
            {declarationToReject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <div className="flex items-center gap-2 text-red-700">
                                <XCircle size={20} />
                                <h3 className="text-lg font-bold">Rejeter la déclaration</h3>
                            </div>
                            <button onClick={() => setDeclarationToReject(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-600 mb-4">Veuillez indiquer le motif du rejet (cette information sera transmise à l'entreprise pour correction).</p>
                            
                            {actionError && <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">{actionError}</p>}

                            <textarea 
                                rows={4}
                                value={commentReject}
                                onChange={(e) => setCommentReject(e.target.value)}
                                placeholder="Motif du rejet..."
                                className="w-full rounded-md border border-slate-300 p-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4 border-t border-slate-100">
                            <button onClick={() => setDeclarationToReject(null)} disabled={isActionLoading} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50">Annuler</button>
                            <button onClick={handleConfirmReject} disabled={isActionLoading} className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-70">
                                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                Rejeter la déclaration
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODALE D'ATTACHEMENT DE QUITTANCE */}
            {/* ======================================================== */}
            {declarationToReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <div className="flex items-center gap-2 text-blue-700">
                                <Link size={20} />
                                <h3 className="text-lg font-bold">Lier la quittance CNPS</h3>
                            </div>
                            <button onClick={() => setDeclarationToReceipt(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-600 mb-4">Entrez l'URL d'accès au document PDF de la quittance générée par le système CNPS.</p>
                            
                            {actionError && <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">{actionError}</p>}

                            <input 
                                type="url"
                                value={receiptUrl}
                                onChange={(e) => setReceiptUrl(e.target.value)}
                                placeholder="https://ftp.cnps.cm/quittances/..."
                                className="w-full rounded-md border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4 border-t border-slate-100">
                            <button onClick={() => setDeclarationToReceipt(null)} disabled={isActionLoading} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50">Annuler</button>
                            <button onClick={handleConfirmReceipt} disabled={isActionLoading} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70">
                                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <Link size={16} />}
                                Lier le document
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};