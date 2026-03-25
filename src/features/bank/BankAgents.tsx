import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Search, Loader2, X, AlertCircle, CheckCircle2, Edit, Shield } from 'lucide-react';
import { useBankAdministration } from './useBankAdministration';
import { Bank } from '../../types';
import useAuthStore from '../../store/useAuthStore'; 

export const BankAgents = () => {
    const { 
        agents, isLoadingAgents, fetchAgents, createAgent, updateAgentPassword, toggleAdminStatus, isActionLoading 
    } = useBankAdministration();
    
    // On récupère l'utilisateur connecté pour s'assurer qu'il est bien admin de sa banque
    const { user } = useAuthStore();
    const isBankAdmin = user?.bank?.is_admin === true;
    const currentUserId = user?.id;

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Si null = mode Création, sinon c'est le profil de l'agent à modifier
    const [editingAgent, setEditingAgent] = useState<Bank | null>(null);

    // Champs du formulaire
    const [bankCode, setBankCode] = useState(''); // Correspond au matricule du guichetier
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false); 
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // État pour afficher un loader sur le bouton switch pendant la requête
    const [togglingAgentId, setTogglingAgentId] = useState<number | null>(null);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    // Filtrer par matricule ou email
    const filteredAgents = agents.filter(agent => 
        agent.bank_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agent.user?.email && agent.user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const openCreateModal = () => {
        setEditingAgent(null);
        setBankCode('');
        setEmail('');
        setPassword('');
        setIsAdmin(false); 
        setFeedback(null);
        setIsModalOpen(true);
    };

    const openEditModal = (agent: Bank) => {
        setEditingAgent(agent);
        setBankCode(agent.bank_code);
        setEmail(agent.user?.email || '');
        setPassword(''); 
        setIsAdmin(!!agent.is_admin); 
        setFeedback(null);
        setIsModalOpen(true);
    };

    const handleToggleAdmin = async (agentId: number) => {
        setTogglingAgentId(agentId);
        const result = await toggleAdminStatus(agentId);
        if (!result.success) {
            alert(result.message);
        }
        setTogglingAgentId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        let result;
        
        if (editingAgent) {
            // MODE RÉINITIALISATION DE MOT DE PASSE
            if (!password) {
                setFeedback({ type: 'error', message: "Veuillez saisir un nouveau mot de passe." });
                return;
            }
            result = await updateAgentPassword(editingAgent.id, password);
        } else {
            // MODE CRÉATION COMPLÈTE
            result = await createAgent({
                bank_code: bankCode,
                email,
                password,
                is_admin: isAdmin 
            });
        }

        if (result.success) {
            setFeedback({ type: 'success', message: result.message });
            setTimeout(() => {
                setIsModalOpen(false);
                if (!editingAgent) fetchAgents(); // Rafraîchir si c'est une création
            }, 1500);
        } else {
            setFeedback({ type: 'error', message: result.message });
        }
    };

    // Protection : Si un simple guichetier tente d'accéder à la page par l'URL
    if (!isBankAdmin) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center text-center">
                <Shield className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-700">Accès Refusé</h2>
                <p className="text-slate-500 mt-2">Cette page est strictement réservée au Chef d'Agence.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300 relative p-2 md:p-6">
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestion des Guichetiers</h1>
                    <p className="text-sm text-slate-500 mt-1">Créez et gérez les accès des agents de votre agence ({user?.bank?.bank_name}).</p>
                </div>
                <button 
                    onClick={openCreateModal}
                    className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                    <UserPlus size={18} />
                    Nouveau Guichetier
                </button>
            </div>

            {/* BARRE DE RECHERCHE */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="relative w-full max-w-md">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search size={18} />
                    </span>
                    <input 
                        type="text" 
                        placeholder="Rechercher par matricule ou email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* TABLEAU DES AGENTS */}
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Matricule (Code)</th>
                                <th className="px-6 py-4 font-semibold">Contact (Email)</th>
                                <th className="px-6 py-4 font-semibold">Rôle</th>
                                <th className="px-6 py-4 font-semibold">Date de création</th>
                                <th className="px-6 py-4 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoadingAgents ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-2" />
                                        Chargement des guichetiers...
                                    </td>
                                </tr>
                            ) : filteredAgents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">
                                        <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                        Aucun guichetier trouvé dans votre agence.
                                    </td>
                                </tr>
                            ) : (
                                filteredAgents.map((agent) => (
                                    <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-800 border border-slate-200">
                                                {agent.bank_code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {agent.user?.email || <span className="text-slate-400 italic">Non renseigné</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {agent.is_admin ? (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                                                        <Shield size={12} /> Chef d'Agence
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                                        Guichetier
                                                    </span>
                                                )}

                                                {/* Switch interactif : on l'affiche seulement si ce n'est pas le compte du chef d'agence actuel */}
                                                {agent.user_id !== currentUserId && (
                                                    <div className="flex items-center border-l border-slate-200 pl-3">
                                                        {togglingAgentId === agent.id ? (
                                                            <Loader2 size={16} className="animate-spin text-blue-500" />
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                role="switch"
                                                                aria-checked={agent.is_admin}
                                                                onClick={() => handleToggleAdmin(agent.id)}
                                                                title={agent.is_admin ? "Rétrograder en guichetier" : "Promouvoir Chef d'Agence"}
                                                                className={`${
                                                                    agent.is_admin ? 'bg-blue-600' : 'bg-slate-200'
                                                                } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2`}
                                                            >
                                                                <span
                                                                    aria-hidden="true"
                                                                    className={`${
                                                                        agent.is_admin ? 'translate-x-4' : 'translate-x-0'
                                                                    } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                                                />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {agent.created_at ? new Date(agent.created_at).toLocaleDateString('fr-FR') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {agent.user_id !== currentUserId && (
                                                <button 
                                                    onClick={() => openEditModal(agent)}
                                                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                                                >
                                                    <Edit size={14} /> Sécurité
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

            {/* MODALE D'AJOUT / MODIFICATION D'AGENT */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <div className="flex items-center gap-2 text-blue-800">
                                {editingAgent ? <Shield size={20} /> : <UserPlus size={20} />}
                                <h3 className="text-lg font-bold">
                                    {editingAgent ? 'Réinitialiser le mot de passe' : 'Nouveau Guichetier'}
                                </h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {feedback && (
                                <div className={`mb-4 flex items-start gap-2 rounded-md p-3 text-sm border ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {feedback.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                                    <p>{feedback.message}</p>
                                </div>
                            )}

                            <form id="agentBankForm" onSubmit={handleSubmit} className="space-y-4">
                                {!editingAgent ? (
                                    <>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">Matricule / Code Guichetier <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" required placeholder="Ex: G-001"
                                                value={bankCode} onChange={(e) => setBankCode(e.target.value.toUpperCase())} 
                                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none uppercase" 
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">Adresse Email <span className="text-red-500">*</span></label>
                                            <input 
                                                type="email" required placeholder="guichetier@banque.cm"
                                                value={email} onChange={(e) => setEmail(e.target.value)} 
                                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" 
                                            />
                                        </div>
                                        
                                        <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                                            <div className="space-y-0.5">
                                                <label className="text-sm font-medium text-slate-900">Droits de Chef d'Agence</label>
                                                <p className="text-xs text-slate-500">Permet à cet utilisateur de créer d'autres guichetiers.</p>
                                            </div>
                                            <button
                                                type="button" role="switch" aria-checked={isAdmin}
                                                onClick={() => setIsAdmin(!isAdmin)}
                                                className={`${isAdmin ? 'bg-blue-600' : 'bg-slate-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}
                                            >
                                                <span aria-hidden="true" className={`${isAdmin ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out`} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-blue-50 p-3 rounded-md mb-4 border border-blue-100">
                                        <p className="text-sm text-blue-800">
                                            Vous modifiez la sécurité du compte : <br/>
                                            <strong className="font-mono">{editingAgent.bank_code}</strong> ({editingAgent.user?.email})
                                        </p>
                                    </div>
                                )}
                                
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        {editingAgent ? 'Nouveau mot de passe' : 'Mot de passe provisoire'} <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="password" required placeholder="Min. 6 caractères" 
                                        value={password} onChange={(e) => setPassword(e.target.value)} 
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none" 
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4 border-t border-slate-100">
                            <button 
                                type="button" onClick={() => setIsModalOpen(false)} disabled={isActionLoading}
                                className="text-sm font-medium text-slate-600 hover:text-slate-800"
                            >
                                Annuler
                            </button>
                            <button 
                                type="submit" form="agentBankForm" disabled={isActionLoading} 
                                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
                            >
                                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                {editingAgent ? 'Mettre à jour' : 'Créer le compte'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};