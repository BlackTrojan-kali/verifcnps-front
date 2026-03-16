import { useState, useCallback } from 'react';
import axiosInstance from '../../config/axios';
import { Declaration } from '../../types';

export const useBankHistory = () => {
    const [declarations, setDeclarations] = useState<Declaration[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    // Récupérer l'historique
    const fetchDeclarations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosInstance.get('/bank/declarations', {
                params: { 
                    page, 
                    reference: searchTerm // On cherche par référence côté backend
                }
            });
            setDeclarations(response.data.data);
            setTotalPages(response.data.last_page);
        } catch (error) {
            console.error("Erreur lors de la récupération de l'historique", error);
        } finally {
            setIsLoading(false);
        }
    }, [page, searchTerm]);

    // Valider un paiement (Transférer à la CNPS)
    const validatePayment = async (id: number, reference: string, orderReference?: string) => {
        setIsActionLoading(true);
        try {
            const payload: any = { reference };
            if (orderReference) payload.order_reference = orderReference;

            const response = await axiosInstance.put(`/bank/declarations/${id}/validate`, payload);
            
            // Mise à jour optimiste du statut
            setDeclarations(prev => prev.map(dec => 
                dec.id === id ? { ...dec, status: 'bank_validated', reference, order_reference: orderReference } : dec
            ));
            
            return { success: true, message: response.data.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur de validation." };
        } finally {
            setIsActionLoading(false);
        }
    };

    // Rejeter un paiement
    const rejectPayment = async (id: number, comment: string) => {
        setIsActionLoading(true);
        try {
            const response = await axiosInstance.put(`/bank/declarations/${id}/reject`, { comment_reject: comment });
            
            setDeclarations(prev => prev.map(dec => 
                dec.id === id ? { ...dec, status: 'rejected', comment_reject: comment } : dec
            ));
            
            return { success: true, message: response.data.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || "Erreur lors du rejet." };
        } finally {
            setIsActionLoading(false);
        }
    };

    return {
        declarations,
        isLoading,
        isActionLoading,
        page,
        setPage,
        totalPages,
        searchTerm,
        setSearchTerm,
        fetchDeclarations,
        validatePayment,
        rejectPayment
    };
};