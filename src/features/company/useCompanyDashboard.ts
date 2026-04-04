import { useState, useCallback } from 'react';
import axiosInstance from '../../config/axios';
import { Declaration, Bank } from '../../types';

// INDISPENSABLE : On définit l'interface pour que TypeScript connaisse la structure de nos filtres
export interface CompanyFilters {
    reference: string;
    mobile_reference: string; // <-- Ajouté pour filtrer les paiements MoMo
    bank_id: string;
    start_date: string;
    end_date: string;
}

export const useCompanyDashboard = () => {
    const [declarations, setDeclarations] = useState<Declaration[]>([]);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // États pour la pagination et les filtres
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<CompanyFilters>({
        reference: '', mobile_reference: '', bank_id: '', start_date: '', end_date: ''
    });
    
    // On isole la déclaration la plus récente pour la barre de progression
    const activeDeclaration = declarations.length > 0 ? declarations[0] : null;

    // Prise en compte des filtres et de la page
    const fetchDeclarations = useCallback(async () => {
        setIsLoading(true);
        try {
            const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != null && v !== ''));
            const response = await axiosInstance.get('/company/declarations', {
                params: { page, ...cleanFilters }
            });
            setDeclarations(response.data.declarations.data);
            setTotalPages(response.data.declarations.last_page);
        } catch (error) {
            console.error("Erreur lors de la récupération des déclarations", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, filters]);

    // Fonction pour changer un filtre facilement
    const handleFilterChange = (key: keyof CompanyFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // On revient à la page 1 lors d'une nouvelle recherche
    };

    // Récupération de la liste des banques
    const fetchBanks = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/company/banks');
            setBanks(response.data.banks || response.data);
        } catch (error) {
            console.error("Erreur lors de la récupération des banques", error);
        }
    }, []);

    // Initialiser un nouveau paiement
    const initiatePayment = async (data: any) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('period', new Date().toISOString().split('T')[0]);
            formData.append('amount', data.amount);
            formData.append('payment_mode', data.payment_mode); 
            
            const isMobileMoney = ['mobile_money', 'orange_money'].includes(data.payment_mode);

            // Gestion dynamique selon le type de paiement
            if (isMobileMoney) {
                if (data.mobile_reference) formData.append('mobile_reference', data.mobile_reference);
            } else {
                if (data.bank_id) formData.append('bank_id', data.bank_id);
                if (data.reference) formData.append('reference', data.reference);
                if (data.file) formData.append('proof_pdf', data.file);
            }
            
            await axiosInstance.post('/company/declarations', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            await fetchDeclarations();
            return { success: true, message: "Paiement transmis." };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur d'initialisation." };
        } finally {
            setIsSubmitting(false);
        }
    };

    // Corriger un paiement rejeté
    const editPayment = async (id: number, data: any) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('amount', data.amount);
            formData.append('payment_mode', data.payment_mode);
            formData.append('_method', 'PUT'); 

            const isMobileMoney = ['mobile_money', 'orange_money'].includes(data.payment_mode);

            // Gestion dynamique selon le type de paiement (Même logique qu'à l'initiation)
            if (isMobileMoney) {
                if (data.mobile_reference) formData.append('mobile_reference', data.mobile_reference);
            } else {
                if (data.bank_id) formData.append('bank_id', data.bank_id);
                if (data.reference) formData.append('reference', data.reference);
                if (data.file) formData.append('proof_pdf', data.file);
            }

            await axiosInstance.post(`/company/declarations/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            await fetchDeclarations();
            return { success: true, message: "Déclaration mise à jour." };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur de mise à jour." };
        } finally {
            setIsSubmitting(false);
        }
    };

    // ========================================================
    // Fonction de téléchargement de la preuve bancaire (Interne / Blob)
    // ========================================================
    const downloadProof = async (id: number, reference: string) => {
        try {
            // Note: La route /declarations/{id}/download-proof est en dehors du groupe "company"
            const response = await axiosInstance.get(`/declarations/${id}/download-proof`, {
                responseType: 'blob', 
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Preuve_${reference || id}.pdf`);
            document.body.appendChild(link);
            link.click();
            
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            return { success: true };
        } catch (error: any) {
            console.error("Erreur de téléchargement de la preuve", error);
            if (error.response?.status === 404) {
                return { success: false, message: "Le fichier n'est pas disponible ou inexistant." };
            }
            return { success: false, message: "Impossible de télécharger le document." };
        }
    };

    // ========================================================
    // NOUVEAU : Téléchargement de la quittance via le proxy Backend (Blob)
    // ========================================================
    const downloadReceipt = async (id: number, reference: string) => {
        try {
            // Utilisation du nouvel endpoint backend qui lit le fichier FTP pour nous
            const response = await axiosInstance.get(`/company/declarations/${id}/download-receipt`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Quittance_CNPS_${reference || id}.pdf`);
            document.body.appendChild(link);
            link.click();
            
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            return { success: true };
        } catch (error: any) {
            console.error("Erreur de téléchargement de la quittance", error);
            if (error.response?.status === 404) {
                return { success: false, message: error.response?.data?.message || "La quittance n'est pas encore disponible." };
            }
            return { success: false, message: "Impossible de récupérer la quittance depuis la CNPS." };
        }
    };

    return {
        declarations, activeDeclaration, banks, isLoading, isSubmitting, 
        page, setPage, totalPages, filters, handleFilterChange, 
        fetchDeclarations, fetchBanks, initiatePayment, editPayment, 
        downloadProof, downloadReceipt
    };
};