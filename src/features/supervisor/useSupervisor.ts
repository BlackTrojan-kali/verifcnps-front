import { useState } from 'react';
import axiosInstance from '../../config/axios';
import { Declaration } from '../../types'; // Ajustez le chemin de vos types

// ==========================================
// TYPES DES PARAMÈTRES (Filtres & Payloads)
// ==========================================

export interface DashboardFilters {
    bank_id?: number | string;
    start_date?: string;
    end_date?: string;
}

export interface DeclarationFilters extends DashboardFilters {
    status?: string;
    payment_mode?: string;
    search?: string;
    page?: number;
}

export interface CreateBankAgentPayload {
    email: string;
    password?: string; // Optionnel si généré par défaut, mais requis par l'API actuelle
    bank_code: string;
    bank_name: string;
    address?: string;
    is_admin: boolean;
}

// ==========================================
// LE HOOK
// ==========================================

export const useSupervisor = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Gère les erreurs de l'API de manière uniforme
     */
    const handleError = (err: any, defaultMessage: string) => {
        const message = err.response?.data?.message || err.response?.data || defaultMessage;
        setError(typeof message === 'string' ? message : defaultMessage);
        throw err; // On relance l'erreur pour permettre au composant de la catcher s'il le souhaite
    };

    /**
     * 1. Récupérer les statistiques du Dashboard Global
     */
    const fetchDashboardStats = async (filters: DashboardFilters = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            // Nettoie les filtres vides avant l'envoi
            const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != null && v !== ''));
            const response = await axiosInstance.get('/supervisor/dashboard-stats', { params: cleanFilters });
            return response.data;
        } catch (err: any) {
            handleError(err, 'Erreur lors de la récupération des statistiques.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 2. Lister toutes les déclarations du système (avec filtres et pagination)
     */
    const fetchDeclarations = async (filters: DeclarationFilters = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != null && v !== ''));
            const response = await axiosInstance.get('/supervisor/declarations', { params: cleanFilters });
            return response.data; // Retourne un objet paginé de Laravel { data: [...], current_page: 1, ... }
        } catch (err: any) {
            handleError(err, 'Erreur lors de la récupération des déclarations.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 3. Voir les détails d'une déclaration spécifique
     */
    const fetchDeclarationDetails = async (id: number | string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get(`/supervisor/declarations/${id}`);
            return response.data.declaration as Declaration;
        } catch (err: any) {
            handleError(err, 'Erreur lors de la récupération de la déclaration.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 4. Créer un nouveau compte Banque (Agent ou Admin)
     */
    const createBankAgent = async (payload: CreateBankAgentPayload) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.post('/supervisor/banks/agents', payload);
            return response.data;
        } catch (err: any) {
            handleError(err, 'Erreur lors de la création du compte bancaire.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 5. Réinitialiser le mot de passe d'un agent de banque
     */
    const updateBankAgentPassword = async (bankId: number | string, newPassword: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.patch(`/supervisor/banks/agents/${bankId}/password`, {
                password: newPassword
            });
            return response.data;
        } catch (err: any) {
            handleError(err, 'Erreur lors de la mise à jour du mot de passe.');
        } finally {
            setIsLoading(false);
        }
    };
const fetchBanks = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get('/supervisor/banks');
            return response.data.banks as Bank[];
        } catch (err: any) {
            handleError(err, 'Erreur lors de la récupération des banques.');
            return []; // Retourne un tableau vide en cas d'erreur pour éviter que le composant ne plante
        } finally {
            setIsLoading(false);
        }
    };
    return {
        isLoading,
        error,
        clearError: () => setError(null),
        fetchDashboardStats,
        fetchDeclarations,
        fetchDeclarationDetails,
        createBankAgent,
        fetchBanks,
        updateBankAgentPassword
    };
};