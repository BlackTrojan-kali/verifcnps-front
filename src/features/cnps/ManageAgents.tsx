import { useEffect, useState } from 'react';
import { Users, UserPlus, Search, Loader2, X, AlertCircle, CheckCircle2, Edit, Shield } from 'lucide-react';
import { useAdministration } from './useAdministration';
import { CnpsAgent } from '../../types';
import useAuthStore from '../../store/useAuthStore'; 

export const ManageAgents = () => {
    const { 
        agents, isLoadingAgents, fetchAgents, createAgent, updateAgentPassword, toggleAdminStatus, isActionLoading 
    } = useAdministration();
    
    const { user } = useAuthStore();
    const isCurrentUserAdmin = user?.cnps?.is_admin === true;
    const currentUserId = user?.id;

    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<CnpsAgent | null>(null);

    // Champs du formulaire
    const [matricule, setMatricule] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false); 
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [togglingAgentId, setTogglingAgentId] = useState<number | null>(null);

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
        setIsAdmin(false); 
        setFeedback(null);
        setIsModalOpen(true);
    };

    const openEditModal = (agent: CnpsAgent) => {
        setEditingAgent(agent);
        setMatricule(agent.matricule);
        setFullName(agent.full_name);
        setDepartment(agent.department || '');
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
            // MODE RÉINITIALISATION DE MOT DE PASSE (Seule modification autorisée en CNPS)
            if (!password) {
                setFeedback({ type: 'error', message: "Veuillez saisir un nouveau mot de passe pour cet agent." });
                return;
            }
            result = await updateAgentPassword(editingAgent.id, password);
        } else {
            // MODE CRÉATION COMPLÈTE
            result = await createAgent({
                matricule,
                full_name: fullName,
                department,
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

    return (
        <div className="space-y-6 animate-in fade-in duration-300 relative">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Agents CNPS</h1>
                    <p className="text-sm text-slate-500 mt-1">Gérez les accès et les privilèges des agents de la plateforme.</p>
                </div>
                {isCurrentUserAdmin && (
                    <button 
                        onClick={openCreateModal}
                        className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                    >
                        <UserPlus size={18} />
                        Ajouter un agent
                    </button>
                )}
            </div>

            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="relative w-full max-w-md">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search size={18} />
                    </span>
                    <input 
                        type="text" 
                        placeholder="Rechercher par nom ou matricule..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Matricule</th>
                                <th className="px-6 py-4 font-semibold">Nom Complet</th>
                                <th className="px-6 py-4 font-semibold">Rôle</th>
                                <th className="px-6 py-4 font-semibold">Contact</th>
                                <th className="px-6 py-4 font-semibold">Département</th>
                                {isCurrentUserAdmin && <th className="px-6 py-4 text-right font-semibold">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoadingAgents ? (
                                <tr>
                                    <td colSpan={isCurrentUserAdmin ? 6 : 5} className="py-12 text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-2" />
                                        Chargement des agents...
                                    </td>
                                </tr>
                            ) : filteredAgents.length === 0 ? (
                                <tr>
                                    <td colSpan={isCurrentUserAdmin ? 6 : 5} className="py-12 text-center text-slate-500">
                                        <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                        Aucun agent trouvé.
                                    </td>
                                </tr>
                            ) : (
                                filteredAgents.map((agent) => (
                                    <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-800">
                                            {agent.matricule}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {agent.full_name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {agent.is_admin ? (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                                                        <Shield size={12} /> Admin
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                                                        Agent
                                                    </span>
                                                )}

                                                {isCurrentUserAdmin && agent.user_id !== currentUserId && (
                                                    <div className="flex items-center border-l border-slate-200 pl-3">
                                                        {togglingAgentId === agent.id ? (
                                                            <Loader2 size={16} className="animate-spin text-blue-500" />
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleAdmin(agent.id)}
                                                                className={`${agent.is_admin ? 'bg-blue-600' : 'bg-slate-200'} relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}
                                                            >
                                                                <span className={`${agent.is_admin ? 'translate-x-4' : 'translate-x-0'} pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200`} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{agent.user?.email || '-'}</td>
                                        <td className="px-6 py-4">{agent.department || '-'}</td>
                                        {isCurrentUserAdmin && (
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => openEditModal(agent)}
                                                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                                                >
                                                    <Edit size={14} /> Sécurité
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
                            <h3 className="text-lg font-bold text-blue-800">
                                {editingAgent ? 'Réinitialiser le mot de passe' : 'Nouvel Agent CNPS'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {feedback && (
                                <div className={`mb-4 flex items-start gap-2 rounded-md p-3 text-sm border ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                    <p>{feedback.message}</p>
                                </div>
                            )}

                            <form id="agentForm" onSubmit={handleSubmit} className="space-y-4">
                                {!editingAgent ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="text" required placeholder="Matricule" value={matricule} onChange={(e) => setMatricule(e.target.value.toUpperCase())} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                            <input type="text" placeholder="Département" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                        </div>
                                        <input type="text" required placeholder="Nom Complet" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                                    </>
                                ) : (
                                    <div className="bg-blue-50 p-3 rounded-md mb-4">
                                        <p className="text-xs text-blue-700">Vous modifiez la sécurité de l'agent <strong>{editingAgent.full_name}</strong>.</p>
                                    </div>
                                )}
                                
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
                                    <input type="password" required placeholder="Min. 8 caractères" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600" />
                                </div>
                            </form>
                        </div>

                        <div className="flex justify-end gap-3 bg-slate-50 px-6 py-4 border-t border-slate-100">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-sm font-medium text-slate-600">Annuler</button>
                            <button type="submit" form="agentForm" disabled={isActionLoading} className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                                {isActionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                {editingAgent ? 'Mettre à jour' : 'Créer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};