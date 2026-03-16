import React from 'react';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLogin } from './useLogin';

export const BankLogin = () => {
    // On appelle notre Hook en lui disant : "Je m'attends à ce que ce soit une Banque"
    const { email, setEmail, password, setPassword, showPassword, setShowPassword, isLoading, error, handleLogin } = useLogin('bank');

    return (
        <div className="flex min-h-screen w-full bg-white">
            <div className="hidden w-1/2 flex-col items-center justify-center bg-emerald-600 p-12 text-white lg:flex">
                <div className="flex flex-col items-center text-center">
                    <Building2 className="mb-6 h-20 w-20" />
                    <h1 className="mb-4 text-4xl font-bold">Espace Partenaire Bancaire</h1>
                    <p className="text-lg font-medium italic opacity-90">Sécurisez et validez les encaissements en temps réel</p>
                </div>
            </div>

            <div className="flex w-full flex-col items-center justify-center px-8 sm:px-16 lg:w-1/2">
                <div className="w-full max-w-sm text-center">
                    <Building2 className="mx-auto mb-4 h-12 w-12 text-emerald-600 lg:hidden" />
                    <h2 className="mb-2 text-2xl font-bold text-emerald-600">Portail Bancaire</h2>
                    <p className="mb-8 text-sm text-slate-500">Validation des avis de virement et versements</p>

                    {error && <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

                    <form onSubmit={handleLogin} className="space-y-5 text-left">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Email Guichet</label>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" placeholder="guichet@banque.cm" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe</label>
                            <div className="relative">
                                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600" placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-70">
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Accéder au portail'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};