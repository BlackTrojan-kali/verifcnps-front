import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { UserRole } from '../types';

interface ProtectedRouteProps {
    allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    // On récupère les infos depuis notre "cerveau" Zustand
    const { isAuthenticated, user, isLoading } = useAuthStore();

    // 1. Si on est en train de vérifier le token avec Laravel au rafraîchissement
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                {/* Un petit texte de chargement (à remplacer par un beau spinner plus tard) */}
                <div className="text-lg font-semibold text-gray-600">Vérification des accès...</div>
            </div>
        );
    }

    // 2. Si l'utilisateur n'est pas connecté du tout, on l'envoie à la porte (Login)
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Si l'utilisateur est connecté mais essaie d'aller dans le mauvais espace 
    // (ex: une banque qui tape l'URL /cnps)
    if (!allowedRoles.includes(user.role)) {
        // On le renvoie de force vers son propre tableau de bord
        return <Navigate to={`/${user.role}`} replace />;
    }

    // 4. Tout est bon ! L'Outlet agit comme une porte qui s'ouvre vers la page demandée
    return <Outlet />;
};