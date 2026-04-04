import  { useEffect, useState } from 'react';
import { 
    Search, Loader2, FileText, 
    CheckCircle, X, AlertCircle, Building2, Link as LinkIcon
} from 'lucide-react';
import { useSupervision } from './useSupervision';
import { Declaration } from '../../types';

export const Quittances = () => {
    const { 
        declarations, banks, isLoading, filters, handleFilterChange, 
        page, setPage, totalPages, fetchDeclarations, fetchBanks, 
        uploadReceipt, isActionLoading 
    } = useSupervision();

    const [uploadModalDec, setUploadModalDec] = useState<Declaration | null>(null);
    const [receiptUrl, setReceiptUrl] = useState<string>(''); 
    const [uploadError, setUploadError] = useState('');

    // 1. Au montage, on force le filtre et on charge les banques
    useEffect(() => {
        handleFilterChange('status', 'cnps_validated');
        if (banks.length === 0) fetchBanks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2. On exécute la requête (Sera déclenché automatiquement quand le filtre ci-dessus sera appliqué)
    useEffect(() => {
        fetchDeclarations();
    }, [fetchDeclarations]);

    const openUploadModal = (dec: Declaration) => {
        setUploadModalDec(dec);
        setReceiptUrl(dec.receipt_path || ''); // Pré-remplit si une URL existe déjà
        setUploadError('');
    };

    const handleUploadSubmit = async () => {
        if (!uploadModalDec) return;
        if (!receiptUrl.trim()) {
            setUploadError('Veuillez saisir l\'URL de la quittance.');
            return;
        }

        const result = await uploadReceipt(uploadModalDec.id, receiptUrl); 
        
        if (result.success) {
            setUploadModalDec(null);
        } else {
            setUploadError(result.message || "Erreur lors de l'envoi.");
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
        <div className="space-y-6 animate-in fade-in duration-300 relative">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestion des Quittances</h1>
                    <p className="text-sm text-slate-500 mt-1">Saisissez les URL des quittances officielles pour les paiements rapprochés.</p>
                </div>
            </div>

            {/* BARRE DE FILTRES (Simplifiée pour cette page) */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="relative min-w-[250px] flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher par référence, N° Employeur..." 
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                </div>

                <div className="relative min-w-[200px]">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                        value={filters.bank_id}
                        onChange={(e) => handleFilterChange('bank_id', e.target.value)}
                        className="w-full appearance-none rounded-lg border border-slate-300 py-2.5 pl-9 pr-8 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    >
                        <option value="">Toutes les banques</option>
                        {banks.map((bank) => (
                            <option key={bank.id} value={bank.id}>{bank.bank_name}</option>
                        ))}
                    </select>
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
                                <th className="px-6 py-4 text-right">Montant (FCFA)</th>
                                <th className="px-6 py-4 text-center">État de la Quittance</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-2" />
                                        Chargement des dossiers...
                                    </td>
                                </tr>
                            ) : declarations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-slate-500">
                                        <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                        Aucun paiement rapproché à afficher.
                                    </td>
                                </tr>
                            ) : (
                                declarations.map((dec) => {
                                    const hasReceipt = !!dec.receipt_path;

                                    return (
                                        <tr key={dec.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-semibold text-slate-900">{new Date(dec.period).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">Réf: {dec.reference || dec.mobile_reference || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{dec.company?.raison_sociale || 'N/A'}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">N° Emp: {dec.company?.numero_employeur || dec.employer_number || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                                                {Number(dec.amount).toLocaleString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                {hasReceipt ? (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                                                        Quittance liée
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                                                        En attente d'URL
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <button 
                                                    onClick={() => openUploadModal(dec)}
                                                    className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold shadow-sm transition-all ${
                                                        hasReceipt 
                                                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' 
                                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                                                    }`}
                                                >
                                                    {hasReceipt ? (
                                                        <>
                                                            <CheckCircle size={14} className="text-emerald-500" /> Modifier le lien
                                                        </>
                                                    ) : (
                                                        <>
                                                            <LinkIcon size={14} /> Lier la quittance
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
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
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm disabled:opacity-50 hover:bg-slate-50">Précédent</button>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm disabled:opacity-50 hover:bg-slate-50">Suivant</button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALE D'AJOUT DU LIEN DE LA QUITTANCE */}
            {uploadModalDec && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <LinkIcon size={20} className="text-blue-600" />
                                {uploadModalDec.receipt_path ? 'Modifier le lien CNPS' : 'Lier la quittance CNPS'}
                            </h3>
                            <button onClick={() => setUploadModalDec(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {uploadError && (
                                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2 border border-red-100">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <p>{uploadError}</p>
                                </div>
                            )}

                            <div className="mb-6 space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <p className="flex justify-between"><span className="font-medium">Entreprise :</span> <span className="font-semibold text-slate-900">{uploadModalDec.company?.raison_sociale}</span></p>
                                <p className="flex justify-between"><span className="font-medium">Mode :</span> <span className="font-semibold text-slate-900">{formatPaymentMode(uploadModalDec.payment_mode)}</span></p>
                                <p className="flex justify-between"><span className="font-medium">Montant :</span> <span className="font-bold text-emerald-600">{Number(uploadModalDec.amount).toLocaleString('fr-FR')} FCFA</span></p>
                                <p className="flex justify-between"><span className="font-medium">Référence :</span> <span className="font-mono text-slate-900">{uploadModalDec.reference || uploadModalDec.mobile_reference || '-'}</span></p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">URL du document (CNPS) <span className="text-red-500">*</span></label>
                                <input 
                                    type="url" 
                                    placeholder="Ex: https://ftp.cnps.cm/quittances/doc-123.pdf"
                                    value={receiptUrl}
                                    onChange={(e) => setReceiptUrl(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4 border-t border-slate-100">
                            <button 
                                onClick={() => setUploadModalDec(null)}
                                disabled={isActionLoading}
                                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleUploadSubmit}
                                disabled={isActionLoading || !receiptUrl.trim()}
                                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                {uploadModalDec.receipt_path ? 'Mettre à jour' : 'Enregistrer le lien'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};