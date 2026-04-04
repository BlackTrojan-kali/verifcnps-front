import { useEffect, useState } from 'react';
import { 
    Search, CheckCircle, XCircle, Download, Loader2, 
    FileText, Smartphone, Calendar, Filter, Eye, X, 
    PlusCircle, Building2, UploadCloud, AlertCircle
} from 'lucide-react';
import { useBankHistory } from './useBankHistory';
import { StatusBadge } from '../../components/ui/StatusBadge'; 
import { Declaration, Company } from '../../types';

export const BankHistory = () => {
    const { 
        declarations, isLoading, isActionLoading,
        page, setPage, totalPages,
        filters, handleFilterChange, resetFilters,
        fetchDeclarations, validatePayment, rejectPayment, downloadProof,
        searchCompany, createCounterDeposit
    } = useBankHistory();

    // ==========================================
    // ÉTATS DES MODALES (Validation / Rejet)
    // ==========================================
    const [selectedDeclaration, setSelectedDeclaration] = useState<Declaration | null>(null);
    const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    
    const [reference, setReference] = useState('');
    const [orderReference, setOrderReference] = useState('');
    const [commentReject, setCommentReject] = useState('');
    const [actionError, setActionError] = useState('');

    // ==========================================
    // ÉTATS DE LA MODALE "SAISIE AU GUICHET"
    // ==========================================
    const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
    const [searchEmpNumber, setSearchEmpNumber] = useState('');
    const [foundCompany, setFoundCompany] = useState<Company | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [counterError, setCounterError] = useState('');
    
    // Formulaire du guichet
    const [counterData, setCounterData] = useState({
        amount: '',
        payment_mode: 'especes',
        reference: '',
        order_reference: '',
        period: new Date().toISOString().split('T')[0] // Date du jour par défaut
    });
    const [counterFile, setCounterFile] = useState<File | null>(null);

    useEffect(() => {
        fetchDeclarations();
    }, [fetchDeclarations]);

    const formatPaymentMode = (mode: string | null) => {
        if (!mode) return '-';
        if (mode === 'virement') return 'Virement en ligne';
        if (mode === 'ordre_virement') return 'Ordre de virement';
        if (mode === 'especes') return 'Espèces (Guichet)';
        if (mode === 'mobile_money') return 'Mobile Money';
        if (mode === 'orange_money') return 'Orange Money';
        return mode;
    };

    // --- GESTION VALIDATION / REJET ---
    const openValidateModal = (dec: Declaration) => {
        setSelectedDeclaration(dec);
        setReference(dec.reference || '');
        setOrderReference(dec.order_reference || '');
        setActionError('');
        setIsValidateModalOpen(true);
    };

    const openRejectModal = (dec: Declaration) => {
        setSelectedDeclaration(dec);
        setCommentReject('');
        setActionError('');
        setIsRejectModalOpen(true);
    };

    const handleValidateSubmit = async () => {
        if (!selectedDeclaration) return;
        if (!reference.trim()) return setActionError("La référence bancaire est obligatoire.");
        if (selectedDeclaration.payment_mode === 'ordre_virement' && !orderReference.trim()) {
            return setActionError("La référence de l'ordre de virement est obligatoire.");
        }

        const result = await validatePayment(selectedDeclaration.id, reference, orderReference);
        if (result.success) setIsValidateModalOpen(false);
        else setActionError(result.message);
    };

    const handleRejectSubmit = async () => {
        if (!selectedDeclaration) return;
        if (commentReject.length < 5) return setActionError("Le motif de rejet doit contenir au moins 5 caractères.");

        const result = await rejectPayment(selectedDeclaration.id, commentReject);
        if (result.success) setIsRejectModalOpen(false);
        else setActionError(result.message);
    };

    // --- GESTION SAISIE AU GUICHET ---
    const openCounterModal = () => {
        setSearchEmpNumber('');
        setFoundCompany(null);
        setCounterError('');
        setCounterFile(null);
        setCounterData({
            amount: '', payment_mode: 'especes', reference: '', order_reference: '', period: new Date().toISOString().split('T')[0]
        });
        setIsCounterModalOpen(true);
    };

    const handleSearchCompany = async () => {
        if (!searchEmpNumber.trim()) return;
        setIsSearching(true);
        setCounterError('');
        const result = await searchCompany(searchEmpNumber);
        
        if (result.success && result.company) {
            setFoundCompany(result.company);
        } else {
            setFoundCompany(null);
            setCounterError(result.message || "Entreprise introuvable avec ce Numéro Employeur.");
        }
        setIsSearching(false);
    };

    const handleCounterSubmit = async () => {
        if (!foundCompany) return setCounterError("Veuillez d'abord rechercher une entreprise.");
        if (!counterData.amount) return setCounterError("Le montant est obligatoire.");
        if (!counterData.reference) return setCounterError("La référence du reçu est obligatoire.");
        if (counterData.payment_mode === 'ordre_virement' && !counterData.order_reference) {
            return setCounterError("La référence de l'ordre de virement est obligatoire.");
        }

        const payload = {
            company_id: foundCompany.id,
            amount: counterData.amount,
            payment_mode: counterData.payment_mode,
            reference: counterData.reference,
            order_reference: counterData.payment_mode === 'ordre_virement' ? counterData.order_reference : null,
            period: counterData.period,
            proof_pdf: counterFile
        };

        const result = await createCounterDeposit(payload);
        if (result.success) {
            setIsCounterModalOpen(false);
        } else {
            setCounterError(result.message);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* EN-TÊTE ET BOUTON NOUVEAU DÉPÔT */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Historique des Encaissements</h1>
                    <p className="text-sm text-slate-500 mt-1">Gérez, validez ou rejetez les paiements initiés par les entreprises.</p>
                </div>
                <button 
                    onClick={openCounterModal}
                    className="flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
                >
                    <PlusCircle size={18} />
                    Saisie au guichet
                </button>
            </div>

            {/* BARRE DE FILTRES */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                
                <div className="relative min-w-[180px] flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Réf. Bancaire..." 
                        value={filters.reference}
                        onChange={(e) => handleFilterChange('reference', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                </div>

                <div className="relative min-w-[180px] flex-1">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Réf. Mobile..." 
                        value={filters.mobile_reference}
                        onChange={(e) => handleFilterChange('mobile_reference', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                </div>

                <div className="relative min-w-[150px]">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="month" 
                        value={filters.period?.substring(0, 7) || ''}
                        onChange={(e) => handleFilterChange('period', `${e.target.value}-01`)}
                        className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-4 text-sm text-slate-600 focus:border-blue-600 focus:outline-none"
                        title="Période de cotisation"
                    />
                </div>

                <div className="relative min-w-[160px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full appearance-none rounded-lg border border-slate-300 py-2 pl-9 pr-8 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="submited">En attente (À traiter)</option>
                        <option value="bank_validated">Validés (Banque)</option>
                        <option value="cnps_validated">Rapprochés (CNPS)</option>
                        <option value="rejected">Rejetés</option>
                    </select>
                </div>

                <button 
                    onClick={resetFilters}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2"
                >
                    Réinitialiser
                </button>
            </div>

            {/* TABLEAU DES DONNÉES */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Date / Période</th>
                                <th className="px-6 py-4">Entreprise</th>
                                <th className="px-6 py-4">Références</th>
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
                                        Chargement des encaissements...
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
                                                {new Date(dec.period).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Initié le {new Date(dec.created_at).toLocaleDateString('fr-FR')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{dec.company?.raison_sociale || 'Inconnue'}</div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                N° Emp: {dec.company?.numero_employeur || dec.employer_number || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-slate-700">{dec.reference || dec.mobile_reference || '-'}</div>
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
                                                    onClick={() => downloadProof(dec.id, dec.reference)}
                                                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                                                    title="Voir la preuve de paiement"
                                                >
                                                    <Download size={14} /> Preuve
                                                </button>
                                            )}

                                            {dec.status === 'submited' && (
                                                <>
                                                    <button 
                                                        onClick={() => openValidateModal(dec)}
                                                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                                                    >
                                                        <CheckCircle size={14} /> Valider
                                                    </button>
                                                    <button 
                                                        onClick={() => openRejectModal(dec)}
                                                        className="inline-flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                                                    >
                                                        <XCircle size={14} /> Rejeter
                                                    </button>
                                                </>
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
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3">
                        <span className="text-sm text-slate-500">
                            Page <span className="font-bold text-slate-900">{page}</span> sur <span className="font-bold text-slate-900">{totalPages}</span>
                        </span>
                        <div className="flex gap-2">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm disabled:opacity-50 hover:bg-slate-50">Précédent</button>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium shadow-sm disabled:opacity-50 hover:bg-slate-50">Suivant</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ======================================================== */}
            {/* MODALE : SAISIE AU GUICHET */}
            {/* ======================================================== */}
            {isCounterModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <PlusCircle className="text-blue-600" size={20} /> Saisie d'un dépôt au guichet
                            </h3>
                            <button onClick={() => setIsCounterModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-1"><X size={20} /></button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {counterError && (
                                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex items-start gap-2">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <p>{counterError}</p>
                                </div>
                            )}

                            {/* ÉTAPE 1 : Recherche de l'entreprise */}
                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Rechercher l'entreprise par Numéro Employeur</label>
                                <div className="flex gap-3">
                                    <input 
                                        type="text" 
                                        value={searchEmpNumber} 
                                        onChange={(e) => setSearchEmpNumber(e.target.value)}
                                        placeholder="Ex: M123456789"
                                        className="flex-1 rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                    <button 
                                        onClick={handleSearchCompany}
                                        disabled={isSearching || !searchEmpNumber}
                                        className="bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-900 disabled:opacity-50 transition-colors flex items-center gap-2"
                                    >
                                        {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                        Chercher
                                    </button>
                                </div>

                                {foundCompany && (
                                    <div className="mt-4 flex items-center gap-3 p-3 bg-white border border-emerald-200 rounded-lg text-emerald-800">
                                        <CheckCircle size={20} className="text-emerald-500" />
                                        <div>
                                            <p className="font-bold">{foundCompany.raison_sociale}</p>
                                            <p className="text-xs font-mono">N° Employeur: {foundCompany.numero_employeur}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ÉTAPE 2 : Formulaire de dépôt (Visible uniquement si entreprise trouvée) */}
                            {foundCompany && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-300">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Montant déposé (FCFA) <span className="text-red-500">*</span></label>
                                        <input 
                                            type="number" 
                                            value={counterData.amount} 
                                            onChange={e => setCounterData({...counterData, amount: e.target.value})}
                                            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                            min="0"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Mode de paiement <span className="text-red-500">*</span></label>
                                        <select 
                                            value={counterData.payment_mode} 
                                            onChange={e => setCounterData({...counterData, payment_mode: e.target.value})}
                                            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                        >
                                            <option value="especes">Espèces</option>
                                            <option value="ordre_virement">Ordre de Virement</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Référence du reçu de caisse <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            value={counterData.reference} 
                                            onChange={e => setCounterData({...counterData, reference: e.target.value})}
                                            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Période concernée <span className="text-red-500">*</span></label>
                                        <input 
                                            type="date" 
                                            value={counterData.period} 
                                            onChange={e => setCounterData({...counterData, period: e.target.value})}
                                            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>

                                    {counterData.payment_mode === 'ordre_virement' && (
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Référence de l'ordre de virement <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                value={counterData.order_reference} 
                                                onChange={e => setCounterData({...counterData, order_reference: e.target.value})}
                                                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    )}

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Scanner ou attacher la preuve (PDF)</label>
                                        <div className="mt-1 flex justify-center rounded-lg border border-dashed border-slate-300 px-6 py-6 hover:bg-slate-50 transition-colors">
                                            <div className="text-center">
                                                <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                                                <div className="mt-2 flex text-sm text-slate-600 justify-center">
                                                    <label className="relative cursor-pointer rounded-md bg-transparent font-semibold text-blue-600 hover:text-blue-500">
                                                        <span>Sélectionner le fichier</span>
                                                        <input type="file" className="sr-only" accept=".pdf" onChange={(e) => setCounterFile(e.target.files?.[0] || null)} />
                                                    </label>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {counterFile ? <span className="font-bold text-blue-600">{counterFile.name}</span> : 'Optionnel, max 5MB'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end gap-3 sticky bottom-0">
                            <button onClick={() => setIsCounterModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">Annuler</button>
                            <button 
                                onClick={handleCounterSubmit} 
                                disabled={isActionLoading || !foundCompany}
                                className="flex items-center gap-2 rounded-lg bg-blue-700 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-800 disabled:opacity-50"
                            >
                                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                Enregistrer le dépôt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODALE DE VALIDATION (Virements en ligne) */}
            {/* ======================================================== */}
            {isValidateModalOpen && selectedDeclaration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                                <CheckCircle size={20} /> Valider l'encaissement
                            </h3>
                            <button onClick={() => setIsValidateModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 mb-2">
                                Vous êtes sur le point de confirmer la réception de <strong className="text-slate-900">{Number(selectedDeclaration.amount).toLocaleString('fr-FR')} FCFA</strong> de la part de <strong className="text-slate-900">{selectedDeclaration.company?.raison_sociale}</strong>.
                            </div>
                            
                            {actionError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">{actionError}</p>}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Référence de la transaction bancaire <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={reference} 
                                    onChange={e => setReference(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                    placeholder="Ex: TR-987654321"
                                />
                            </div>

                            {selectedDeclaration.payment_mode === 'ordre_virement' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Référence de l'ordre de virement <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={orderReference} 
                                        onChange={e => setOrderReference(e.target.value)}
                                        className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                                        placeholder="Ex: OV-123456"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={() => setIsValidateModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">Annuler</button>
                            <button 
                                onClick={handleValidateSubmit} 
                                disabled={isActionLoading}
                                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-70"
                            >
                                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                Confirmer la validation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODALE DE REJET */}
            {/* ======================================================== */}
            {isRejectModalOpen && selectedDeclaration && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                <XCircle size={20} /> Rejeter la déclaration
                            </h3>
                            <button onClick={() => setIsRejectModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">Veuillez indiquer à l'entreprise la raison pour laquelle ce paiement est rejeté (ex: fichier illisible, montant incorrect...).</p>
                            
                            {actionError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">{actionError}</p>}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Motif du rejet <span className="text-red-500">*</span></label>
                                <textarea 
                                    rows={4}
                                    value={commentReject} 
                                    onChange={e => setCommentReject(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none"
                                    placeholder="Saisissez vos explications ici..."
                                />
                            </div>
                        </div>
                        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={() => setIsRejectModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">Annuler</button>
                            <button 
                                onClick={handleRejectSubmit} 
                                disabled={isActionLoading}
                                className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-70"
                            >
                                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                Confirmer le rejet
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};