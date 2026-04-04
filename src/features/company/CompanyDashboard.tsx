import  { useEffect, useState } from 'react';
import { 
    CreditCard,  Smartphone, 
    CheckCircle2, Circle, UploadCloud, Loader2, 
    X, AlertCircle, RefreshCw, Edit2
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
    
    // État pour savoir si on crée ou si on modifie (suite à un rejet)
    const [editingDeclaration, setEditingDeclaration] = useState<Declaration | null>(null);

    // États du formulaire
    const [paymentMode, setPaymentMode] = useState('');
    const [bankId, setBankId] = useState('');
    const [reference, setReference] = useState('');
    const [mobileReference, setMobileReference] = useState(''); // <-- NOUVEAU
    const [file, setFile] = useState<File | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    
    // Transformation en variable d'état pour permettre la modification
    const [amountToPay, setAmountToPay] = useState(localStorage.getItem('amountToPay') || "0");

    // Variable pratique pour alléger les conditions dans le formulaire
    const isMobileMoney = paymentMode === 'mobile_money' || paymentMode === 'orange_money';

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
            setMobileReference(declarationToEdit.mobile_reference || '');
            setStep(2); // On passe directement au formulaire si on corrige
        } else {
            setEditingDeclaration(null);
            setStep(1);
            setPaymentMode('');
            setBankId('');
            setReference('');
            setMobileReference('');
        }
        setFile(null);
        setErrorMsg('');
        setIsModalOpen(true);
    };

    // Soumission du formulaire final
    const handleSubmitPayment = async () => {
        // VÉRIFICATIONS DYNAMIQUES
        if (!isMobileMoney) {
            if (!bankId) return setErrorMsg('Veuillez sélectionner une banque de destination.');
            if (!reference && !editingDeclaration) return setErrorMsg('Veuillez saisir la référence du paiement.');
        } else {
            if (!mobileReference && !editingDeclaration) return setErrorMsg('Veuillez saisir la référence de la transaction Mobile Money.');
        }

        const payload = {
            bank_id: isMobileMoney ? '' : bankId,
            amount: amountToPay,
            payment_mode: paymentMode,
            reference: isMobileMoney ? '' : reference,
            mobile_reference: isMobileMoney ? mobileReference : '',
            file: isMobileMoney ? null : file,
        };

        let result;
        if (editingDeclaration) {
            result = await editPayment(editingDeclaration.id, payload);
        } else {
            result = await initiatePayment(payload);
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
        if (activeDeclaration.status === 'rejected') return -2; 
        
        switch (activeDeclaration.status) {
            case 'submited': return 1;
            case 'bank_validated': return 2;
            case 'cnps_validated': return 3;
            default: return -1;
        }
    };
    const progressIndex = getProgressIndex();

    return (
        <div className="space-y-6 animate-in fade-in duration-300 relative">
            
            {/* EN-TÊTE : Montant à payer (MAINTENANT MODIFIABLE) */}
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Cotisation du mois en cours à régler</h2>
                    <div className="mt-2 flex items-center gap-3">
                        <input
                            type="number"
                            value={amountToPay}
                            onChange={(e) => {
                                setAmountToPay(e.target.value);
                                localStorage.setItem('amountToPay', e.target.value); 
                            }}
                            className="text-4xl font-bold text-slate-900 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 rounded-lg px-4 py-2 w-[200px] transition-all"
                            min="0"
                        />
                        <span className="text-lg text-slate-400 font-medium">FCFA</span>
                        <Edit2 size={18} className="text-slate-300 ml-2" />
                    </div>
                    <p className="text-xs text-slate-400 mt-2 italic">Vous pouvez modifier ce montant si nécessaire avant de payer.</p>
                </div>
                <button 
                    onClick={() => openPaymentModal()}
                    className="rounded-lg bg-blue-700 px-8 py-4 text-lg font-bold text-white shadow-md transition-all hover:bg-blue-800 hover:shadow-lg active:scale-95 whitespace-nowrap"
                >
                    Procéder au paiement
                </button>
            </div>

            {/* TRACKER DE PROGRESSION */}
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-8">Suivi du paiement en cours</h3>
                
                {progressIndex === -2 ? (
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
                    <div className="relative flex justify-between items-center max-w-3xl mx-auto">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-slate-100 -z-10"></div>
                        <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 ease-in-out -z-10" 
                            style={{ width: `${Math.max(0, (progressIndex / 3) * 100)}%` }}
                        ></div>

                        {[
                            { label: 'Transmis Banque', idx: 1 },
                            { label: 'Validé Banque', idx: 2 },
                            { label: 'Rapproché', idx: 3 }
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

            {/* MODALE DE PAIEMENT / CORRECTION (Multi-step) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        
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

                            {step === 1 && !editingDeclaration && (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {[
                                        { id: 'virement', icon: CreditCard, label: 'Virement en ligne' },
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

                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    {errorMsg && (
                                        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex items-start gap-2">
                                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                            <p>{errorMsg}</p>
                                        </div>
                                    )}

                                    {!isMobileMoney ? (
                                        <>
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
                                            
                                            <div>
                                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Référence du virement <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="text" 
                                                    value={reference} 
                                                    onChange={(e) => setReference(e.target.value)}
                                                    placeholder="Ex: VIR-2026-12345"
                                                    className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-sm font-semibold text-slate-700">Preuve de paiement (PDF) {editingDeclaration ? <span className="text-slate-400 font-normal">(Optionnel si non modifié)</span> : <span className="text-red-500">*</span>}</label>
                                                <div className="mt-1 flex justify-center rounded-lg border border-dashed border-slate-300 px-6 py-8">
                                                    <div className="text-center">
                                                        <UploadCloud className="mx-auto h-10 w-10 text-slate-300" />
                                                        <div className="mt-4 flex text-sm leading-6 text-slate-600">
                                                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500">
                                                                <span>Sélectionner un fichier</span>
                                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                                            </label>
                                                            <p className="pl-1">ou glisser-déposer</p>
                                                        </div>
                                                        <p className="text-xs leading-5 text-slate-500 mt-2">
                                                            {file ? <span className="font-bold text-blue-600">{file.name}</span> : 'PDF uniquement, max 5MB'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div>
                                            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Référence Mobile Money <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" 
                                                value={mobileReference} 
                                                onChange={(e) => setMobileReference(e.target.value)}
                                                placeholder="Ex: 1425356524114"
                                                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                            />
                                            <p className="text-xs text-slate-500 mt-2">Saisissez l'ID de transaction reçu par SMS.</p>
                                        </div>
                                    )}

                                    <div className="flex justify-between pt-6 border-t border-slate-100">
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
                                            {editingDeclaration ? 'Renvoyer la déclaration' : (isMobileMoney ? 'Transmettre à la CNPS' : 'Transmettre à la banque')}
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