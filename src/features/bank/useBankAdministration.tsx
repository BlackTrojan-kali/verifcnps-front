import { useState, useCallback } from 'react';
import axiosInstance from '../../config/axios';
import { Bank } from '../../types'; // Rappel : le guichetier utilise l'interface Bank dans notre modèle

export interface CreateBankAgentPayload {
    email: string;
    password: string;
    bank_code: string;
    is_admin: boolean;
}

export const useBankAdministration = () => {
    const [agents, setAgents] = useState<Bank[]>([]);
    const [isLoadingAgents, setIsLoadingAgents] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    /**
     * 1. Récupérer la liste des guichetiers de CETTE agence
     */
    const fetchAgents = useCallback(async () => {
        setIsLoadingAgents(true);
        try {
            const response = await axiosInstance.get('/bank/agents');
            setAgents(response.data.agents || response.data);
        } catch (error) {
            console.error("Erreur lors de la récupération des guichetiers", error);
        } finally {
            setIsLoadingAgents(false);
        }
    }, []);

    /**
     * 2. Créer un nouveau compte guichetier
     */
    const createAgent = async (payload: CreateBankAgentPayload) => {
        setIsActionLoading(true);
        try {
            const response = await axiosInstance.post('/bank/agents', payload);
            setAgents(prev => [response.data.agent || response.data, ...prev]);
            return { success: true, message: "Guichetier créé avec succès." };
        } catch (error: any) {
            return { 
                success: false, 
                message: error.response?.data?.message || "Erreur lors de la création du compte." 
            };
        } finally {
            setIsActionLoading(false);
        }
    };

    /**
     * 3. Réinitialiser le mot de passe d'un guichetier
     */
    const updateAgentPassword = async (id: number, newPassword: string) => {
        setIsActionLoading(true);
        try {
            const response = await axiosInstance.patch(`/bank/agents/${id}/password`, { 
                password: newPassword 
            });
            return { success: true, message: response.data.message || "Mot de passe modifié avec succès." };
        } catch (error: any) {
            return { 
                success: false, 
                message: error.response?.data?.message || "Erreur lors de la modification du mot de passe." 
            };
        } finally {
            setIsActionLoading(false);
        }
    };

    /**
     * 4. Modifier les droits d'administration d'un guichetier (NOUVEAU)
     */
    const toggleAdminStatus = async (id: number) => {
        setIsActionLoading(true);
        try {
            const response = await axiosInstance.patch(`/bank/agents/${id}/toggle-admin`);
            const updatedAgent = response.data.agent || response.data;
            
            // Mise à jour optimiste de la liste locale pour que l'UI réagisse tout de suite
            setAgents(prev => prev.map(agent => agent.id === id ? updatedAgent : agent));
            
            return { success: true, message: response.data.message || "Statut modifié avec succès." };
        } catch (error: any) {
            return { 
                success: false, 
                message: error.response?.data?.message || "Erreur lors de la modification du statut." 
            };
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
        toggleAdminStatus // <-- N'oubliez pas de l'exporter ici
    };
};