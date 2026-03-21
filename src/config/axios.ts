import axios from 'axios';

// 1. Création de l'instance de base
// On utilise les variables d'environnement de Vite (VITE_API_URL)
// Si elle n'existe pas, on pointe par défaut sur le serveur local de Laravel
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials:true
});
// 2. Intercepteur de REQUÊTE (Avant que le message ne parte vers Laravel)
axiosInstance.interceptors.request.use(
    (config) => {
        // On va chercher le token de sécurité là où on va le stocker (dans le localStorage)
        const token = localStorage.getItem('verif_cnps_token');

        // Si on a un token, on l'attache automatiquement à l'en-tête de la requête
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Intercepteur de RÉPONSE (Quand Laravel nous répond)
axiosInstance.interceptors.response.use(
    (response) => {
        // Si tout va bien, on laisse passer la réponse
        return response;
    },
    (error) => {
        // Si Laravel nous renvoie une erreur 401 (Non Autorisé / Token expiré)
        if (error.response && error.response.status === 401) {
            // On supprime le token invalide
            localStorage.removeItem('verif_cnps_token');
            
            // Si on n'est pas déjà sur la page de login, on force la redirection
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

export default axiosInstance;