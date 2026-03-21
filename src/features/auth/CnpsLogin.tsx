
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLogin } from './useLogin';

export const CnpsLogin = () => {
    // On appelle notre Hook en lui disant : "Je m'attends à ce que ce soit la CNPS"
    const { email, setEmail, password, setPassword, showPassword, setShowPassword, isLoading, error, handleLogin } = useLogin('cnps');

    return (
        <div className="flex min-h-screen w-full bg-white">
            <div className="hidden w-1/2 flex-col items-center justify-center bg-blue-900 p-12 text-white lg:flex">
                <div className="flex flex-col items-center text-center">
                    <Shield className="mb-6 h-20 w-20" />
                    <h1 className="mb-4 text-4xl font-bold">CNPS Cameroun</h1>
                    <p className="text-lg font-medium italic opacity-90">"L'excellence opérationnelle au service de la sécurité sociale"</p>
                </div>
            </div>

            <div className="flex w-full flex-col items-center justify-center px-8 sm:px-16 lg:w-1/2">
                <div className="w-full max-w-sm text-center">
                    <Shield className="mx-auto mb-4 h-12 w-12 text-blue-900 lg:hidden" />
                    <h2 className="mb-2 text-2xl font-bold text-blue-900">Portail d'Administration CNPS</h2>
                    <p className="mb-8 text-sm text-slate-500">Rapprochement et supervision des cotisations</p>

                    {error && <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

                    <form onSubmit={handleLogin} className="space-y-5 text-left">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Email Institutionnel</label>
                            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900" placeholder="agent@cnps.cm" />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">Mot de passe</label>
                            <div className="relative">
                                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-900" placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center rounded-md bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-70">
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Accéder au portail'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}; 