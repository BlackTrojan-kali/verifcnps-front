import { useState, useCallback } from 'react';
import axiosInstance from '../../config/axios';
import { Declaration } from '../../types';

export interface BankFilters {
    reference: string;
    mobile_reference: string; // <-- Ajouté pour correspondre au backend
    status: string;
    period: string;           // <-- Ajouté pour correspondre au backend
    start_date: string;
    end_date: string;
}

export const useBankHistory = () => {
    const [declarations, setDeclarations] = useState<Declaration[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const [filters, setFilters] = useState<BankFilters>({
        reference: '', mobile_reference: '', status: '', period: '', start_date: '', end_date: ''
    });

    const fetchDeclarations = useCallback(async () => {
        setIsLoading(true);
        try {
            // On nettoie les filtres vides pour ne pas surcharger l'URL
            const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
            const response = await axiosInstance.get('/bank/declarations', {
                params: { page, ...cleanFilters }
            });
            
            // Selon la structure de pagination Laravel (response.data ou response.data.data)
            setDeclarations(response.data.data || response.data);
            setTotalPages(response.data.last_page || 1);
        } catch (error) {
            console.error("Erreur lors de la récupération de l'historique", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, filters]);

    const handleFilterChange = (key: keyof BankFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); 
    };

    const resetFilters = () => {
        setFilters({ reference: '', mobile_reference: '', status: '', period: '', start_date: '', end_date: '' });
        setPage(1);
    };

    // ==========================================
    // ACTIONS SUR LES DÉPÔTS EN LIGNE
    // ==========================================

    const validatePayment = async (id: number, reference: string, orderReference?: string) => {
        setIsActionLoading(true);
        try {
            // Payload aligné strictement sur les règles du BankController
            const payload: any = { reference };
            if (orderReference) payload.order_reference = orderReference;

            const response = await axiosInstance.put(`/bank/declarations/${id}/validate`, payload);
            
            // Mise à jour de l'état local
            setDeclarations(prev => prev.map(dec => 
                dec.id === id ? { ...dec, status: 'bank_validated', reference, order_reference: orderReference || null } : dec
            ));
            
            return { success: true, message: response.data.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur de validation." };
        } finally {
            setIsActionLoading(false);
        }
    };

    const rejectPayment = async (id: number, comment: string) => {
        setIsActionLoading(true);
        try {
            // Payload aligné strictement sur les règles du BankController
            const response = await axiosInstance.put(`/bank/declarations/${id}/reject`, { 
                comment_reject: comment
            });
            
            setDeclarations(prev => prev.map(dec => 
                dec.id === id ? { ...dec, status: 'rejected', comment_reject: comment } : dec
            ));
            
            return { success: true, message: response.data.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur lors du rejet." };
        } finally {
            setIsActionLoading(false);
        }
    };

    // ==========================================
    // SAISIE AU GUICHET (MANUELLE)
    // ==========================================

    // Recherche avec le Numéro Employeur (anciennement NIU)
    const searchCompany = async (numero_employeur: string) => {
        try {
            const response = await axiosInstance.get('/bank/companies/search', { 
                params: { numero_employeur } 
            });
            return { success: true, company: response.data.company };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Entreprise introuvable." };
        }
    };

    const createCounterDeposit = async (data: any) => {
        setIsActionLoading(true);
        try {
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            });

            const response = await axiosInstance.post('/bank/counter-deposits', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setDeclarations(prev => [response.data.declaration, ...prev]);
            return { success: true, message: response.data.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur d'enregistrement." };
        } finally {
            setIsActionLoading(false);
        }
    };

    const updateCounterDeposit = async (id: number, data: any) => {
        setIsActionLoading(true);
        try {
            const formData = new FormData();
            Object.keys(data).forEach(key => {
                if (data[key] !== null && data[key] !== undefined) {
                    formData.append(key, data[key]);
                }
            });
            formData.append('_method', 'PUT');

            const response = await axiosInstance.post(`/bank/counter-deposits/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setDeclarations(prev => prev.map(dec => dec.id === id ? response.data.declaration : dec));
            return { success: true, message: response.data.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur de modification." };
        } finally {
            setIsActionLoading(false);
        }
    };

    // Note : Cette route n'existe pas actuellement dans votre backend Laravel.
    const deleteCounterDeposit = async (id: number) => {
        setIsActionLoading(true);
        try {
            await axiosInstance.delete(`/bank/counter-deposits/${id}`);
            setDeclarations(prev => prev.filter(dec => dec.id !== id));
            return { success: true, message: "Dépôt supprimé avec succès." };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur lors de la suppression." };
        } finally {
            setIsActionLoading(false);
        }
    };

    // ========================================================
    // TÉLÉCHARGEMENTS (DOCUMENTS)
    // ========================================================

    const downloadFile = async (endpoint: string, filename: string) => {
        try {
            const response = await axiosInstance.get(endpoint, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            return { success: true };
        } catch (error: any) {
            const message = error.response?.status === 404 ? "Fichier introuvable." : "Erreur de téléchargement.";
            return { success: false, message };
        }
    };

    // Note: cette route est sur le préfixe global (hors de /bank/)
    const downloadProof = (id: number, ref: string) => 
        downloadFile(`/declarations/${id}/download-proof`, `Preuve_Banque_${ref || id}.pdf`);

    // Note: La route de téléchargement de quittance pour la banque n'existe pas actuellement
    const downloadReceipt = (id: number, ref: string) => 
        downloadFile(`/bank/declarations/${id}/download-receipt`, `Quittance_CNPS_${ref || id}.pdf`);

    return {
        declarations, isLoading, isActionLoading,
        page, setPage, totalPages,
        filters, handleFilterChange, resetFilters,
        fetchDeclarations, 
        validatePayment, rejectPayment,
        searchCompany, createCounterDeposit, updateCounterDeposit, deleteCounterDeposit,
        downloadProof, downloadReceipt, downloadFile
    };
};