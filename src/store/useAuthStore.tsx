import { create } from 'zustand';
import { User } from '../types';

// 1. Définition du "Contrat" (Ce que notre magasin va contenir)
interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean; // Très utile pour afficher un "loader" pendant qu'on vérifie la session
    
    // Les actions possibles
    login: (user: User, token: string) => void;
    logout: () => void;
    setUser: (user: User) => void;
    setLoading: (status: boolean) => void;
}

// 2. Création du magasin (Store) Zustand
const useAuthStore = create<AuthState>((set) => ({
    // État initial (Au rafraîchissement de la page)
    user: null,
    // On vérifie immédiatement si un token traîne dans le navigateur
    token: localStorage.getItem('verif_cnps_token') || null,
    isAuthenticated: !!localStorage.getItem('verif_cnps_token'),
    isLoading: true, // Par défaut à true jusqu'à ce qu'on valide le token avec l'API Laravel

    // Action : Quand l'utilisateur se connecte avec succès
    login: (user, token) => {
        // On sauvegarde le passeport dans le coffre-fort du navigateur
        localStorage.setItem('verif_cnps_token', token);
        // On met à jour la mémoire de React
        set({ user, token, isAuthenticated: true, isLoading: false });
    },

    // Action : Quand l'utilisateur se déconnecte
    logout: () => {
        localStorage.removeItem('verif_cnps_token');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    },

    // Action : Pour mettre à jour le profil (ex: après un rechargement de page via la route /api/me)
    setUser: (user) => {
        set({ user, isAuthenticated: true, isLoading: false });
    },

    // Action : Pour gérer l'affichage du loader
    setLoading: (status) => {
        set({ isLoading: status });
    }
}));

export default useAuthStore;