import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    roles?: ('USER' | 'ADMIN' | 'TECHNICIEN' | 'SUPER_ADMIN')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
    const { isAuthenticated, isLoading, person } = useAuth();

    // ── Attendre que le contexte soit initialisé ──────────────────────────
    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    // ✅ Le context est la seule source de vérité
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // ── Rôle insuffisant ──────────────────────────────────────────────────
    if (roles && person && !roles.includes(person.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;