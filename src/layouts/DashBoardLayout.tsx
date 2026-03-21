
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/ui/Sidebar';
import Header from '../components/ui/Header';

const DashboardLayout = () => {
    return (
        // Le conteneur principal prend toute la hauteur de l'écran (h-screen)
        // et cache ce qui déborde (overflow-hidden) pour éviter le double défilement.
        <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
            
            {/* 1. Notre barre latérale dynamique à gauche */}
            <Sidebar />

            {/* 2. Le conteneur droit (qui prend tout l'espace restant avec flex-1) */}
            <div className="flex flex-1 flex-col overflow-hidden">
                
                {/* 2.A L'en-tête supérieur avec la cloche et le profil */}
                <Header />

                {/* 2.B La zone de contenu dynamique (C'est elle seule qui défile verticalement) */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    
                    {/* <Outlet /> est la "fenêtre" de React Router. 
                      C'est ici que s'afficheront vos tableaux, graphiques et formulaires.
                    */}
                    <Outlet />
                    
                </main>
                
            </div>
        </div>
    );
};
export default DashboardLayout