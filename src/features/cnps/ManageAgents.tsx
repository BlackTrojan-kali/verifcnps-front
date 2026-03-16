import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Search, Loader2, X, AlertCircle, CheckCircle2, Shield, Edit } from 'lucide-react';
import { useAdministration } from './useAdministration';
import { CnpsAgent } from '../../types';

export const ManageAgents = () => {
    const { 
        agents, isLoadingAgents, fetchAgents, createAgent, updateAgent, isActionLoading 
    } = useAdministration();

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // État pour savoir si on est en mode Création (null) ou Modification (CnpsAgent)
    const [editingAgent, setEditingAgent] = useState<CnpsAgent | null>(null);

    // Champs du formulaire
    const [matricule, setMatricule] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState('');
    const [password, setPassword] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    const filteredAgents = agents.filter(agent => 
        agent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.matricule.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openCreateModal = () => {
        setEditingAgent(null);
        setMatricule('');
        setFullName('');
        setEmail('');
        setDepartment('');
        setPassword('');
        setFeedback(null);
        setIsModalOpen(true);
    };

    const openEditModal = (agent: CnpsAgent) => {
        setEditingAgent(agent);
        setMatricule(agent.matricule);
        setFullName(agent.full_name);
        setDepartment(agent.department || '');
        setEmail(agent.user?.email || '');
        setPassword(''); // On laisse toujours vide par sécurité lors d'une modification
        setFeedback(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        let result;
        
        if (editingAgent) {
            // MODE MODIFICATION
            const payload: any = { 
                matricule: matricule, 
                full_name: fullName,
                department: department
            };
            if (email) payload.email = email;
            if (password) payload.password = password; // S'il a tapé un nouveau mot de passe
            
            result = await updateAgent(editingAgent.id, payload);
        } else {
            // MODE CRÉATION
            result = await createAgent({
                matricule: matricule,
                full_name: fullName,
                department: department,
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
            
            {/* EN-TÊTE DE LA PAGE */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Agents CNPS</h1>
                    <p className="text-sm text-slate-500 mt-1">Gérez les accès des agents internes à la plateforme.</p>
                </div>
                <button 
                    onClick={openCreateModal}
                    className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                    <UserPlus size={18} />
                    Ajouter un agent
                </button>
            </div>

            {/* BARRE DE RECHERCHE */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Rechercher (Nom, Matricule)..." 
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
                                <th className="px-6 py-4 font-semibold">Matricule</th>
                                <th className="px-6 py-4 font-semibold">Nom Complet</th>
                                <th className="px-6 py-4 font-semibold">Contact (Email)</th>
                                <th className="px-6 py-4 font-semibold">Département</th>
                                <th className="px-6 py-4 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoadingAgents ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-2" />
                                        Chargement des agents...
                                    </td>
                                </tr>
                            ) : filteredAgents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">
                                        <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                        Aucun agent ne correspond à votre recherche.
                                    </td>
                                </tr>
                            ) : (
                                filteredAgents.map((agent) => (
                                    <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800 font-mono">
                                                {agent.matricule}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {agent.full_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            {agent.user?.email || <span className="text-slate-400 italic">Non renseigné</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {agent.department || <span className="text-slate-400 italic">Non renseigné</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <button 
                                                onClick={() => openEditModal(agent)}
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

            {/* MODALE D'AJOUT / MODIFICATION D'AGENT */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
                        
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <div className="flex items-center gap-2 text-blue-800">
                                {editingAgent ? <Edit size={20} /> : <UserPlus size={20} />}
                                <h3 className="text-lg font-bold">
                                    {editingAgent ? 'Modifier l\'agent CNPS' : 'Nouvel Agent CNPS'}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {feedback && (
                                <div className={`mb-4 flex items-start gap-2 rounded-md p-3 text-sm border ${
                                    feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                    {feedback.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                                    <p>{feedback.message}</p>
                                </div>
                            )}

                            <form id="agentForm" onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Matricule <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" required placeholder="Ex: CNPS-001"
                                            value={matricule} onChange={(e) => setMatricule(e.target.value)}
                                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none uppercase"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Département</label>
                                        <input 
                                            type="text" placeholder="Ex: Recouvrement"
                                            value={department} onChange={(e) => setDepartment(e.target.value)}
                                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Nom Complet <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" required placeholder="Ex: Jean Dupont"
                                        value={fullName} onChange={(e) => setFullName(e.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                                    />
                                </div>

                                <div className="border-t border-slate-100 pt-4 mt-4">
                                    <h4 className="text-sm font-semibold text-slate-800 mb-3">Informations de connexion</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">Adresse Email {editingAgent ? '' : '<span className="text-red-500">*</span>'}</label>
                                            <input 
                                                type="email" required={!editingAgent} placeholder="agent@cnps.cm"
                                                value={email} onChange={(e) => setEmail(e.target.value)}
                                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                Mot de passe {editingAgent && <span className="text-slate-400 font-normal">(Laissez vide pour conserver)</span>}
                                                {!editingAgent && <span className="text-red-500">*</span>}
                                            </label>
                                            <input 
                                                type="password" required={!editingAgent} placeholder="Min. 8 caractères"
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
                                type="submit" form="agentForm" disabled={isActionLoading}
                                className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
                            >
                                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                {editingAgent ? 'Enregistrer les modifications' : 'Créer l\'agent'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};