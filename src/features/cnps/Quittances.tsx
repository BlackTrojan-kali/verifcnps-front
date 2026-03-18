import React, { useEffect, useState } from 'react';
import { 
    Search, Loader2, UploadCloud, FileText, 
    CheckCircle, X, AlertCircle, Building2 
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
        setSelectedFile(null);
        setUploadError('');
    };

    const handleUploadSubmit = async () => {
        if (!uploadModalDec) return;
        if (!selectedFile) {
            setUploadError('Veuillez sélectionner un fichier PDF.');
            return;
        }

        const result = await uploadReceipt(uploadModalDec.id, selectedFile);
        
        if (result.success) {
            setUploadModalDec(null);
        } else {
            setUploadError(result.message || "Erreur lors de l'envoi.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 relative">
            
            {/* EN-TÊTE */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestion des Quittances</h1>
                    <p className="text-sm text-slate-500 mt-1">Générez et uploadez les quittances officielles pour les paiements rapprochés.</p>
                </div>
            </div>

            {/* BARRE DE FILTRES (Simplifiée pour cette page) */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="relative min-w-[250px] flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher par référence, NIU..." 
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
                                <th className="px-6 py-4 text-center">État du dossier</th>
                                <th className="px-6 py-4 text-right">Action Quittance</th>
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
                                                <div className="text-xs text-slate-500 font-mono mt-0.5">Réf: {dec.reference}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{dec.company?.raison_sociale || 'N/A'}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">NIU: {dec.company?.niu || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                                                {Number(dec.amount).toLocaleString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                                    Rapproché le {new Date(dec.updated_at).toLocaleDateString('fr-FR')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <button 
                                                    onClick={() => openUploadModal(dec)}
                                                    className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold shadow-sm transition-all ${
                                                        hasReceipt 
                                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200' 
                                                        : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 hover:border-red-300'
                                                    }`}
                                                >
                                                    {hasReceipt ? (
                                                        <>
                                                            <CheckCircle size={14} /> Quittance délivrée
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UploadCloud size={14} /> Joindre la quittance
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

            {/* MODALE D'UPLOAD DE LA QUITTANCE */}
            {uploadModalDec && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <FileText size={20} className="text-blue-600" />
                                Délivrer la quittance
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

                            <div className="mb-5 space-y-2 text-sm text-slate-600">
                                <p><span className="font-medium">Entreprise :</span> {uploadModalDec.company?.raison_sociale}</p>
                                <p><span className="font-medium">Montant rapproché :</span> <span className="font-bold text-emerald-600">{Number(uploadModalDec.amount).toLocaleString('fr-FR')} FCFA</span></p>
                                <p><span className="font-medium">Référence :</span> <span className="font-mono">{uploadModalDec.reference}</span></p>
                            </div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">Document PDF généré <span className="text-red-500">*</span></label>
                            <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 transition-colors hover:bg-blue-50">
                                <UploadCloud size={36} className="text-blue-500 mb-3" />
                                <span className="text-sm font-bold text-slate-700 text-center">
                                    {!!uploadModalDec.receipt_path ? 'Remplacer la quittance actuelle' : 'Déposez la quittance PDF ici'}
                                </span>
                                <span className="text-xs text-slate-500 mt-1">ou cliquez pour parcourir</span>
                                <input 
                                    type="file" 
                                    accept=".pdf"
                                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                />
                                {selectedFile && (
                                    <div className="mt-4 w-full truncate rounded bg-white px-3 py-2 text-xs font-semibold text-emerald-600 shadow-sm border border-emerald-100 flex items-center justify-center gap-2">
                                        <CheckCircle size={16} className="shrink-0" /> <span className="truncate">{selectedFile.name}</span>
                                    </div>
                                )}
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
                                disabled={isActionLoading || !selectedFile}
                                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                                Envoyer à l'entreprise
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};