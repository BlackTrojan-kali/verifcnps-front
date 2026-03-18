import { useState, useCallback } from 'react';
import axiosInstance from '../../config/axios';
import { Declaration, Bank } from '../../types';

export interface Filters {
    search: string;
    status: string;
    start_date: string;
    end_date: string;
    bank_id: string; 
}

export const useSupervision = () => {
    const [declarations, setDeclarations] = useState<Declaration[]>([]);
    const [banks, setBanks] = useState<Bank[]>([]); 
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<Filters>({
        search: '', status: '', start_date: '', end_date: '', bank_id: ''
    });

    const fetchDeclarations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/cnps/declarations', {
                params: { page, ...filters }
            });
            setDeclarations(response.data.data);
            setTotalPages(response.data.last_page);
        } catch (error) {
            console.error("Erreur lors de la récupération des déclarations", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, filters]);

    const fetchBanks = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/cnps/banks');
            setBanks(response.data.banks || response.data);
        } catch (error) {
            console.error("Erreur lors de la récupération des banques", error);
        }
    }, []);

    const handleFilterChange = (key: keyof Filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); 
    };

    const exportPdf = async () => {
        setIsExporting(true);
        try {
            const response = await axiosInstance.get('/cnps/reports/declarations/pdf', {
                params: filters,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Rapport_CNPS_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Erreur lors de l'exportation PDF", error);
            alert("Une erreur est survenue lors de la génération du rapport.");
        } finally {
            setIsExporting(false);
        }
    };

    const reconcilePayment = async (id: number) => {
        setIsActionLoading(true);
        try {
            await axiosInstance.put(`/cnps/declarations/${id}/reconcile`);
            setDeclarations(prevDeclarations => 
                prevDeclarations.map(dec => 
                    dec.id === id ? { ...dec, status: 'cnps_validated' } : dec
                )
            );
            return { success: true };
        } catch (error) {
            console.error("Erreur lors du rapprochement", error);
            alert("Une erreur est survenue lors de la validation du paiement.");
            return { success: false };
        } finally {
            setIsActionLoading(false);
        }
    };

    // ========================================================
    // NOUVEAU : Fonction d'upload de la quittance officielle
    // ========================================================
    const uploadReceipt = async (id: number, file: File) => {
        setIsActionLoading(true);
        try {
            const formData = new FormData();
            formData.append('receipt_pdf', file);

            const response = await axiosInstance.post(`/cnps/declarations/${id}/receipt`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Met à jour la liste localement pour afficher que la quittance est bien là
            setDeclarations(prevDeclarations => 
                prevDeclarations.map(dec => 
                    dec.id === id ? response.data.declaration : dec
                )
            );
            
            return { success: true, message: response.data.message };
        } catch (error: any) {
            console.error("Erreur lors de l'upload de la quittance", error);
            return { 
                success: false, 
                message: error.response?.data?.message || "Erreur lors de l'envoi du document." 
            };
        } finally {
            setIsActionLoading(false);
        }
    };

    const downloadProof = async (id: number, reference: string) => {
        try {
            const response = await axiosInstance.get(`/declarations/${id}/download-proof`, {
                responseType: 'blob', 
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Preuve_CNPS_${reference}.pdf`);
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

    return {
        declarations,
        banks, 
        isLoading,
        filters,
        handleFilterChange,
        page,
        setPage,
        totalPages,
        exportPdf,
        isExporting,
        fetchDeclarations,
        fetchBanks, 
        reconcilePayment,
        isActionLoading,
        downloadProof,
        uploadReceipt // <-- NOUVELLE FONCTION EXPORTÉE
    };
};