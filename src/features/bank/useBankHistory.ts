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
            setDeclarations(response.data.data); // .data car paginate()
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
            return { success: false, message: error.response?.data?.message || "Entreprise introuvable avec ce NIU." };
        }
    };

    const createCounterDeposit = async (data: any) => {
        setIsActionLoading(true);
        try {
            const formData = new FormData();
            formData.append('company_id', data.company_id);
            formData.append('reference', data.reference);
            formData.append('payment_mode', data.payment_mode);
            formData.append('amount', data.amount);
            formData.append('period', data.period); 
            if (data.order_reference) formData.append('order_reference', data.order_reference);
            if (data.file) formData.append('proof_pdf', data.file);

            const response = await axiosInstance.post('/bank/counter-deposits', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setDeclarations(prev => [response.data.declaration, ...prev]);

            return { success: true, message: response.data.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur lors de l'enregistrement." };
        } finally {
            setIsActionLoading(false);
        }
    };

    const updateCounterDeposit = async (id: number, data: any) => {
        setIsActionLoading(true);
        try {
            const formData = new FormData();
            formData.append('company_id', data.company_id);
            formData.append('reference', data.reference);
            formData.append('payment_mode', data.payment_mode);
            formData.append('amount', data.amount);
            formData.append('period', data.period);
            if (data.order_reference) formData.append('order_reference', data.order_reference);
            if (data.file) formData.append('proof_pdf', data.file);
            
            formData.append('_method', 'PUT');

            const response = await axiosInstance.post(`/bank/counter-deposits/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setDeclarations(prev => prev.map(dec => 
                dec.id === id ? response.data.declaration : dec
            ));

            return { success: true, message: response.data.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur lors de la modification." };
        } finally {
            setIsActionLoading(false);
        }
    };

    // ========================================================
    // TÉLÉCHARGEMENT DE LA PREUVE (Uploadée par l'entreprise/guichet)
    // ========================================================
    const downloadProof = async (id: number, reference: string) => {
        try {
            const response = await axiosInstance.get(`/declarations/${id}/download-proof`, {
                responseType: 'blob', 
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Preuve_Banque_${reference}.pdf`);
            document.body.appendChild(link);
            link.click();
            
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            return { success: true };
        } catch (error: any) {
            console.error("Erreur de téléchargement", error);
            if (error.response?.status === 404) {
                alert("Le fichier de preuve n'est pas disponible pour cette transaction.");
            } else {
                alert("Impossible de télécharger le document.");
            }
            return { success: false };
        }
    };

    // ========================================================
    // NOUVEAU : TÉLÉCHARGEMENT DE LA QUITTANCE (Délivrée par CNPS)
    // ========================================================
    const downloadReceipt = async (id: number, reference: string) => {
        try {
            const response = await axiosInstance.get(`/declarations/${id}/download-receipt`, {
                responseType: 'blob', 
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Quittance_CNPS_${reference}.pdf`);
            document.body.appendChild(link);
            link.click();
            
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            return { success: true };
        } catch (error: any) {
            console.error("Erreur de téléchargement de la quittance", error);
            if (error.response?.status === 404) {
                alert("La quittance officielle n'a pas encore été rattachée par la CNPS.");
            } else {
                alert("Impossible de télécharger la quittance.");
            }
            return { success: false };
        }
    };

    return {
        declarations, isLoading, isActionLoading,
        page, setPage, totalPages,
        filters, handleFilterChange,
        fetchDeclarations, 
        validatePayment, rejectPayment,
        searchCompany, createCounterDeposit, updateCounterDeposit,
        downloadProof,
        downloadReceipt // <-- N'OUBLIEZ PAS L'EXPORT ICI
    };
};