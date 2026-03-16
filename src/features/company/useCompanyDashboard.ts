import { useState, useCallback } from 'react';
import axiosInstance from '../../config/axios';
import { Declaration, Bank } from '../../types';

export const useCompanyDashboard = () => {
    const [declarations, setDeclarations] = useState<Declaration[]>([]);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // NOUVEAU : États pour la pagination et les filtres
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<CompanyFilters>({
        reference: '', bank_id: '', start_date: '', end_date: ''
    });
    const activeDeclaration = declarations.length > 0 ? declarations[0] : null;
// MISE À JOUR : Prise en compte des filtres et de la page
    const fetchDeclarations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/company/declarations', {
                params: { page, ...filters }
            });
            setDeclarations(response.data.declarations.data);
            setTotalPages(response.data.declarations.last_page);
        } catch (error) {
            console.error("Erreur", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, filters]);

    // NOUVEAU : Fonction pour changer un filtre facilement
    const handleFilterChange = (key: keyof CompanyFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // On revient à la page 1 lors d'une nouvelle recherche
    };
    const fetchBanks = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/company/banks');
            setBanks(response.data.banks || response.data);
        } catch (error) {
            console.error("Erreur", error);
        }
    }, []);

    const initiatePayment = async (data: any) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('bank_id', data.bank_id);
            formData.append('reference', data.reference);
            formData.append('period', new Date().toISOString().split('T')[0]);
            formData.append('amount', data.amount);
            formData.append('payment_mode', data.payment_mode);
            formData.append('status', 'submited'); // On soumet direct à la banque
            
            if (data.file) formData.append('proof_pdf', data.file);

            // ASSUREZ-VOUS QUE CETTE ROUTE POINTE VERS InitiateDeclaration DANS LARAVEL
            await axiosInstance.post('/company/declarations', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            await fetchDeclarations();
            return { success: true, message: "Paiement transmis." };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur." };
        } finally {
            setIsSubmitting(false);
        }
    };

    // NOUVEAU : Fonction pour respecter l'endpoint EditDeclaration de votre Backend
    const editPayment = async (id: number, data: any) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('bank_id', data.bank_id);
            formData.append('reference', data.reference);
            formData.append('amount', data.amount);
            formData.append('payment_mode', data.payment_mode);
            formData.append('status', 'submited'); // Si on corrige un rejet, on le resoumet
            
            // Laravel utilise souvent une astuce (_method) pour uploader des fichiers en PUT
            formData.append('_method', 'PUT'); 

            if (data.file) formData.append('proof_pdf', data.file);

            // ASSUREZ-VOUS QUE CETTE ROUTE POINTE VERS EditDeclaration
            await axiosInstance.post(`/company/declarations/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            await fetchDeclarations();
            return { success: true, message: "Déclaration mise à jour." };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur." };
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        declarations, activeDeclaration, banks, isLoading, isSubmitting, 
        fetchDeclarations, fetchBanks, initiatePayment, editPayment,page, setPage, totalPages, filters, handleFilterChange, // Export des nouveaux états
    };
};