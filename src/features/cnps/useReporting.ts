import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '../../config/axios';

// Définition des types pour nos statistiques
export interface DashboardStats {
    kpis: {
        totalCollected: number;
        reconciliationRate: number;
        rejectedCount: number;
    };
    bankChartData: { name: string; amount: number }[];
    paymentModeData: { name: string; value: number; color: string }[];
}

export const useReporting = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    
    // État pour la période
    const [dateRange, setDateRange] = useState({
        start_date: '2026-01-01',
        end_date: '2026-03-31'
    });

    const [stats, setStats] = useState<DashboardStats | null>(null);

    const fetchStatistics = useCallback(async () => {
        setIsLoading(true);
        try {
            // Nettoyage des paramètres vides
            const cleanParams = Object.fromEntries(
                Object.entries(dateRange).filter(([_, v]) => v !== '')
            );
            
            const response = await axiosInstance.get('/cnps/statistics', { 
                params: cleanParams 
            });
            setStats(response.data);
        } catch (error) {
            console.error("Erreur lors du chargement des statistiques", error);
        } finally {
            setIsLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchStatistics();
    }, [fetchStatistics]);

    // ========================================================
    // EXPORTATION DU RAPPORT PDF (Connecté au vrai backend)
    // ========================================================
    const exportReport = async () => {
        setIsExporting(true);
        try {
            const cleanParams = Object.fromEntries(
                Object.entries(dateRange).filter(([_, v]) => v !== '')
            );

            // On fait l'appel vers la route backend qui génère le PDF via Barryvdh\DomPDF
            const response = await axiosInstance.get('/cnps/reports/declarations/pdf', {
                params: cleanParams,
                responseType: 'blob' // CRUCIAL pour indiquer à Axios qu'on attend un fichier
            });

            // Logique standard pour forcer le téléchargement du fichier dans le navigateur
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Rapport_CNPS_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            
            // Nettoyage
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error: any) {
            console.error("Erreur lors de l'exportation PDF", error);
            alert("Une erreur est survenue lors de la génération du rapport.");
        } finally {
            setIsExporting(false);
        }
    };

    return {
        stats,
        isLoading,
        dateRange,
        setDateRange,
        exportReport,
        isExporting
    };
};