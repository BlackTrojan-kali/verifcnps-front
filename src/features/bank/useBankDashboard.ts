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

  const fetchStats = useCallback(async (filters = {}) => {
        setIsLoading(true);
        try {
            const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
            const response = await axiosInstance.get('/bank/dashboard-stats', { params: cleanFilters });
            setStats(response.data);
        } catch (error) {
            console.error("Erreur stats", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

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