import  { useEffect, useState } from 'react';
import { Building2, Plus, Search, Loader2, X, AlertCircle, CheckCircle2, Edit } from 'lucide-react';
import { useAdministration } from './useAdministration';
import { Bank } from '../../types';

export const ManageBanks = () => {
    const { 
        banks, isLoadingBanks, fetchBanks, createBank, updateBank, isActionLoading 
    } = useAdministration();

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // État pour savoir si on est en mode "Création" (null) ou "Modification" (Bank)
    const [editingBank, setEditingBank] = useState<Bank | null>(null);

    // Champs du formulaire
    const [bankCode, setBankCode] = useState('');
    const [bankName, setBankName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        fetchBanks();
    }, [fetchBanks]);

    const filteredBanks = banks.filter(bank => 
        bank.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bank.bank_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Fonction pour ouvrir la modale en mode "Création"
    const openCreateModal = () => {
        setEditingBank(null);
        setBankCode('');
        setBankName('');
        setEmail('');
        setPassword('');
        setFeedback(null);
        setIsModalOpen(true);
    };

    // Fonction pour ouvrir la modale en mode "Modification"
    const openEditModal = (bank: Bank) => {
        setEditingBank(bank);
        setBankCode(bank.bank_code);
        setBankName(bank.bank_name);
        setEmail(bank.user?.email || ''); // Si l'email remonte via la relation
        setPassword(''); // On laisse vide par sécurité
        setFeedback(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        let result;
        
        if (editingBank) {
            // MODE MODIFICATION
            const payload: any = { bank_code: bankCode, bank_name: bankName };
            // Si on a tapé un email/mot de passe, on les envoie pour mise à jour
            if (email) payload.email = email;
            if (password) payload.password = password;
            
            result = await updateBank(editingBank.id, payload);
        } else {
            // MODE CRÉATION
            result = await createBank({
                bank_code: bankCode,
                bank_name: bankName,
                email: email,
                password: password
            });
        }

        if (result.success) {
            setFeedback({ type: 'success', message: result.message });
            setTimeout(() => {
                setIsModalOpen(false);
            }, 1500);
        } else {
            setFeedback({ type: 'error', message: result.message });
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 relative">
            
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Banques Partenaires</h1>
                    <p className="text-sm text-slate-500 mt-1">Gérez la liste des établissements financiers autorisés.</p>
                </div>
                <button 
                    onClick={openCreateModal}
                    className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                    <Plus size={18} />
                    Ajouter une banque
                </button>
            </div>

            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher une banque..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Code Banque</th>
                                <th className="px-6 py-4 font-semibold">Nom de l'établissement</th>
                                <th className="px-6 py-4 font-semibold">Contact (Email)</th>
                                <th className="px-6 py-4 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoadingBanks ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-500">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-2" />
                                        Chargement des banques...
                                    </td>
                                </tr>
                            ) : filteredBanks.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-500">
                                        Aucune banque trouvée.
                                    </td>
                                </tr>
                            ) : (
                                filteredBanks.map((bank) => (
                                    <tr key={bank.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 font-mono">
                                                {bank.bank_code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {bank.bank_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            {bank.user?.email || <span className="text-slate-400 italic">Non renseigné</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {/* BOUTON MODIFIER */}
                                            <button 
                                                onClick={() => openEditModal(bank)}
                                                className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                                            >
                                                <Edit size={14} /> Modifier
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALE CRÉATION / MODIFICATION */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                        
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <div className="flex items-center gap-2 text-blue-800">
                                {editingBank ? <Edit size={20} /> : <Building2 size={20} />}
                                <h3 className="text-lg font-bold">
                                    {editingBank ? 'Modifier la banque' : 'Nouvelle Banque'}
                                </h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {feedback && (
                                <div className={`mb-4 flex items-start gap-2 rounded-md p-3 text-sm ${
                                    feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                                } border`}>
                                    {feedback.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                                    <p>{feedback.message}</p>
                                </div>
                            )}

                            <form id="bankForm" onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Code Banque <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" required placeholder="Ex: ECO001"
                                            value={bankCode} onChange={(e) => setBankCode(e.target.value)}
                                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Nom complet <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" required placeholder="Ex: Ecobank"
                                            value={bankName} onChange={(e) => setBankName(e.target.value)}
                                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Section d'accès pour la banque */}
                                <div className="border-t border-slate-100 pt-4 mt-4">
                                    <h4 className="text-sm font-semibold text-slate-800 mb-3">Informations de connexion</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">Adresse Email {editingBank ? '' : <span className="text-red-500">*</span>}</label>
                                            <input 
                                                type="email" required={!editingBank} placeholder="banque@domaine.cm"
                                                value={email} onChange={(e) => setEmail(e.target.value)}
                                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                Mot de passe {editingBank && <span className="text-slate-400 font-normal">(Laissez vide pour ne pas modifier)</span>}
                                                {!editingBank && <span className="text-red-500">*</span>}
                                            </label>
                                            <input 
                                                type="password" required={!editingBank} placeholder="Min. 6 caractères"
                                                value={password} onChange={(e) => setPassword(e.target.value)}
                                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4 border-t border-slate-100">
                            <button 
                                type="button" onClick={() => setIsModalOpen(false)} disabled={isActionLoading}
                                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button 
                                type="submit" form="bankForm" disabled={isActionLoading}
                                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
                            >
                                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                {editingBank ? 'Enregistrer les modifications' : 'Créer la banque'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};