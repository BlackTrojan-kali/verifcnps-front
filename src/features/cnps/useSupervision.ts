import { useState, useCallback } from 'react';
import axiosInstance from '../../config/axios';
import { Declaration, Bank } from '../../types'; // N'oubliez pas d'importer Bank

export interface Filters {
    search: string;
    status: string;
    start_date: string;
    end_date: string;
    bank_id: string; // <-- NOUVEAU : On ajoute le filtre de la banque
}

export const useSupervision = () => {
    const [declarations, setDeclarations] = useState<Declaration[]>([]);
    const [banks, setBanks] = useState<Bank[]>([]); // <-- NOUVEAU : Pour stocker la liste des banques
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState<Filters>({
        search: '', status: '', start_date: '', end_date: '', bank_id: '' // Initialisé à vide
    });

    // Fonction pour récupérer les déclarations
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

    // <-- NOUVEAU : Fonction pour récupérer la liste des banques pour le filtre
    const fetchBanks = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/cnps/banks');
            // On suppose que Laravel renvoie { banks: [...] } ou directement le tableau
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
        } catch (error) {
            console.error("Erreur lors du rapprochement", error);
            alert("Une erreur est survenue lors de la validation du paiement.");
        } finally {
            setIsActionLoading(false);
        }
    };

    return {
        declarations,
        banks, // On l'exporte pour le menu déroulant
        isLoading,
        filters,
        handleFilterChange,
        page,
        setPage,
        totalPages,
        exportPdf,
        isExporting,
        fetchDeclarations,
        fetchBanks, // On l'exporte pour le charger au démarrage
        reconcilePayment,
        isActionLoading
    };
};