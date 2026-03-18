import { useState, useCallback } from 'react';
import axiosInstance from '../../config/axios';

// 1. On définit la structure exacte de ce que renvoie notre backend Laravel
export interface BankDashboardStats {
    kpis: {
        pendingCount: number;
        validatedCount: number;
        rejectedCount: number;
        totalCollected: number;
    };
    paymentModeData: {
        name: string;
        value: number;
        color: string;
    }[];
    trendData: {
        date: string;
        amount: number;
    }[];
}

export interface DashboardFilters {
    start_date: string;
    end_date: string;
}

export const useBankDashboard = () => {
    const [stats, setStats] = useState<BankDashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Filtres de dates (Optionnel, mais utile si la banque veut voir un mois précis)
    const [filters, setFilters] = useState<DashboardFilters>({
        start_date: '',
        end_date: ''
    });

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            // Appel à la nouvelle route que nous venons de créer
            const response = await axiosInstance.get('/bank/dashboard-stats', { 
                params: filters 
            });
            setStats(response.data);
        } catch (error) {
            console.error("Erreur lors de la récupération des statistiques de la banque", error);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    const handleFilterChange = (key: keyof DashboardFilters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return {
        stats,
        isLoading,
        filters,
        handleFilterChange,
        fetchStats
    };
};