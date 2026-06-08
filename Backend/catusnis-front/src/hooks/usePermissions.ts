import useAuth from './useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────
type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TECHNICIEN' | 'USER';

export interface Permissions {
    // ── Identité du rôle ──────────────────────────────────────────────────────
    isSuperAdmin: boolean;
    isAdmin:      boolean;
    isTechnicien: boolean;
    isUser:       boolean;
    role:         Role | null;

    // ── Actions globales ──────────────────────────────────────────────────────
    canCreate:       boolean;  // SUPER_ADMIN + ADMIN + TECHNICIEN
    canEdit:         boolean;  // SUPER_ADMIN + ADMIN + TECHNICIEN
    canDelete:       boolean;  // SUPER_ADMIN + ADMIN
    canManageUsers:  boolean;  // SUPER_ADMIN uniquement
    canViewAll:      boolean;  // SUPER_ADMIN + ADMIN (voient tous les sites)

    // ── Actions spécifiques ───────────────────────────────────────────────────
    canCreateAcquisition:   boolean;
    canEditAcquisition:     boolean;
    canDeleteAcquisition:   boolean;

    canCreateDeployment:    boolean;
    canEditDeployment:      boolean;
    canDeleteDeployment:    boolean;

    canCreateIntervention:  boolean;
    canEditIntervention:    boolean;
    canDeleteIntervention:  boolean;

    canCreatePerson:        boolean;
    canEditPerson:          boolean;
    canDeletePerson:        boolean;  // SUPER_ADMIN + ADMIN uniquement

    canManageOrganisation:  boolean;  // régions, districts, sites
    canDeleteOrganisation:  boolean;  // SUPER_ADMIN + ADMIN

    canManageSettings:      boolean;  // postes, unités, apps, états, évaluations
    canDeleteSettings:      boolean;  // SUPER_ADMIN + ADMIN

    canAssignSites:         boolean;  // SUPER_ADMIN + ADMIN

    canConfigurePermissions: boolean; // SUPER_ADMIN uniquement
}

// ── Hook principal ────────────────────────────────────────────────────────────
const usePermissions = (): Permissions => {
    const { person } = useAuth();
    const role = (person?.role ?? null) as Role | null;

    const isSuperAdmin = role === 'SUPER_ADMIN';
    const isAdmin      = role === 'ADMIN';
    const isTechnicien = role === 'TECHNICIEN';
    const isUser       = role === 'USER';

    // Groupes
    const isAdminOrAbove    = isSuperAdmin || isAdmin;
    const canManageOrCreate = isSuperAdmin || isAdmin || isTechnicien;

    return {
        // Identité
        isSuperAdmin,
        isAdmin,
        isTechnicien,
        isUser,
        role,

        // Actions globales
        canCreate:      canManageOrCreate,
        canEdit:        canManageOrCreate,
        canDelete:      isAdminOrAbove,
        canManageUsers: isSuperAdmin,
        canViewAll:     isAdminOrAbove,

        // Acquisitions
        canCreateAcquisition:  canManageOrCreate,
        canEditAcquisition:    canManageOrCreate,
        canDeleteAcquisition:  canManageOrCreate,

        // Déploiements
        canCreateDeployment:   canManageOrCreate,
        canEditDeployment:     canManageOrCreate,
        canDeleteDeployment:   canManageOrCreate,

        // Interventions
        canCreateIntervention: canManageOrCreate,
        canEditIntervention:   canManageOrCreate,
        canDeleteIntervention: canManageOrCreate,

        // Personnes
        canCreatePerson:       canManageOrCreate,
        canEditPerson:         canManageOrCreate,
        canDeletePerson:       isAdminOrAbove,   // TECHNICIEN ne peut pas supprimer

        // Organisation
        canManageOrganisation: canManageOrCreate,
        canDeleteOrganisation: isAdminOrAbove,

        // Paramètres (settings)
        canManageSettings:     canManageOrCreate,
        canDeleteSettings:     isAdminOrAbove,

        // Assignation sites
        canAssignSites:        isAdminOrAbove,

        // Configuration des permissions
        canConfigurePermissions: isSuperAdmin,
    };
};

export default usePermissions;