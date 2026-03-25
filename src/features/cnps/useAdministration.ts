import { useState, useCallback } from 'react';
import axiosInstance from '../../config/axios';
import { CnpsAgent } from '../../types';

export const useAdministration = () => {
    const [agents, setAgents] = useState<CnpsAgent[]>([]);
    const [isLoadingAgents, setIsLoadingAgents] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // ==========================================
    // GESTION DES AGENTS CNPS
    // ==========================================
    
    const fetchAgents = useCallback(async () => {
        setIsLoadingAgents(true);
        try {
            const response = await axiosInstance.get('/cnps/agents');
            setAgents(response.data.agents || response.data);
        } catch (error) {
            console.error("Erreur", error);
        } finally {
            setIsLoadingAgents(false);
        }
    }, []);

    const createAgent = async (agentData: any) => {
        setIsActionLoading(true);
        try {
            const response = await axiosInstance.post('/cnps/agents', agentData);
            setAgents(prev => [response.data.agent || response.data, ...prev]);
            return { success: true, message: "Agent créé avec succès." };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur lors de la création." };
        } finally {
            setIsActionLoading(false);
        }
    };

    // NOUVELLE FONCTION : Spécifique pour la réinitialisation du mot de passe
    const updateAgentPassword = async (id: number, newPassword: string) => {
        setIsActionLoading(true);
        try {
            const response = await axiosInstance.patch(`/cnps/agents/${id}/password`, { 
                password: newPassword 
            });
            return { success: true, message: response.data.message || "Mot de passe modifié avec succès." };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur lors de la modification du mot de passe." };
        } finally {
            setIsActionLoading(false);
        }
    };

    // Modifier uniquement le statut d'administration
    const toggleAdminStatus = async (id: number) => {
        setIsActionLoading(true);
        try {
            const response = await axiosInstance.patch(`/cnps/agents/${id}/toggle-admin`);
            const updatedAgent = response.data.agent || response.data;
            
            // On met à jour l'agent dans le tableau local pour refléter le changement instantanément
            setAgents(prev => prev.map(a => a.id === id ? updatedAgent : a));
            
            return { success: true, message: response.data.message || "Statut modifié avec succès." };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur lors de la modification du statut." };
        } finally {
            setIsActionLoading(false);
        }
    };

    return {
        agents, 
        isLoadingAgents, 
        isActionLoading,
        fetchAgents, 
        createAgent, 
        updateAgentPassword, 
        toggleAdminStatus
    };
};