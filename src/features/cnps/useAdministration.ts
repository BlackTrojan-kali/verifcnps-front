import { useState, useCallback } from 'react';
import axiosInstance from '../../config/axios';
import { Bank, CnpsAgent } from '../../types';

export const useAdministration = () => {
    const [banks, setBanks] = useState<Bank[]>([]);
    const [agents, setAgents] = useState<CnpsAgent[]>([]);
    
    const [isLoadingBanks, setIsLoadingBanks] = useState(false);
    const [isLoadingAgents, setIsLoadingAgents] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // ==========================================
    // 1. BANQUES
    // ==========================================
    const fetchBanks = useCallback(async () => {
        setIsLoadingBanks(true);
        try {
            const response = await axiosInstance.get('/cnps/banks');
            setBanks(response.data.banks || response.data);
        } catch (error) {
            console.error("Erreur", error);
        } finally {
            setIsLoadingBanks(false);
        }
    }, []);

    const createBank = async (bankData: any) => {
        setIsActionLoading(true);
        try {
            const response = await axiosInstance.post('/cnps/banks', bankData);
            setBanks(prev => [response.data.bank || response.data, ...prev]);
            return { success: true, message: "Banque créée avec succès." };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur lors de la création." };
        } finally {
            setIsActionLoading(false);
        }
    };

    const updateBank = async (id: number, bankData: any) => {
        setIsActionLoading(true);
        try {
            const response = await axiosInstance.put(`/cnps/banks/${id}`, bankData);
            const updatedBank = response.data.bank || response.data;
            // Mise à jour optimiste du tableau
            setBanks(prev => prev.map(b => b.id === id ? updatedBank : b));
            return { success: true, message: "Banque modifiée avec succès." };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur lors de la modification." };
        } finally {
            setIsActionLoading(false);
        }
    };

    // ==========================================
    // 2. AGENTS CNPS
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

    const updateAgent = async (id: number, agentData: any) => {
        setIsActionLoading(true);
        try {
            const response = await axiosInstance.put(`/cnps/agents/${id}`, agentData);
            const updatedAgent = response.data.agent || response.data;
            setAgents(prev => prev.map(a => a.id === id ? updatedAgent : a));
            return { success: true, message: "Agent modifié avec succès." };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur lors de la modification." };
        } finally {
            setIsActionLoading(false);
        }
    };

    return {
        banks, agents, isLoadingBanks, isLoadingAgents, isActionLoading,
        fetchBanks, createBank, updateBank,
        fetchAgents, createAgent, updateAgent
    };
};