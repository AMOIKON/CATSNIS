import api from './api';
import {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    ApiResponse,
    PersonInfo,
} from '../types';

// ── ID ITECH-CIV — même logique que backend ───────────────────────────────────
const ITECH_PARTNER_ID = 17;

// ── Type de la réponse brute du backend ──────────────────────────────────────
interface RawAuthResponse {
    accessToken:  string;
    refreshToken: string;
    tokenType:    string;
    expiresIn:    number;
    id:           number;
    firstName:    string;
    lastName:     string;
    email:        string;
    role:         'SUPER_ADMIN' | 'ADMIN' | 'TECHNICIEN' | 'LOGISTICIEN' | 'USER';
    postName:     string;
    unitsName:    string;
    partnerName?: string;
    // ✅ Phase 2 — ID partenaire retourné par le backend
    partnerId?:   number;
}

// ── Helper : construire PersonInfo depuis la réponse brute ───────────────────
function buildPerson(raw: RawAuthResponse): PersonInfo {
    return {
        id:          raw.id,
        firstName:   raw.firstName,
        lastName:    raw.lastName,
        email:       raw.email,
        contact:     '',
        role:        raw.role,
        postName:    raw.postName  ?? '',
        unitsName:   raw.unitsName ?? '',
        partnerName: raw.partnerName,
        partnerId:   raw.partnerId,
    };
}

const AuthService = {

    // ── Login ─────────────────────────────────────────────────────────────────
    login: async (request: LoginRequest): Promise<AuthResponse> => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('person');

        const response = await api.post<ApiResponse<RawAuthResponse>>(
            '/api/auth/login', request
        );

        const raw    = response.data.data;
        const person = buildPerson(raw);

        localStorage.setItem('accessToken',  raw.accessToken);
        localStorage.setItem('refreshToken', raw.refreshToken);
        localStorage.setItem('person',       JSON.stringify(person));

        console.log(
            '✅ Connecté :', person.email,
            '| Rôle :', person.role,
            '| Partenaire :', person.partnerName ?? 'Aucun',
            '| PartnerId :', person.partnerId ?? 'N/A',
        );

        return {
            accessToken:  raw.accessToken,
            refreshToken: raw.refreshToken,
            tokenType:    raw.tokenType,
            expiresIn:    raw.expiresIn,
            person,
        };
    },

    // ── Register ──────────────────────────────────────────────────────────────
    register: async (request: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post<ApiResponse<RawAuthResponse>>(
            '/api/auth/register', request
        );

        const raw    = response.data.data;
        const person = buildPerson(raw);

        localStorage.setItem('accessToken',  raw.accessToken);
        localStorage.setItem('refreshToken', raw.refreshToken);
        localStorage.setItem('person',       JSON.stringify(person));

        return {
            accessToken:  raw.accessToken,
            refreshToken: raw.refreshToken,
            tokenType:    raw.tokenType,
            expiresIn:    raw.expiresIn,
            person,
        };
    },

    // ── Logout ────────────────────────────────────────────────────────────────
    logout: (): void => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('person');
        window.location.href = '/login';
    },

    // ── Getters ───────────────────────────────────────────────────────────────
    getAccessToken: (): string | null => {
        return localStorage.getItem('accessToken');
    },

    isAuthenticated: (): boolean => {
        const token  = localStorage.getItem('accessToken');
        const person = localStorage.getItem('person');
        return !!token && !!person;
    },

    getCurrentPerson: (): PersonInfo | null => {
        try {
            const person = localStorage.getItem('person');
            return person ? JSON.parse(person) : null;
        } catch {
            return null;
        }
    },

    // ✅ Phase 2 — détermine si l'utilisateur voit tout (SUPER_ADMIN ou ITECH)
    isUnrestricted: (person: PersonInfo | null): boolean => {
        if (!person) return false;
        if (person.role === 'SUPER_ADMIN') return true;
        if (person.partnerId === ITECH_PARTNER_ID) return true;
        return false;
    },

    // ✅ Phase 2 — retourne le partnerId à passer en paramètre API
    // null = pas de filtre, -1 = données sans partenaire, X = partenaire X
    getPartnerFilter: (person: PersonInfo | null): number | null => {
        if (!person) return null;
        if (person.role === 'SUPER_ADMIN') return null;
        if (person.partnerId === ITECH_PARTNER_ID) return null;
        if (person.partnerId) return person.partnerId;
        return -1; // sans partenaire
    },
};

export default AuthService;