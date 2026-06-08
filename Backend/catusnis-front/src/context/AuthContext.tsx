import React, {
    createContext,
    useState,
    useEffect,
    useCallback,
} from 'react';
import { PersonInfo, LoginRequest, RegisterRequest } from '../types';
import AuthService from '../services/authService';

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthContextType {
    person:          PersonInfo | null;
    isAuthenticated: boolean;
    isLoading:       boolean;
    login:           (request: LoginRequest)    => Promise<void>;
    register:        (request: RegisterRequest) => Promise<void>;
    logout:          () => void;
    hasRole:         (role: 'USER' | 'ADMIN' | 'TECHNICIEN' | 'SUPER_ADMIN' | 'LOGISTICIEN') => boolean;
    // ✅ Phase 2 — helpers partenaire
    partnerId:       number | null;   // ID du partenaire de l'utilisateur
    isUnrestricted:  boolean;         // true = SUPER_ADMIN ou ITECH → voit tout
    partnerFilter:   number | null;   // null=tout | -1=sans partenaire | X=partenaire X
}

export const AuthContext = createContext<AuthContextType>(
    {} as AuthContextType
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [person,    setPerson]    = useState<PersonInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const token        = localStorage.getItem('accessToken');
        const storedPerson = AuthService.getCurrentPerson();
        if (token && storedPerson) {
            setPerson(storedPerson);
            console.log('✅ Session restaurée pour :', storedPerson.email);
        } else {
            console.log('ℹ️ Pas de session active');
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (request: LoginRequest) => {
        await AuthService.login(request);
        const storedPerson = AuthService.getCurrentPerson();
        console.log('👤 person après login:', storedPerson);
        setPerson(storedPerson);
    }, []);

    const register = useCallback(async (request: RegisterRequest) => {
        await AuthService.register(request);
        const storedPerson = AuthService.getCurrentPerson();
        setPerson(storedPerson);
    }, []);

    const logout = useCallback(() => {
        AuthService.logout();
        setPerson(null);
    }, []);

    const hasRole = useCallback(
        (role: 'USER' | 'ADMIN' | 'TECHNICIEN' | 'SUPER_ADMIN' | 'LOGISTICIEN'): boolean => {
            return person?.role === role;
        },
        [person]
    );

    // ✅ Phase 2 — valeurs dérivées du partenaire
    const partnerId      = person?.partnerId ?? null;
    const isUnrestricted = AuthService.isUnrestricted(person);
    const partnerFilter  = AuthService.getPartnerFilter(person);

    return (
        <AuthContext.Provider
            value={{
                person,
                isAuthenticated: !!person,
                isLoading,
                login,
                register,
                logout,
                hasRole,
                partnerId,
                isUnrestricted,
                partnerFilter,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};