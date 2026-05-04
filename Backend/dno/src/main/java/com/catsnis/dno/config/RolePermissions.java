package com.catsnis.dno.config;

/**
 * Constantes de permissions réutilisables dans les annotations @PreAuthorize
 * Usage : @PreAuthorize(RolePermissions.MANAGE)
 */
public final class RolePermissions {

    private RolePermissions() {}

    // ── Groupes de rôles ──────────────────────────────────────────────────────

    /** SUPER_ADMIN + ADMIN + TECHNICIEN — peuvent créer/modifier */
    public static final String MANAGE =
            "hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIEN')";

    /** SUPER_ADMIN + ADMIN — peuvent supprimer et gérer les données sensibles */
    public static final String ADMIN_ONLY =
            "hasAnyRole('SUPER_ADMIN','ADMIN')";

    /** SUPER_ADMIN uniquement — gestion des comptes utilisateurs */
    public static final String SUPER_ADMIN_ONLY =
            "hasRole('SUPER_ADMIN')";

    /** Tous les utilisateurs authentifiés — lecture seule */
    public static final String READ =
            "isAuthenticated()";

    // ── Permissions spécifiques ───────────────────────────────────────────────

    /** Créer un compte utilisateur : SUPER_ADMIN uniquement */
    public static final String CREATE_ACCOUNT =
            "hasRole('SUPER_ADMIN')";

    /** Supprimer un compte : SUPER_ADMIN uniquement */
    public static final String DELETE_ACCOUNT =
            "hasRole('SUPER_ADMIN')";

    /** Modifier les rôles : SUPER_ADMIN uniquement */
    public static final String MANAGE_ROLES =
            "hasRole('SUPER_ADMIN')";

    /**
     * TECHNICIEN sur ses propres sites — vérification au niveau du service
     * via TechnicianSiteService.getHealthIdsByTechnician()
     */
    public static final String TECHNICIEN_OWN_SITES =
            "hasAnyRole('SUPER_ADMIN','ADMIN','TECHNICIEN')";
}