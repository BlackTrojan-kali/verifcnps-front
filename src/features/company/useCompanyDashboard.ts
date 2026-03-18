import { useState, useCallback } from 'react';
import axiosInstance from '../../config/axios';
import { Declaration, Bank } from '../../types';

// INDISPENSABLE : On définit l'interface pour que TypeScript connaisse la structure de nos filtres
export interface CompanyFilters {
    reference: string;
    bank_id: string;
    start_date: string;
    end_date: string;
}

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
    
    // On isole la déclaration la plus récente pour la barre de progression
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
            console.error("Erreur lors de la récupération des déclarations", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, filters]);

    // NOUVEAU : Fonction pour changer un filtre facilement
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
            formData.append('bank_id', data.bank_id);
            formData.append('reference', data.reference);
            formData.append('period', new Date().toISOString().split('T')[0]);
            formData.append('amount', data.amount);
            formData.append('payment_mode', data.payment_mode);
            formData.append('status', 'submited'); // On soumet direct à la banque ou CNPS
            
            if (data.file) formData.append('proof_pdf', data.file);

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
            formData.append('bank_id', data.bank_id);
            formData.append('reference', data.reference);
            formData.append('amount', data.amount);
            formData.append('payment_mode', data.payment_mode);
            formData.append('status', 'submited'); // Si on corrige un rejet, on le resoumet
            
            formData.append('_method', 'PUT'); 

            if (data.file) formData.append('proof_pdf', data.file);

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
    // NOUVEAU : Fonction de téléchargement du reçu PDF
    // ========================================================
    const downloadProof = async (id: number, reference: string) => {
        try {
            const response = await axiosInstance.get(`/declarations/${id}/download-proof`, {
                responseType: 'blob', // Indispensable pour récupérer un fichier
            });

            // Création d'un lien virtuel en mémoire pour forcer le téléchargement
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Preuve_${reference}.pdf`); // Nom du fichier
            document.body.appendChild(link);
            link.click();
            
            // Nettoyage pour ne pas surcharger la mémoire du navigateur
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            return { success: true };
        } catch (error: any) {
            console.error("Erreur de téléchargement", error);
            // On gère l'erreur 404 spécifiquement si le fichier n'existe pas
            if (error.response?.status === 404) {
                return { success: false, message: "Le fichier n'est pas disponible ou inexistant." };
            }
            return { success: false, message: "Impossible de télécharger le document." };
        }
    };
// ========================================================
    // NOUVEAU : Fonction pour télécharger la QUITTANCE officielle
    // ========================================================
    const downloadReceipt = async (id: number, reference: string) => {
        try {
            const response = await axiosInstance.get(`/company/declarations/${id}/download-receipt`, {
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
            console.error("Erreur de téléchargement", error);
            if (error.response?.status === 404) {
                alert("La quittance officielle n'a pas encore été rattachée par la CNPS.");
            } else {
                alert("Impossible de télécharger la quittance.");
            }
            return { success: false };
        }
    };
    return {
        declarations, activeDeclaration, banks, isLoading, isSubmitting, 
        page, setPage, totalPages, filters, handleFilterChange, 
        fetchDeclarations, fetchBanks, initiatePayment, editPayment, downloadProof ,downloadReceipt// N'oubliez pas l'export !
    };
};