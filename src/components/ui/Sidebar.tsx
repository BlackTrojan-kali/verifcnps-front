import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, 
    BarChart3, 
    Receipt, 
    Settings, 
    FileText, 
    History,
    ChevronLeft,
    ChevronRight,
    Shield,
    Building2, // Ajout d'une icône pour les banques
    Users      // Ajout d'une icône pour les utilisateurs
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { Dropdown } from './Dropdown';

// ==========================================
// 1. DÉFINITION DU TYPE POUR TYPESCRIPT
// ==========================================
type SidebarItem = {
    title: string;
    icon: JSX.Element;
    path?: string;
    children?: { label: string; path: string; }[];
    requiresAdmin?: boolean; // <-- Ajout de la propriété pour protéger le menu
};

// ==========================================
// 2. CONFIGURATION DES MENUS PAR RÔLE
// ==========================================

const CNPS_MENU: SidebarItem[] = [
    { title: 'Supervision', path: '/cnps', icon: <LayoutDashboard size={20} /> },
    { title: 'Reporting & Stats', path: '/cnps/reporting', icon: <BarChart3 size={20} /> },
    { title: 'Quittances', path: '/cnps/quittances', icon: <Receipt size={20} /> },
    { 
        title: 'Administration', 
        icon: <Settings size={20} />, 
        requiresAdmin: true, // <-- Réservé aux admins CNPS
        children: [
            { label: 'Gérer les Agents CNPS', path: '/cnps/agents' }
            // Note: Gérer les banques a été déplacé chez le superviseur
        ] 
    }
];

const SUPERVISOR_MENU: SidebarItem[] = [
    { title: 'Tableau de bord global', path: '/supervisor', icon: <LayoutDashboard size={20} /> },
    { title: 'Toutes les déclarations', path: '/supervisor/declarations', icon: <FileText size={20} /> },
    { 
        title: 'Administration Système', 
        icon: <Settings size={20} />, 
        children: [
            { label: 'Gérer les Banques', path: '/supervisor/banks' },
            // Vous pourrez ajouter d'autres éléments d'administration globale ici plus tard
        ] 
    }
];

const BANK_MENU: SidebarItem[] = [
    { title: 'Tableau de bord', path: '/bank', icon: <LayoutDashboard size={20} /> },
    { title: 'Historique Dépôts', path: '/bank/history', icon: <History size={20} /> },
    { 
        title: 'Gestion Agence', 
        icon: <Users size={20} />, 
        requiresAdmin: true, // <-- Réservé au chef d'agence
        children: [
            { label: 'Mes Guichetiers', path: '/bank/agents' }
        ] 
    }
];

const COMPANY_MENU: SidebarItem[] = [
    { title: 'Tableau de bord', path: '/company', icon: <LayoutDashboard size={20} /> },
    { title: 'Mes Déclarations', path: '/company/declarations', icon: <FileText size={20} /> },
];


export const Sidebar = () => {
    const { user } = useAuthStore();
    
    // État pour savoir si la barre est repliée ou ouverte
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Fonction pour récupérer le bon menu selon le rôle
    const getMenu = (): SidebarItem[] => {
        if (!user) return [];
        switch (user.role) {
            case 'supervisor':
                return SUPERVISOR_MENU;

            case 'cnps':
                // On filtre le menu : on garde les items normaux, et on ne garde les items admin QUE si l'utilisateur est admin
                return CNPS_MENU.filter(item => !item.requiresAdmin || user.cnps?.is_admin);
                
            case 'bank': 
                // Idem pour la banque (chef d'agence vs guichetier)
                return BANK_MENU.filter(item => !item.requiresAdmin || user.bank?.is_admin);

            case 'company': 
                return COMPANY_MENU;
                
            default: return [];
        }
    };

    const currentMenu = getMenu();

    return (
        <aside 
            className={`relative flex min-h-screen flex-col bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out ${
                isCollapsed ? 'w-20' : 'w-64'
            }`}
        >
            {/* 2. EN-TÊTE / LOGO */}
            <div className="flex h-16 items-center justify-center border-b border-slate-800 bg-slate-950">
                {isCollapsed ? (
                    <Shield className="h-8 w-8 text-blue-500" />
                ) : (
                    <div className="flex items-center gap-3 font-bold text-white">
                        <Shield className="h-8 w-8 text-blue-500" />
                        <div>
                        <span className="text-xl tracking-wide uppercase">
                            {user?.role === 'cnps' ? 'DANAZ Pay' : user?.role}
                        </span>
                        <br />
                        <span className='text-sm font-light'>by B2i & Partners</span>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. LISTE DES LIENS DE NAVIGATION */}
            <nav className="flex-1 space-y-2 overflow-y-auto p-4 scrollbar-hide">
                {currentMenu.map((item, index) => {
                    // Si le menu a des sous-menus (ex: Administration)
                    if (item.children) {
                        return isCollapsed ? (
                            // Si c'est replié, on affiche juste l'icône qui force l'ouverture au clic
                            <button 
                                key={index}
                                onClick={() => setIsCollapsed(false)}
                                className="flex w-full justify-center rounded-md p-3 text-slate-400 hover:bg-slate-800 hover:text-white"
                                title={item.title}
                            >
                                {item.icon}
                            </button>
                        ) : (
                            // Si c'est ouvert, on utilise notre super composant Dropdown
                            <Dropdown 
                                key={index} 
                                title={item.title} 
                                icon={item.icon} 
                                items={item.children} 
                            />
                        );
                    }

                    // Si c'est un lien normal (sans sous-menu)
                    return (
                        <NavLink
                            key={index}
                            to={item.path || '#'}
                            // 'end' permet de ne pas surligner la racine quand on est sur une sous-page
                            end={item.path === `/${user?.role}`} 
                            title={isCollapsed ? item.title : ''}
                            className={({ isActive }) =>
                                `flex items-center rounded-md transition-colors ${
                                    isCollapsed ? 'justify-center p-3' : 'px-4 py-3 gap-3'
                                } ${
                                    isActive 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            {item.icon}
                            {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
                        </NavLink>
                    );
                })}
            </nav>

            {/* 4. BOUTON POUR REPLIER / DÉPLIER (En bas de la barre) */}
            <div className="border-t border-slate-800 p-4">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex w-full items-center justify-center rounded-md bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                >
                    {isCollapsed ? <ChevronRight size={20} /> : (
                        <div className="flex items-center gap-2">
                            <ChevronLeft size={20} />
                            <span className="text-sm font-medium">Réduire le menu</span>
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
};