import { useState, useCallback } from 'react';
import axiosInstance from '../../config/axios';
import { Declaration } from '../../types';

export interface BankFilters {
    reference: string;
    status: string;
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
        reference: '', status: '', start_date: '', end_date: ''
    });

    const fetchDeclarations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/bank/declarations', {
                params: { page, ...filters }
            });
            setDeclarations(response.data.data);
            setTotalPages(response.data.last_page);
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
        setFilters({ reference: '', status: '', start_date: '', end_date: '' });
        setPage(1);
    };

    // ==========================================
    // ACTIONS SUR LES DÉPÔTS EN LIGNE
    // ==========================================

    const validatePayment = async (id: number, reference: string, orderReference?: string) => {
        setIsActionLoading(true);
        try {
            const payload: any = { reference };
            if (orderReference) payload.order_reference = orderReference;

            const response = await axiosInstance.put(`/bank/declarations/${id}/validate`, payload);
            
            setDeclarations(prev => prev.map(dec => 
                dec.id === id ? { ...dec, status: 'bank_validated', reference, order_reference: orderReference } : dec
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
            const response = await axiosInstance.put(`/bank/declarations/${id}/reject`, { comment_reject: comment });
            
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

    const searchCompany = async (niu: string) => {
        try {
            const response = await axiosInstance.get('/bank/companies/search', { params: { niu } });
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

    const downloadProof = (id: number, ref: string) => 
        downloadFile(`/declarations/${id}/download-proof`, `Preuve_Banque_${ref}.pdf`);

    const downloadReceipt = (id: number, ref: string) => 
        downloadFile(`/declarations/${id}/download-receipt`, `Quittance_CNPS_${ref}.pdf`);

    return {
        declarations, isLoading, isActionLoading,
        page, setPage, totalPages,
        filters, handleFilterChange, resetFilters,
        fetchDeclarations, 
        validatePayment, rejectPayment,
        searchCompany, createCounterDeposit, updateCounterDeposit, deleteCounterDeposit,
        downloadProof, downloadReceipt 
    };
};