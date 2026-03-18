import React, { useEffect, useState } from 'react';
import { 
    Search, Landmark, FileDown, Eye, Loader2, 
    RefreshCw, AlertCircle, Plus, CheckCircle, XCircle, Building2, UploadCloud,
    X
} from 'lucide-react';
import { useBankHistory } from './useBankHistory';
import { Declaration } from '../../types';
import useAuthStore from '../../store/useAuthStore';

export const BankHistory = () => {
    const { user } = useAuthStore();
    const bankName = user?.bank?.bank_name || "Établissement Bancaire";

    const { 
        declarations, isLoading, fetchDeclarations, page, setPage, totalPages,
        filters, handleFilterChange, 
        validatePayment, rejectPayment, isActionLoading,
        searchCompany, createCounterDeposit, updateCounterDeposit,
        downloadProof // <-- 1. ON IMPORTE LA NOUVELLE FONCTION ICI
    } = useBankHistory();

    // =========================================================
    // ÉTATS POUR L'ACTION SUR DÉPÔTS EN LIGNE (Valider/Rejeter)
    // =========================================================
    const [actionModal, setActionModal] = useState<{ declaration: Declaration } | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<'bank_validated' | 'rejected'>('bank_validated');
    const [actionReference, setActionReference] = useState('');
    const [actionOrderRef, setActionOrderRef] = useState('');
    const [actionComment, setActionComment] = useState('');
    const [actionError, setActionError] = useState('');

    // =========================================================
    // ÉTATS POUR LA SAISIE GUICHET (Nouvelle saisie ou Modif)
    // =========================================================
    const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
    const [editingDeposit, setEditingDeposit] = useState<Declaration | null>(null);
    
    const [niuSearch, setNiuSearch] = useState('');
    const [isSearchingNiu, setIsSearchingNiu] = useState(false);
    const [foundCompany, setFoundCompany] = useState<{ id: number, raison_sociale: string, niu: string } | null>(null);
    
    const [counterForm, setCounterForm] = useState({
        payment_mode: 'especes',
        amount: '',
        period: '',
        reference: '',
        order_reference: '',
        file: null as File | null
    });
    const [counterError, setCounterError] = useState('');

    useEffect(() => {
        fetchDeclarations();
    }, [fetchDeclarations]);

    // --- Fonctions pour les actions en ligne (Valider/Rejeter) ---
    const openStatusModal = (dec: Declaration) => {
        setActionModal({ declaration: dec });
        setSelectedStatus('bank_validated');
        setActionReference(dec.reference || '');
        setActionOrderRef('');
        setActionComment('');
        setActionError('');
    };

    const handleStatusSubmit = async () => {
        if (!actionModal) return;
        setActionError('');
        let result;
        if (selectedStatus === 'bank_validated') {
            if (!actionReference) return setActionError('La référence bancaire est requise pour valider.');
            if (actionModal.declaration.payment_mode === 'ordre_virement' && !actionOrderRef) {
                return setActionError("La référence de l'ordre de virement est requise.");
            }
            result = await validatePayment(actionModal.declaration.id, actionReference, actionOrderRef);
        } else {
            if (!actionComment) return setActionError('Veuillez expliquer le motif du rejet.');
            result = await rejectPayment(actionModal.declaration.id, actionComment);
        }

        if (result.success) setActionModal(null);
        else setActionError(result.message);
    };

    // --- Fonctions pour la saisie au guichet ---
    const openCounterModal = (dec?: Declaration) => {
        setCounterError('');
        if (dec) {
            setEditingDeposit(dec);
            setNiuSearch(dec.company?.niu || '');
            setFoundCompany(dec.company ? { id: dec.company.id, raison_sociale: dec.company.raison_sociale, niu: dec.company.niu } : null);
            setCounterForm({
                payment_mode: dec.payment_mode || 'especes',
                amount: dec.amount?.toString() || '',
                period: dec.period ? new Date(dec.period).toISOString().split('T')[0] : '',
                reference: dec.reference || '',
                order_reference: dec.order_reference || '',
                file: null
            });
        } else {
            setEditingDeposit(null);
            setNiuSearch('');
            setFoundCompany(null);
            setCounterForm({ payment_mode: 'especes', amount: '', period: '', reference: '', order_reference: '', file: null });
        }
        setIsCounterModalOpen(true);
    };

    const handleSearchNiu = async () => {
        if (!niuSearch) return;
        setIsSearchingNiu(true);
        setCounterError('');
        const result = await searchCompany(niuSearch);
        if (result.success) {
            setFoundCompany(result.company);
        } else {
            setFoundCompany(null);
            setCounterError(result.message);
        }
        setIsSearchingNiu(false);
    };

    const handleCounterSubmit = async () => {
        if (!foundCompany) return setCounterError("Veuillez d'abord rechercher et valider une entreprise.");
        if (!counterForm.amount || !counterForm.period || !counterForm.reference) {
            return setCounterError("Veuillez remplir tous les champs obligatoires.");
        }
        if (counterForm.payment_mode === 'ordre_virement' && !counterForm.order_reference) {
            return setCounterError("La référence de l'ordre de virement est requise.");
        }

        const payload = { ...counterForm, company_id: foundCompany.id };
        let result;

        if (editingDeposit) {
            result = await updateCounterDeposit(editingDeposit.id, payload);
        } else {
            result = await createCounterDeposit(payload);
        }

        if (result.success) setIsCounterModalOpen(false);
        else setCounterError(result.message);
    };

    // --- Helpers d'affichage ---
    const formatStatus = (status: string) => {
        switch (status) {
            case 'bank_validated': return <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Transféré CNPS</span>;
            case 'cnps_validated': return <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Rapproché</span>;
            case 'submited': return <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">En attente</span>;
            case 'rejected': return <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Rejeté</span>;
            default: return <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{status}</span>;
        }
    };

    const formatPaymentMode = (mode: string | null) => {
        if (mode === 'virement') return <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">Virement</span>;
        if (mode === 'especes') return <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">Espèces (Guichet)</span>;
        if (mode === 'ordre_virement') return <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">Ordre de Virement</span>;
        return <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 uppercase">{mode?.replace('_', ' ')}</span>;
    };

    // Permet de savoir si un dépôt a été fait au guichet et s'il est modifiable
    const isCounterDepositModifiable = (dec: Declaration) => {
        return ['especes', 'ordre_virement'].includes(dec.payment_mode || '') && dec.status !== 'cnps_validated';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
                        <Landmark size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{bankName}</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">Historique et gestion des dépôts CNPS des entreprises.</p>
                    </div>
                </div>
                <button 
                    onClick={() => openCounterModal()}
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-800"
                >
                    <Plus size={18} />
                    Saisie au Guichet
                </button>
            </div>

            {/* BARRE DE FILTRES (inchangée) */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="relative min-w-[250px] flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" placeholder="Rechercher (Réf. Banque ou NIU)..." 
                        value={filters.reference} onChange={(e) => handleFilterChange('reference', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-600 focus:outline-none"
                    />
                </div>
                <div className="relative min-w-[180px]">
                    <select 
                        value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 py-2 pl-4 pr-8 text-sm focus:border-blue-600 focus:outline-none bg-white"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="submited">En attente (À traiter)</option>
                        <option value="bank_validated">Transféré CNPS</option>
                        <option value="rejected">Rejeté</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <input type="date" value={filters.start_date} onChange={(e) => handleFilterChange('start_date', e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 focus:border-blue-600 focus:outline-none" />
                    <span className="text-slate-400 font-medium">à</span>
                    <input type="date" value={filters.end_date} onChange={(e) => handleFilterChange('end_date', e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 focus:border-blue-600 focus:outline-none" />
                </div>
            </div>

            {/* TABLEAU */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Date Transaction</th>
                                <th className="px-6 py-4">Référence Banque</th>
                                <th className="px-6 py-4">NIU Entreprise</th>
                                <th className="px-6 py-4 text-center">Type de Dépôt</th>
                                <th className="px-6 py-4 text-right">Montant (FCFA)</th>
                                <th className="px-6 py-4 text-center">Statut</th>
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
                                        <td className="px-6 py-4 text-slate-500 font-medium">{dec.reference}</td>
                                        <td className="px-6 py-4"><span className="font-semibold text-blue-600">{dec.company?.niu || 'N/A'}</span></td>
                                        <td className="px-6 py-4 text-center">{formatPaymentMode(dec.payment_mode)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900 whitespace-nowrap">{Number(dec.amount).toLocaleString('fr-FR')}</td>
                                        <td className="px-6 py-4 text-center">{formatStatus(dec.status)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {/* 2. ON ATTACHE LA FONCTION AU BOUTON DE TÉLÉCHARGEMENT ICI */}
                                                <button 
                                                    onClick={() => downloadProof(dec.id, dec.reference)}
                                                    className="text-slate-400 hover:text-blue-600 transition-colors" 
                                                    title="Télécharger la preuve"
                                                >
                                                    <FileDown size={18} />
                                                </button>
                                                
                                                <div className="flex flex-col items-center cursor-pointer group text-slate-400 hover:text-blue-600 transition-colors" title="Voir les détails">
                                                    <Eye size={16} className="mb-0.5" />
                                                </div>
                                                
                                                {/* BOUTON CHANGER L'ÉTAT (Pour les virements en ligne) */}
                                                {dec.status === 'submited' && (
                                                    <button onClick={() => openStatusModal(dec)} className="flex items-center gap-1.5 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700 ml-2">
                                                        Valider / Rejeter
                                                    </button>
                                                )}

                                                {/* BOUTON MODIFIER (Pour les saisies guichet) */}
                                                {isCounterDepositModifiable(dec) && (
                                                    <button onClick={() => openCounterModal(dec)} className="flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-100 ml-2">
                                                        <RefreshCw size={14} /> Modifier
                                                    </button>
                                                )}
                                            </div>
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
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm disabled:opacity-50 hover:bg-slate-50">Précédent</button>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm disabled:opacity-50 hover:bg-slate-50">Suivant</button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALE : SAISIE AU GUICHET */}
            {isCounterModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
                        <div className="border-b border-slate-100 bg-slate-50 px-8 py-5 flex items-center justify-between sticky top-0 z-10">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Landmark size={24} className="text-blue-600" /> 
                                {editingDeposit ? 'Modifier le dépôt guichet' : 'Nouvelle saisie au guichet'}
                            </h3>
                            <button onClick={() => setIsCounterModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white rounded-full p-1 shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8">
                            {counterError && (
                                <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex items-start gap-2">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <span>{counterError}</span>
                                </div>
                            )}

                            {/* RECHERCHE ENTREPRISE */}
                            <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                                <h4 className="text-sm font-bold text-slate-900 mb-3">1. Identification de l'entreprise</h4>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text" placeholder="Entrez le NIU de l'entreprise..." 
                                            value={niuSearch} onChange={(e) => setNiuSearch(e.target.value)}
                                            disabled={!!editingDeposit} // On ne modifie pas le NIU d'un dépôt existant
                                            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm focus:border-blue-600 focus:outline-none uppercase font-mono disabled:bg-slate-100"
                                        />
                                    </div>
                                    {!editingDeposit && (
                                        <button 
                                            onClick={handleSearchNiu} disabled={isSearchingNiu || !niuSearch}
                                            className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-slate-700 disabled:opacity-70 flex items-center gap-2"
                                        >
                                            {isSearchingNiu ? <Loader2 size={16} className="animate-spin" /> : 'Rechercher'}
                                        </button>
                                    )}
                                </div>
                                {foundCompany && (
                                    <div className="mt-4 flex items-center gap-3 text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg animate-in slide-in-from-top-2">
                                        <Building2 size={20} />
                                        <div>
                                            <div className="font-bold">{foundCompany.raison_sociale}</div>
                                            <div className="text-xs opacity-80">NIU: {foundCompany.niu}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* FORMULAIRE DE DÉPÔT (Actif seulement si entreprise trouvée) */}
                            <div className={`space-y-6 transition-opacity duration-300 ${foundCompany ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                <h4 className="text-sm font-bold text-slate-900 border-b pb-2">2. Détails de l'opération</h4>
                                
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Mode de dépôt <span className="text-red-500">*</span></label>
                                        <select 
                                            value={counterForm.payment_mode} 
                                            onChange={(e) => setCounterForm({...counterForm, payment_mode: e.target.value})}
                                            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-600 focus:outline-none bg-white"
                                        >
                                            <option value="especes">Versement Espèces</option>
                                            <option value="ordre_virement">Ordre de Virement (Remise Chèque/Papier)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Montant déposé (FCFA) <span className="text-red-500">*</span></label>
                                        <input 
                                            type="number" min="1" placeholder="Ex: 1500000"
                                            value={counterForm.amount} onChange={(e) => setCounterForm({...counterForm, amount: e.target.value})}
                                            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-600 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Période de cotisation <span className="text-red-500">*</span></label>
                                        <input 
                                            type="date" 
                                            value={counterForm.period} onChange={(e) => setCounterForm({...counterForm, period: e.target.value})}
                                            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-600 focus:outline-none text-slate-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Référence du bordereau <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" placeholder="Générée ou saisie..."
                                            value={counterForm.reference} onChange={(e) => setCounterForm({...counterForm, reference: e.target.value})}
                                            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-600 focus:outline-none uppercase font-mono"
                                        />
                                    </div>
                                </div>

                                {counterForm.payment_mode === 'ordre_virement' && (
                                    <div className="animate-in slide-in-from-bottom-2">
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Référence de l'Ordre de Virement / Chèque <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" placeholder="Ex: CHQ-998877"
                                            value={counterForm.order_reference} onChange={(e) => setCounterForm({...counterForm, order_reference: e.target.value})}
                                            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-600 focus:outline-none uppercase font-mono"
                                        />
                                    </div>
                                )}

                                {/* UPLOAD BORDEREAU */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Scan du bordereau (PDF) <span className="text-slate-400 font-normal ml-1">(Optionnel)</span></label>
                                    <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 transition-colors hover:bg-slate-100">
                                        <UploadCloud size={28} className="text-slate-400 mb-2" />
                                        <span className="text-sm font-semibold text-slate-600">
                                            {editingDeposit ? 'Remplacer le scan actuel...' : 'Déposez le scan ici'}
                                        </span>
                                        <input 
                                            type="file" accept=".pdf"
                                            onChange={(e) => setCounterForm({...counterForm, file: e.target.files ? e.target.files[0] : null})}
                                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                        />
                                        {counterForm.file && (
                                            <div className="mt-3 rounded bg-white px-3 py-1.5 text-xs font-semibold text-emerald-600 shadow-sm border border-emerald-100">
                                                ✓ {counterForm.file.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 bg-slate-50 px-8 py-5 border-t border-slate-100">
                            <button onClick={() => setIsCounterModalOpen(false)} disabled={isActionLoading} className="rounded-lg px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200">
                                Annuler
                            </button>
                            <button 
                                onClick={handleCounterSubmit} disabled={isActionLoading || !foundCompany} 
                                className="flex items-center gap-2 rounded-lg bg-blue-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-800 disabled:opacity-50"
                            >
                                {isActionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                {editingDeposit ? 'Enregistrer les modifications' : 'Valider le dépôt au guichet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALE UNIFIÉE DE CHANGEMENT DE STATUT (Valider/Rejeter paiement en ligne) */}
            {actionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <RefreshCw size={20} className="text-blue-600" /> Traiter le paiement en ligne
                            </h3>
                        </div>

                        <div className="p-6">
                            {actionError && (
                                <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200 flex items-start gap-2">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{actionError}</span>
                                </div>
                            )}

                            <div className="mb-6 space-y-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div className="flex justify-between"><span className="font-medium">Entreprise :</span> <span className="font-semibold text-slate-900">{actionModal.declaration.company?.raison_sociale}</span></div>
                                <div className="flex justify-between"><span className="font-medium">Montant :</span> <span className="font-bold text-slate-900">{Number(actionModal.declaration.amount).toLocaleString('fr-FR')} FCFA</span></div>
                                <div className="flex justify-between"><span className="font-medium">Mode :</span> <span className="uppercase text-slate-900">{actionModal.declaration.payment_mode?.replace('_', ' ')}</span></div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Nouveau statut du paiement</label>
                                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as 'bank_validated' | 'rejected')} className={`w-full rounded-lg border p-3 text-sm font-medium focus:outline-none focus:ring-1 ${selectedStatus === 'bank_validated' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-red-300 bg-red-50 text-red-800'}`}>
                                        <option value="bank_validated">✓ Valider (Confirmer la réception)</option>
                                        <option value="rejected">✕ Rejeter (Annuler le dépôt)</option>
                                    </select>
                                </div>

                                {selectedStatus === 'bank_validated' ? (
                                    <div className="space-y-4 animate-in slide-in-from-bottom-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">Référence de transaction (Banque) <span className="text-red-500">*</span></label>
                                            <input type="text" value={actionReference} onChange={(e) => setActionReference(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none font-mono uppercase" />
                                        </div>
                                        {actionModal.declaration.payment_mode === 'ordre_virement' && (
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-slate-700">Référence Ordre de Virement <span className="text-red-500">*</span></label>
                                                <input type="text" value={actionOrderRef} onChange={(e) => setActionOrderRef(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none font-mono uppercase" />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="animate-in slide-in-from-bottom-2">
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Motif du rejet <span className="text-red-500">*</span></label>
                                        <textarea value={actionComment} onChange={(e) => setActionComment(e.target.value)} rows={3} placeholder="Expliquez brièvement pourquoi ce dépôt est rejeté..." className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"></textarea>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4 border-t border-slate-100">
                            <button onClick={() => setActionModal(null)} disabled={isActionLoading} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200">Annuler</button>
                            <button onClick={handleStatusSubmit} disabled={isActionLoading} className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-70 transition-colors ${selectedStatus === 'bank_validated' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : "Confirmer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};