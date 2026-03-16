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
    
    // État pour la période (Ex: Mois en cours par défaut)
    const [dateRange, setDateRange] = useState({
        start_date: '2026-01-01',
        end_date: '2026-03-31'
    });

    const [stats, setStats] = useState<DashboardStats | null>(null);

   const fetchStatistics = useCallback(async () => {
        setIsLoading(true);
        try {
            // ON APPELLE LE VRAI BACKEND LARAVEL !
            const response = await axiosInstance.get('/cnps/statistics', { params: dateRange });
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

    const exportReport = async () => {
        setIsExporting(true);
        // Logique d'exportation PDF/Excel ici...
        setTimeout(() => setIsExporting(false), 1500);
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