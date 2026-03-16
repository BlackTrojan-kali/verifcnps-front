import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';

// On définit la forme exacte de ce que ce composant attend
interface SubMenuItem {
    label: string;
    path: string;
}

interface DropdownProps {
    title: string;
    icon: React.ReactNode;
    items: SubMenuItem[];
}

export const Dropdown = ({ title, icon, items }: DropdownProps) => {
    const location = useLocation();
    
    // On vérifie si l'URL actuelle correspond à l'un des sous-menus
    // Cela permet de garder le menu ouvert et en surbrillance si on est sur une de ses pages
    const isChildActive = items.some(item => location.pathname.startsWith(item.path));
    
    // L'état d'ouverture du menu (ouvert par défaut si on est sur une de ses pages)
    const [isOpen, setIsOpen] = useState(isChildActive);

    // Si on navigue via l'URL directement vers une page enfant, on s'assure d'ouvrir le menu
    useEffect(() => {
        if (isChildActive) {
            setIsOpen(true);
        }
    }, [isChildActive]);

    return (
        <div className="flex flex-col">
            {/* 1. Le Bouton Parent (Ex: "Administration") */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                    isChildActive 
                        ? 'bg-blue-800 text-white' // Style actif (bleu plus clair)
                        : 'text-slate-300 hover:bg-blue-800/50 hover:text-white' // Style inactif
                }`}
            >
                <div className="flex items-center gap-3">
                    {/* L'icône (ex: la roue crantée) */}
                    {icon}
                    <span>{title}</span>
                </div>
                {/* La petite flèche qui tourne */}
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>

            {/* 2. Le Tiroir des Sous-menus (Avec animation d'ouverture) */}
            <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'
                }`}
            >
                {/* On décale un peu vers la droite (pl-11) pour montrer la hiérarchie */}
                <ul className="flex flex-col space-y-1 pl-11 pr-4">
                    {items.map((item, index) => (
                        <li key={index}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `block rounded-md px-3 py-2 text-sm transition-colors ${
                                        isActive
                                            ? 'bg-blue-800/80 text-white font-semibold' // Sous-menu sélectionné
                                            : 'text-slate-400 hover:bg-blue-800/30 hover:text-white' // Sous-menu normal
                                    }`
                                }
                            >
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};