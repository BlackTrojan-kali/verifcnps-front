import  { useState, useRef, useEffect } from 'react';
import { Bell, UserCircle, LogOut, Check, Info } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

const Header = () => {
    // 1. Authentification
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    
    // 2. Notifications
    const { 
        notifications, unreadCount, isDropdownOpen: isNotifOpen, 
        setIsDropdownOpen: setIsNotifOpen, markAsRead, markAllAsRead 
    } = useNotifications();

    // 3. États des menus déroulants
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    // Refs pour fermer les menus au clic à l'extérieur
    const profileRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    // Fonction pour déterminer le nom à afficher selon le rôle
    const getDisplayName = () => {
        if (!user) return 'Utilisateur';
        switch (user.role) {
            case 'cnps': return user.cnps?.full_name || 'Admin CNPS';
            case 'bank': return user.bank?.bank_name || 'Banque Partenaire';
            case 'company': return user.company?.raison_sociale || 'Entreprise';
            default: return 'Utilisateur';
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Gestion de la fermeture des dropdowns au clic à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setIsNotifOpen]);

    return (
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-end border-b border-slate-200 bg-white px-6 shadow-sm">
            
            <div className="flex items-center gap-6">
                
                {/* 1. La Cloche de Notifications Dynamique */}
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => {
                            setIsNotifOpen(!isNotifOpen);
                            setIsProfileOpen(false); // Ferme l'autre menu s'il est ouvert
                        }}
                        className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Menu Déroulant des Notifications */}
                    {isNotifOpen && (
                        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-slate-100 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50 rounded-t-xl">
                                <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={markAllAsRead}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                                    >
                                        Tout marquer comme lu
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[350px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                                        <Bell size={24} className="mb-2 text-slate-300" />
                                        <p className="text-sm">Aucune nouvelle notification.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {notifications.map((notif) => (
                                            <div 
                                                key={notif.id} 
                                                className="group flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                                                onClick={() => markAsRead(notif.id)}
                                            >
                                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                                    <Info size={16} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-slate-800">
                                                        {notif.data.message || "Mise à jour de statut"}
                                                    </p>
                                                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                                                        <span className="font-mono">{notif.data.reference}</span>
                                                        <span>Nouveau</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-emerald-500"
                                                    title="Marquer comme lu"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Séparateur vertical */}
                <div className="h-6 w-px bg-slate-200"></div>

                {/* 2. Le Profil Utilisateur */}
                <div className="relative" ref={profileRef}>
                    <button 
                        onClick={() => {
                            setIsProfileOpen(!isProfileOpen);
                            setIsNotifOpen(false); // Ferme l'autre menu s'il est ouvert
                        }}
                        className="flex items-center gap-3 rounded-md p-1 pr-2 transition-colors hover:bg-slate-50"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                            <UserCircle size={20} />
                        </div>
                        
                        <span className="text-sm font-semibold text-slate-700">
                            {getDisplayName()}
                        </span>
                    </button>

                    {/* Menu Déroulant pour se déconnecter */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md border border-slate-100 bg-white py-1 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100 bg-slate-50">
                                <span className="block font-semibold text-slate-800 truncate">{getDisplayName()}</span>
                                <span className="block text-xs text-slate-500 mt-0.5 truncate">{user?.email || 'email@introuvable.com'}</span>
                            </div>
                            <div className="py-1">
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut size={16} className="mr-2" />
                                    Se déconnecter
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
};

export default Header;