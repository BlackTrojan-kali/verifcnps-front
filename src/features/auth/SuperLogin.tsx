import React from 'react';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
// Ajustez ce chemin selon l'emplacement réel de votre hook
import { useLogin } from './useLogin'; 

const SuperLogin = () => {
  // On initialise notre hook avec le rôle attendu 'supervisor'
  const {
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    isLoading,
    error,
    handleLogin
  } = useLogin('supervisor');

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* PARTIE GAUCHE (Visuel) - Masquée sur petits écrans */}
      <div className="hidden w-1/2 flex-col items-center justify-center bg-indigo-950 p-12 text-white lg:flex">
        <div className="flex flex-col items-center text-center">
          <Shield className="mb-6 h-20 w-20 text-indigo-400" />
          <h1 className="mb-4 text-4xl font-bold">Espace Supervision</h1>
          <p className="text-lg font-medium italic opacity-90 text-indigo-200">
            "Le contrôle et la visibilité globale sur toutes les transactions."
          </p>
        </div>
      </div>

      {/* PARTIE DROITE (Formulaire) */}
      <div className="flex w-full flex-col items-center justify-center px-8 sm:px-16 lg:w-1/2">
        <div className="w-full max-w-sm text-center">
          
          {/* Logo visible uniquement sur mobile */}
          <Shield className="mx-auto mb-4 h-12 w-12 text-indigo-900 lg:hidden" />
          
          <h2 className="mb-2 text-2xl font-bold text-indigo-950">Portail Superviseur</h2>
          <p className="mb-8 text-sm text-slate-500">Connectez-vous pour accéder au tableau de bord global.</p>

          {/* Affichage des erreurs */}
          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 text-left">
            
            {/* Champ Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Adresse email</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors" 
                placeholder="admin@superviseur.cm" 
              />
            </div>
            
            {/* Champ Mot de passe */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-2.5 pr-12 text-sm focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition-colors" 
                  placeholder="••••••••" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            {/* Bouton de soumission */}
            <button 
              type="submit" 
              disabled={isLoading} 
              className="flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Accéder au portail'
              )}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuperLogin;