import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../config/axios';
import useAuthStore from '../../store/useAuthStore';
import { UserRole } from '../../types';

export const useLogin = (expectedRole: UserRole) => {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    
    // Tous les états nécessaires au formulaire
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // La fonction magique qui s'occupe de tout
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await axiosInstance.post('/login', { email, password });
            const { user, access_token } = response.data;

            // Vérification du rôle
            if (user.role !== expectedRole) {
                // Utilisation d'un objet pour mapper facilement les rôles vers du texte lisible
                const roleNames: Record<string, string> = {
                    cnps: 'agents de la CNPS',
                    bank: 'partenaires bancaires',
                    supervisor: 'superviseurs',
                    company: 'entreprises' // Ajouté au cas où vous en auriez besoin plus tard
                };
                
                const roleName = roleNames[expectedRole as string] || expectedRole;
                
                setError(`Accès refusé. Ce portail est strictement réservé aux ${roleName}.`);
                setIsLoading(false);
                return;
            }

            // Enregistrement en mémoire et redirection
            login(user, access_token);
            navigate(`/${expectedRole}`);

        } catch (err: any) {
            setError(err.response?.data?.message || 'Identifiants incorrects. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    // On retourne ce dont les composants visuels auront besoin
    return {
        email, setEmail,
        password, setPassword,
        showPassword, setShowPassword,
        isLoading,
        error,
        handleLogin
    };
};