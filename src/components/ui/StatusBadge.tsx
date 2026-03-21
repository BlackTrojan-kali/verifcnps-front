
import { DeclarationStatus } from '../../types';
import { CheckCircle2, Clock, AlertCircle, XCircle, FileClock } from 'lucide-react';

interface StatusBadgeProps {
    status: DeclarationStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
    // On définit le style et l'icône selon le statut
    const config = {
        initiated: { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: FileClock, label: 'Initié' },
        submited: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock, label: 'Soumis (Attente Banque)' },
        bank_validated: { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertCircle, label: 'Validé Banque (Attente CNPS)' },
        cnps_validated: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Rapproché' },
        rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Rejeté' }
    };

    const current = config[status] || config.initiated;
    const Icon = current.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${current.color}`}>
            <Icon size={14} />
            {current.label}
        </span>
    );
};