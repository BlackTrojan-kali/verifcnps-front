import { useState, useCallback } from 'react';
import axiosInstance from '../../config/axios';
import { Declaration, Bank } from '../../types';

export interface Filters {
    search: string;
    status: string;
    payment_mode: string; // <-- AJOUTÉ : Filtre par mode de paiement
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
        search: '', status: '', payment_mode: '', start_date: '', end_date: '', bank_id: ''
    });

    const fetchDeclarations = useCallback(async () => {
        setIsLoading(true);
        try {
            // On retire les filtres vides pour ne pas surcharger l'URL
            const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
            
            const response = await axiosInstance.get('/cnps/declarations', {
                params: { page, ...cleanFilters }
            });
            setDeclarations(response.data.data || response.data);
            setTotalPages(response.data.last_page || 1);
        } catch (error) {
            console.error("Erreur lors de la récupération des déclarations", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, filters]);

    // Note : Puisque la CNPS ne gère plus les banques, cet endpoint doit pointer vers 
    // une route globale (ex: /supervisor/banks ou route publique)
    const fetchBanks = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/supervisor/banks'); // Ajustez l'URL selon vos routes réelles
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
            const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
            
            const response = await axiosInstance.get('/cnps/reports/declarations/pdf', {
                params: cleanFilters,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Rapport_CNPS_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
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
            const response = await axiosInstance.put(`/cnps/declarations/${id}/reconcile`);
            
            // Mise à jour de la liste locale pour refléter le changement (et ajout des infos venant du back si besoin)
            setDeclarations(prevDeclarations => 
                prevDeclarations.map(dec => 
                    dec.id === id ? { ...dec, status: 'cnps_validated' } : dec
                )
            );
            return { success: true, message: response.data.message };
        } catch (error: any) {
            console.error("Erreur lors du rapprochement", error);
            return { success: false, message: error.response?.data?.message || "Erreur de rapprochement." };
        } finally {
            setIsActionLoading(false);
        }
    };

    // ========================================================
    // Fonction pour rejeter un paiement (CNPS)
    // ========================================================
    const rejectPayment = async (id: number, comment_reject: string) => {
        setIsActionLoading(true);
        try {
            const response = await axiosInstance.put(`/cnps/declarations/${id}/reject`, { comment_reject });
            
            setDeclarations(prevDeclarations => 
                prevDeclarations.map(dec => 
                    dec.id === id ? { ...dec, status: 'rejected', comment_reject } : dec
                )
            );
            return { success: true, message: response.data.message };
        } catch (error: any) {
            console.error("Erreur lors du rejet", error);
            return { success: false, message: error.response?.data?.message || "Une erreur est survenue lors du rejet." };
        } finally {
            setIsActionLoading(false);
        }
    };

    const uploadReceipt = async (id: number, url: string) => {
        setIsActionLoading(true);
        try {
            // On envoie un simple objet JSON avec l'URL
            const payload = { receipt_url: url };
            const response = await axiosInstance.post(`/cnps/declarations/${id}/receipt`, payload);

            // Met à jour la liste localement pour afficher que la quittance est bien liée
            setDeclarations(prevDeclarations => 
                prevDeclarations.map(dec => 
                    dec.id === id ? { ...dec, receipt_path: url } : dec
                )
            );
            
            return { success: true, message: response.data.message };
        } catch (error: any) {
            console.error("Erreur lors de l'enregistrement du lien de la quittance", error);
            return { 
                success: false, 
                message: error.response?.data?.message || "Erreur lors de l'enregistrement du lien." 
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
            link.setAttribute('download', `Preuve_CNPS_${reference || id}.pdf`);
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
        rejectPayment,
        isActionLoading,
        downloadProof,
        uploadReceipt
    };
};