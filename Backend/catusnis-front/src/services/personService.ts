import api from './api';
import {
    ApiResponse,
    Page,
    UpdatePersonRequest,
    RegisterRequest,
    PostResponse,
    UnitsResponse,
    PartnerResponse,
} from '../types';

// ── Type PersonResponse ───────────────────────────────────────────────────────
export interface PersonResponse {
    id:           number;
    firstName:    string;
    lastName:     string;
    email:        string;
    contact:      string;
    role:         'SUPER_ADMIN' | 'ADMIN' | 'TECHNICIEN' | 'LOGISTICIEN' | 'USER';
    postName:     string;
    unitsName:    string;
    partnerName?: string;
    // ✅ Mot de passe (hash BCrypt) — renseigné uniquement pour SUPER_ADMIN
    password?:    string | null;
}

// ── Labels et couleurs des rôles ─────────────────────────────────────────────
export const ROLE_LABELS: Record<PersonResponse['role'], string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN:       'Administrateur',
    TECHNICIEN:  'Technicien',
    LOGISTICIEN: 'Logisticien',
    USER:        'Utilisateur',
};

export const ROLE_BADGE_CLASSES: Record<PersonResponse['role'], string> = {
    SUPER_ADMIN: 'bg-danger text-white',
    ADMIN:       'bg-primary text-white',
    TECHNICIEN:  'bg-warning text-dark',
    LOGISTICIEN: 'bg-success text-white',
    USER:        'bg-secondary text-white',
};

const PersonService = {

    // ── Créer un utilisateur (ADMIN / SUPER_ADMIN) ────────────────────────────
    create: async (request: RegisterRequest): Promise<PersonResponse> => {
        const response = await api.post<ApiResponse<PersonResponse>>(
            '/api/auth/register', request
        );
        return response.data.data;
    },

    // ── Liste complète sans pagination (picker) ───────────────────────────────
    getAllList: async (): Promise<PersonResponse[]> => {
        const response = await api.get<ApiResponse<PersonResponse[]>>(
            '/api/persons/all'
        );
        return response.data.data;
    },

    // ── Liste paginée avec filtres ────────────────────────────────────────────
    getAll: async (
        page     = 0,
        size     = 10,
        postId?:   number,
        unitsId?:  number,
        keyword?:  string,
    ): Promise<Page<PersonResponse>> => {
        const params = new URLSearchParams();
        params.append('page', String(page));
        params.append('size', String(size));
        if (postId)  params.append('postId',  String(postId));
        if (unitsId) params.append('unitsId', String(unitsId));
        if (keyword) params.append('keyword', keyword);

        const response = await api.get<ApiResponse<Page<PersonResponse>>>(
            `/api/persons?${params.toString()}`
        );
        return response.data.data;
    },

    // ── Récupérer par ID ──────────────────────────────────────────────────────
    getById: async (id: number): Promise<PersonResponse> => {
        const response = await api.get<ApiResponse<PersonResponse>>(
            `/api/persons/${id}`
        );
        return response.data.data;
    },

    // ── Mettre à jour ─────────────────────────────────────────────────────────
    update: async (id: number, data: UpdatePersonRequest): Promise<PersonResponse> => {
        const response = await api.put<ApiResponse<PersonResponse>>(
            `/api/persons/${id}`, data
        );
        return response.data.data;
    },

    // ── Supprimer ─────────────────────────────────────────────────────────────
    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/persons/${id}`);
    },

    // ── Données pour les listes déroulantes ───────────────────────────────────
    getPosts: async (): Promise<PostResponse[]> => {
        const response = await api.get<ApiResponse<PostResponse[]>>('/api/posts');
        return response.data.data;
    },

    getUnits: async (): Promise<UnitsResponse[]> => {
        const response = await api.get<ApiResponse<UnitsResponse[]>>('/api/units');
        return response.data.data;
    },

    getPartners: async (): Promise<PartnerResponse[]> => {
        const response = await api.get<ApiResponse<PartnerResponse[]>>('/api/partners');
        return response.data.data;
    },
};

export default PersonService;