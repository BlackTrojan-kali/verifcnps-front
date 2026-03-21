import  { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import axiosInstance from '../../config/axios';

export const CompanySSOCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // ON UTILISE VOTRE MÉTHODE LOGIN !
    const { login } = useAuthStore(); 
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const authenticateCompany = async () => {
            const niu = searchParams.get('niu');
            const name = searchParams.get('raison_sociale');
            const amount = searchParams.get('amount');

            if (!niu) {
                setError("Paramètre NIU manquant dans l'URL de redirection.");
                return;
            }
            if (amount) {
    localStorage.setItem('amountToPay', amount);
}

            // On sauvegarde le montant à payer (provenant de l'ERP externe)
            if (amount) {
                sessionStorage.setItem('amountToPay', amount);
            }

            try {
                const response = await axiosInstance.post('/login-company', {
                    niu: niu,
                    name: name
                });

                const { access_token, user } = response.data;
                
                // 1. On appelle votre action Zustand (qui gère l'état et le localStorage)
                login(user, access_token);
                
                // 2. On injecte le token dans Axios pour les prochaines requêtes
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

                // 3. Redirection vers le tableau de bord
                navigate('/company', { replace: true });

            } catch (err) {
                console.error(err);
                setError("Échec de l'authentification avec la plateforme CNPS.");
            }
        };

        authenticateCompany();
    }, [searchParams, navigate, login]); // On ajoute 'login' aux dépendances

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
            {error ? (
                <div className="flex max-w-md flex-col items-center rounded-xl bg-white p-8 text-center shadow-lg border-t-4 border-red-500">
                    <AlertTriangle size={48} className="text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Erreur de connexion</h2>
                    <p className="text-slate-600">{error}</p>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-900">Connexion sécurisée en cours...</h2>
                    <p className="text-slate-500 mt-2">Veuillez patienter pendant que nous préparons votre espace.</p>
                </div>
            )}
        </div>
    );
};