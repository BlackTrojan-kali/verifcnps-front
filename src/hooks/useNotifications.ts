import { useState, useCallback, useEffect } from 'react';
import axiosInstance from '../config/axios';
import { AppNotification } from '../types';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Récupérer uniquement les notifications non lues
    const fetchUnreadNotifications = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/notifications/unread');
            const data = response.data.notifications || [];
            setNotifications(data);
            setUnreadCount(data.length);
        } catch (error) {
            console.error("Erreur lors de la récupération des notifications", error);
        }
    }, []);

    // Le fameux "Polling" : on vérifie les nouveautés toutes les 60 secondes
    useEffect(() => {
        fetchUnreadNotifications(); // 1er chargement immédiat
        
        const interval = setInterval(() => {
            fetchUnreadNotifications();
        }, 60000); 

        return () => clearInterval(interval); // Nettoyage quand on quitte la page
    }, [fetchUnreadNotifications]);

    // Marquer une seule notification comme lue
    const markAsRead = async (id: string) => {
        try {
            await axiosInstance.put(`/notifications/mark-as-read/${id}`);
            // Mise à jour optimiste de l'interface
            setNotifications(prev => prev.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Erreur", error);
        }
    };

    // Tout marquer comme lu d'un coup
    const markAllAsRead = async () => {
        try {
            await axiosInstance.post('/notifications/mark-all-as-read');
            setNotifications([]);
            setUnreadCount(0);
            setIsDropdownOpen(false); // On ferme le menu
        } catch (error) {
            console.error("Erreur", error);
        }
    };

    return {
        notifications,
        unreadCount,
        isDropdownOpen,
        setIsDropdownOpen,
        markAsRead,
        markAllAsRead
    };
};