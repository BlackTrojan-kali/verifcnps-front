// ====================================================
// 1. TYPES LITTÉRAUX (Pour une sécurité absolue)
// ====================================================

export type UserRole = 'company' | 'bank' | 'cnps';

export type PaymentMode = 'virement' | 'especes' | 'ordre_virement' | 'mobile_money' | 'orange_money';

export type DeclarationStatus = 'initiated' | 'submited' | 'bank_validated' | 'cnps_validated' | 'rejected';


// ====================================================
// 2. INTERFACES DES PROFILS UTILISATEURS
// ====================================================

export interface User {
    id: number;
    email: string | null;
    role: UserRole;
    created_at?: string;
    updated_at?: string;
    // Relations optionnelles chargées par Laravel (Eager Loading)
    company?: Company;
    bank?: Bank;
    cnps?: CnpsAgent;
}

export interface Company {
    id: number;
    user_id: number;
    niu: string;
    raison_sociale: string;
    telephone: string | null;
    address: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface Bank {
    id: number;
    user_id: number;
    bank_code: string;       // CORRIGÉ : correspond à $fillable = ["bank_code"]
    bank_name: string;       // CORRIGÉ : correspond à $fillable = ["bank_name"]
    address: string | null;  // AJOUTÉ : correspond à $fillable = ["address"]
    created_at?: string;
    updated_at?: string;
}

export interface CnpsAgent {
    id: number;
    user_id: number;
    matricule: string;
    full_name: string;       // CORRIGÉ : correspond à $fillable = ["full_name"]
    department: string | null; // AJOUTÉ : correspond à $fillable = ["department"]
    created_at?: string;
    updated_at?: string;
}


// ====================================================
// 3. INTERFACE DE LA DÉCLARATION (Le cœur du métier)
// ====================================================

export interface Declaration {
    id: number;
    company_id: number;
    bank_id: number | null;
    reference: string;
    mobile_reference: string | null;
    period: string; // Format YYYY-MM-DD renvoyé par l'API
    amount: number | string; // Parfois renvoyé en string par l'API selon le formatage
    payment_mode: PaymentMode | null;
    proof_path: string | null;
    status: DeclarationStatus;
    receipt_path?: string | null;
    comment_reject: string | null;
    created_at: string;
    updated_at: string;
    
    // Relations jointes par le backend
    company?: Company;
    bank?: Bank;
}


// ====================================================
// 4. INTERFACE DES NOTIFICATIONS (Pour la petite cloche)
// ====================================================

export interface AppNotification {
    id: string; // Les IDs de notifications Laravel sont des UUID (chaînes de caractères)
    type: string;
    notifiable_type: string;
    notifiable_id: number;
    data: {
        declaration_id: number;
        reference: string;
        status: DeclarationStatus;
        message: string;
    };
    read_at: string | null;
    created_at: string;
    updated_at: string;
}