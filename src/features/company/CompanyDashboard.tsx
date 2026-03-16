import React, { useEffect, useState } from 'react';
import { 
    CreditCard, Banknote, Smartphone, FileText, 
    CheckCircle2, Circle, UploadCloud, Loader2, 
    X, Download, AlertCircle, RefreshCw 
} from 'lucide-react';
import { useCompanyDashboard } from './useCompanyDashboard';
import { Declaration } from '../../types';

export const CompanyDashboard = () => {
    const { 
        declarations, activeDeclaration, banks, isLoading, isSubmitting, 
        fetchDeclarations, fetchBanks, initiatePayment, editPayment 
    } = useCompanyDashboard();

    // Gestion de la modale à 2 étapes
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    
    // NOUVEAU : État pour savoir si on crée ou si on modifie (suite à un rejet)
    const [editingDeclaration, setEditingDeclaration] = useState<Declaration | null>(null);

    // États du formulaire
    const [paymentMode, setPaymentMode] = useState('');
    const [bankId, setBankId] = useState('');
    const [reference, setReference] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    
    // LECTURE DU MONTANT DEPUIS LE LOCALSTORAGE (Valeur envoyée par l'ERP)
    const amountToPay = localStorage.getItem('amountToPay') || "0";

    useEffect(() => {
        fetchDeclarations();
        fetchBanks();
    }, [fetchDeclarations, fetchBanks]);

    // Ouvre la modale (soit pour un nouveau paiement, soit pour corriger un rejet)
    const openPaymentModal = (declarationToEdit?: Declaration) => {
        if (declarationToEdit) {
            setEditingDeclaration(declarationToEdit);
            setPaymentMode(declarationToEdit.payment_mode || '');
            setBankId(declarationToEdit.bank_id?.toString() || '');
            setReference(declarationToEdit.reference || '');
            setStep(2); // On passe directement au formulaire si on corrige
        } else {
            setEditingDeclaration(null);
            setStep(1);
            setPaymentMode('');
            setBankId('');
            setReference('');
        }
        setFile(null);
        setErrorMsg('');
        setIsModalOpen(true);
    };

    // Soumission du formulaire final
    const handleSubmitPayment = async () => {
        if (!bankId || !reference) {
            return setErrorMsg('Veuillez sélectionner une banque et saisir la référence.');
        }

        let result;

        if (editingDeclaration) {
            // --- MODE MODIFICATION (Correction suite à un rejet) ---
            result = await editPayment(editingDeclaration.id, {
                bank_id: bankId,
                reference: reference,
                amount: amountToPay,
                payment_mode: paymentMode,
                file: file
            });
        } else {
            // --- MODE CRÉATION ---
            if (!file && paymentMode !== 'mobile_money') {
                return setErrorMsg('Le fichier de preuve est obligatoire pour ce mode de paiement.');
            }
            result = await initiatePayment({
                bank_id: bankId,
                reference: reference,
                amount: amountToPay,
                payment_mode: paymentMode,
                file: file
            });
        }

        if (result.success) {
            setIsModalOpen(false);
        } else {
            setErrorMsg(result.message);
        }
    };

    // Déterminer l'état d'avancement pour la barre de progression
    const getProgressIndex = () => {
        if (!activeDeclaration) return -1;
        // Si c'est rejeté, on le met en erreur (index spécial ou on le laisse à 1 pour montrer que ça a bloqué à la banque)
        if (activeDeclaration.status === 'rejected') return -2; 
        
        switch (activeDeclaration.status) {
            case 'initiated': return 0;
            case 'submited': return 1;
            case 'bank_validated': return 2;
            case 'cnps_validated': return 3;
            default: return -1;
        }
    };
    const progressIndex = getProgressIndex();

    return (
        <div className="space-y-6 animate-in fade-in duration-300 relative">
            
            {/* EN-TÊTE : Montant à payer */}
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Cotisation du mois en cours à régler</h2>
                    <div className="mt-2 text-4xl font-bold text-slate-900">
                        {Number(amountToPay).toLocaleString('fr-FR')} <span className="text-lg text-slate-400 font-medium">FCFA</span>
                    </div>
                </div>
                <button 
                    onClick={() => openPaymentModal()}
                    className="rounded-lg bg-blue-700 px-8 py-4 text-lg font-bold text-white shadow-md transition-all hover:bg-blue-800 hover:shadow-lg active:scale-95"
                >
                    Procéder au paiement
                </button>
            </div>

            {/* TRACKER DE PROGRESSION */}
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-8">Suivi du paiement en cours</h3>
                
                {progressIndex === -2 ? (
                    // Affichage spécial si le paiement est rejeté
                    <div className="rounded-lg bg-red-50 p-6 text-center border border-red-100">
                        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
                        <h4 className="text-lg font-bold text-red-800 mb-1">Paiement rejeté par la banque</h4>
                        <p className="text-sm text-red-600 mb-4">Motif : {activeDeclaration?.comment_reject || "Anomalie détectée"}</p>
                        <button 
                            onClick={() => openPaymentModal(activeDeclaration!)}
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                        >
                            <RefreshCw size={16} />
                            Corriger ma déclaration
                        </button>
                    </div>
                ) : (
                    // Affichage normal de la progression
                    <div className="relative flex justify-between items-center max-w-3xl mx-auto">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-slate-100 -z-10"></div>
                        <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 ease-in-out -z-10" 
                            style={{ width: `${Math.max(0, (progressIndex / 3) * 100)}%` }}
                        ></div>

                        {[
                            { label: 'Avis Reçu', idx: 0 },
                            { label: 'Transmis Banque', idx: 1 },
                            { label: 'Validé Banque', idx: 2 },
                            { label: 'Rapproché CNPS', idx: 3 }
                        ].map((step, idx) => {
                            const isCompleted = progressIndex >= idx;
                            const isCurrent = progressIndex === idx;
                            return (
                                <div key={idx} className="flex flex-col items-center bg-white px-2">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isCompleted ? 'text-emerald-500 bg-white ring-2 ring-emerald-500' : 'text-slate-300 bg-white ring-2 ring-slate-200'}`}>
                                        {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={16} fill="currentColor" />}
                                    </div>
                                    <span className={`mt-3 text-xs font-bold ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
                {!activeDeclaration && (
                    <p className="text-center text-sm text-slate-400 mt-6 italic">Aucun paiement en cours de traitement.</p>
                )}
            </div>

            {/* TABLEAU DES QUITTANCES */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 p-6">
                    <h3 className="text-base font-bold text-slate-900">Dernières Quittances</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Période</th>
                                <th className="px-6 py-4">Référence Unique</th>
                                <th className="px-6 py-4">Montant</th>
                                <th className="px-6 py-4">Statut</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="mx-auto animate-spin text-slate-400" /></td></tr>
                            ) : declarations.length === 0 ? (
                                <tr><td colSpan={5} className="py-8 text-center text-slate-400">Aucun historique de paiement.</td></tr>
                            ) : (
                                declarations.map((dec) => (
                                    <tr key={dec.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium">{new Date(dec.period).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</td>
                                        <td className="px-6 py-4 font-mono text-slate-500">{dec.reference}</td>
                                        <td className="px-6 py-4 font-bold">{Number(dec.amount).toLocaleString('fr-FR')} FCFA</td>
                                        <td className="px-6 py-4">
                                            {dec.status === 'cnps_validated' && <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">Terminé</span>}
                                            {dec.status === 'rejected' && <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">Rejeté</span>}
                                            {['initiated', 'submited', 'bank_validated'].includes(dec.status) && <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800">En cours</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {dec.status === 'rejected' ? (
                                                <button 
                                                    onClick={() => openPaymentModal(dec)}
                                                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                                >
                                                    Corriger
                                                </button>
                                            ) : (
                                                <button disabled={dec.status !== 'cnps_validated'} className="text-blue-600 hover:text-blue-800 disabled:opacity-30 disabled:hover:text-blue-600 transition-colors">
                                                    <Download size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALE DE PAIEMENT / CORRECTION (Multi-step) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        
                        {/* HEADER MODALE */}
                        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-5 sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-slate-900">
                                {editingDeclaration ? 'Corriger la déclaration' : (step === 1 ? 'Choisissez votre mode de règlement' : 'Initier la transaction')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="mb-8 flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="text-slate-600 font-medium">Montant à régler :</span>
                                <span className="text-xl font-bold text-slate-900">{Number(amountToPay).toLocaleString('fr-FR')} FCFA</span>
                            </div>

                            {/* ÉTAPE 1 : CHOIX DU MODE (Uniquement visible si on crée une nouvelle déclaration et qu'on est à l'étape 1) */}
                            {step === 1 && !editingDeclaration && (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {[
                                        { id: 'virement', icon: CreditCard, label: 'Virement en ligne' },
                                        { id: 'ordre_virement', icon: FileText, label: 'Ordre de Virement (Guichet)' },
                                        { id: 'especes', icon: Banknote, label: 'Espèces (Guichet)' },
                                        { id: 'mobile_money', icon: Smartphone, label: 'Mobile Money (MTN / Orange)' },
                                    ].map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => {
                                                setPaymentMode(mode.id);
                                                setStep(2);
                                            }}
                                            className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-slate-100 p-6 text-slate-600 transition-all hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700 group"
                                        >
                                            <div className="rounded-full bg-slate-50 p-4 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                <mode.icon size={32} />
                                            </div>
                                            <span className="font-semibold">{mode.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* ÉTAPE 2 : FORMULAIRE */}
                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    {errorMsg && (
                                        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex items-start gap-2">
                                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                            <p>{errorMsg}</p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Banque de destination <span className="text-red-500">*</span></label>
                                        <select 
                                            value={bankId} 
                                            onChange={(e) => setBankId(e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                                        >
                                            <option value="">Choisir une banque...</option>
                                            {banks.map(b => (
                                                <option key={b.id} value={b.id}>{b.bank_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* UPLOAD FICHIER */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                                            Preuve de paiement (PDF) {paymentMode !== 'mobile_money' && !editingDeclaration && <span className="text-red-500">*</span>}
                                        </label>
                                        <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 transition-colors hover:bg-blue-50">
                                            <UploadCloud size={36} className="text-blue-500 mb-3" />
                                            <span className="text-base font-bold text-slate-700">
                                                {editingDeclaration ? 'Déposez un nouveau PDF (Optionnel)' : 'Déposez le fichier PDF ici'}
                                            </span>
                                            <span className="text-sm text-slate-500 mt-1">ou cliquez pour parcourir</span>
                                            <input 
                                                type="file" 
                                                accept=".pdf"
                                                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                                            />
                                            {file && (
                                                <div className="mt-4 rounded bg-white px-3 py-1.5 text-sm font-semibold text-emerald-600 shadow-sm border border-emerald-100 flex items-center gap-2">
                                                    <CheckCircle2 size={16} /> {file.name}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Référence de la transaction <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            placeholder="Ex: VRT-MARS26-001"
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase font-mono"
                                        />
                                    </div>

                                    <div className="flex justify-between pt-6 border-t border-slate-100">
                                        {/* Bouton retour caché si on est en mode édition (on ne peut pas changer le mode de paiement d'un rejet) */}
                                        {!editingDeclaration ? (
                                            <button 
                                                onClick={() => setStep(1)} 
                                                className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                                            >
                                                ← Changer de mode
                                            </button>
                                        ) : <div></div>}

                                        <button 
                                            onClick={handleSubmitPayment}
                                            disabled={isSubmitting}
                                            className="flex items-center gap-2 rounded-lg bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-blue-800 disabled:opacity-70"
                                        >
                                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : null}
                                            {editingDeclaration ? 'Renvoyer la déclaration' : 'Transmettre à la banque'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};