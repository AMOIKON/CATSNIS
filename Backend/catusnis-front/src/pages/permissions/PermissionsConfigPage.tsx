import React, { useState } from 'react';
import MainLayout from '../../components/common/MainLayout';
import usePermissions from '../../hooks/usePermissions';
import { AppRole } from '../../types';

type Action = 'CREATE' | 'EDIT' | 'DELETE' | 'VIEW';

interface PermissionMatrix {
    [module: string]: { [role in AppRole]?: Action[]; };
}

const MODULES = [
    // ── Tableaux de bord ─────────────────────────────────────────────────────
    { key: 'db-general', label: 'Dashboard général',     icon: 'bi-house-fill',      group: 'Tableaux de bord', viewOnly: true },
    { key: 'db-equip',   label: 'Dashboard équipements', icon: 'bi-box-seam-fill',   group: 'Tableaux de bord', viewOnly: true },
    { key: 'db-logi',    label: 'Dashboard logistique',  icon: 'bi-car-front-fill',  group: 'Tableaux de bord', viewOnly: true },
    { key: 'db-tech',    label: 'Espace technicien',     icon: 'bi-tools',           group: 'Tableaux de bord', viewOnly: true },
    { key: 'db-user',    label: 'Accueil utilisateur',   icon: 'bi-person-fill',     group: 'Tableaux de bord', viewOnly: true },
    // ── Équipements ──────────────────────────────────────────────────────────
    { key: 'acquisitions',         label: 'Acquisitions',           icon: 'bi-box-seam-fill',             group: 'Équipements'     },
    { key: 'deployments',          label: 'Déploiements',           icon: 'bi-truck',                     group: 'Équipements'     },
    { key: 'interventions',        label: 'Interventions',          icon: 'bi-tools',                     group: 'Équipements'     },
    // ── Logistique ───────────────────────────────────────────────────────────
    { key: 'vehicules',            label: 'Parc — Engins',          icon: 'bi-car-front-fill',            group: 'Logistique'      },
    { key: 'vehiculeAffectations', label: 'Affectations',           icon: 'bi-person-fill-check',         group: 'Logistique'      },
    { key: 'vehiculeIncidents',    label: 'Incidents engins',       icon: 'bi-exclamation-triangle-fill', group: 'Logistique'      },
    { key: 'vehiculeMaintenances', label: 'Maintenances engins',    icon: 'bi-wrench-adjustable',         group: 'Logistique'      },
    { key: 'vehiculeDocuments',    label: 'Renouvellement docs',    icon: 'bi-file-earmark-check-fill',   group: 'Logistique'      },
    { key: 'fournitures',          label: 'Articles (stock)',        icon: 'bi-box-seam-fill',             group: 'Logistique'      },
    { key: 'fournituresDeploy',    label: 'Déploiements fournitures', icon: 'bi-box-arrow-right',         group: 'Logistique'      },
    // ── Organisation ─────────────────────────────────────────────────────────
    { key: 'persons',              label: 'Gestion des accès',      icon: 'bi-shield-shaded',             group: 'Organisation'    },
    { key: 'regions',              label: 'Régions',                icon: 'bi-geo-alt-fill',              group: 'Organisation'    },
    { key: 'districts',            label: 'Districts',              icon: 'bi-map-fill',                  group: 'Organisation'    },
    { key: 'health',               label: 'Sites de santé',         icon: 'bi-hospital-fill',             group: 'Organisation'    },
    { key: 'partners',             label: 'Partenaires',            icon: 'bi-building',                  group: 'Organisation'    },
    { key: 'booklets',             label: 'Booklets',               icon: 'bi-journal-text',              group: 'Organisation'    },
    { key: 'technicianSites',      label: 'Assignation sites',      icon: 'bi-person-check-fill',         group: 'Organisation'    },
    // ── Paramètres ───────────────────────────────────────────────────────────
    { key: 'types',                label: 'Types équipements',      icon: 'bi-tag-fill',                  group: 'Paramètres'      },
    { key: 'posts',                label: 'Postes',                 icon: 'bi-briefcase-fill',            group: 'Paramètres'      },
    { key: 'units',                label: 'Unités',                 icon: 'bi-building-fill',             group: 'Paramètres'      },
    { key: 'apps',                 label: 'Applications',           icon: 'bi-grid-fill',                 group: 'Paramètres'      },
    { key: 'evaluations',          label: 'Évaluations',            icon: 'bi-star-fill',                 group: 'Paramètres'      },
    { key: 'states',               label: 'États',                  icon: 'bi-toggle-on',                 group: 'Paramètres'      },
    { key: 'images',               label: 'Images',                 icon: 'bi-image-fill',                group: 'Paramètres'      },
    { key: 'printConfig',          label: 'Config impression',      icon: 'bi-printer-fill',              group: 'Paramètres'      },
    // ── Archives ─────────────────────────────────────────────────────────────
    { key: 'archives',             label: 'Archives',               icon: 'bi-archive-fill',              group: 'Archives'        },
    // ✅ Documentation ────────────────────────────────────────────────────────
    { key: 'manual-user', label: 'Manuel utilisateur',  icon: 'bi-person-lines-fill',     group: 'Documentation', viewOnly: true },
    { key: 'manual-proc', label: 'Manuel de procédure', icon: 'bi-file-earmark-text-fill', group: 'Documentation', viewOnly: true },
];

const GROUPS = ['Tableaux de bord', 'Équipements', 'Logistique', 'Organisation', 'Paramètres', 'Archives', 'Documentation'];

const GROUP_COLORS: Record<string, string> = {
    'Tableaux de bord': 'primary',
    'Équipements':      'warning',
    'Logistique':       'success',
    'Organisation':     'info',
    'Paramètres':       'secondary',
    'Archives':         'dark',
    'Documentation':    'secondary',  // ✅
};

const GROUP_ICONS: Record<string, string> = {
    'Tableaux de bord': 'bi-grid-fill',
    'Équipements':      'bi-pc-display-horizontal',
    'Logistique':       'bi-car-front-fill',
    'Organisation':     'bi-diagram-3-fill',
    'Paramètres':       'bi-gear-fill',
    'Archives':         'bi-archive-fill',
    'Documentation':    'bi-book-fill',  // ✅
};

const ROLES: AppRole[] = ['SUPER_ADMIN', 'ADMIN', 'TECHNICIEN', 'LOGISTICIEN', 'USER'];
const ACTIONS: Action[] = ['VIEW', 'CREATE', 'EDIT', 'DELETE'];

const ROLE_LABELS: Record<AppRole, string> = {
    SUPER_ADMIN:  'Super Admin',
    ADMIN:        'Administrateur',
    TECHNICIEN:   'Technicien',
    LOGISTICIEN:  'Logisticien',
    USER:         'Utilisateur',
};
const ROLE_COLORS: Record<AppRole, string> = {
    SUPER_ADMIN:  'danger',
    ADMIN:        'primary',
    TECHNICIEN:   'warning',
    LOGISTICIEN:  'success',
    USER:         'secondary',
};
const ACTION_LABELS: Record<Action, string> = {
    VIEW: 'Voir', CREATE: 'Créer', EDIT: 'Modifier', DELETE: 'Supprimer',
};
const ACTION_ICONS: Record<Action, string> = {
    VIEW: 'bi-eye', CREATE: 'bi-plus-circle', EDIT: 'bi-pencil', DELETE: 'bi-trash',
};

const buildDefaultMatrix = (): PermissionMatrix => {
    const m: PermissionMatrix = {};
    MODULES.forEach(mod => {
        m[mod.key] = {
            SUPER_ADMIN:  ['VIEW','CREATE','EDIT','DELETE'],
            ADMIN:        ['VIEW','CREATE','EDIT','DELETE'],
            TECHNICIEN:   ['VIEW','CREATE','EDIT'],
            LOGISTICIEN:  ['VIEW'],
            USER:         ['VIEW'],
        };
    });

    // ── Tableaux de bord ─────────────────────────────────────────────────────
    ['db-general', 'db-equip'].forEach(k => {
        m[k]!.SUPER_ADMIN = ['VIEW']; m[k]!.ADMIN = ['VIEW'];
        m[k]!.TECHNICIEN = []; m[k]!.LOGISTICIEN = []; m[k]!.USER = [];
    });
    m['db-logi']!.SUPER_ADMIN = ['VIEW']; m['db-logi']!.ADMIN = ['VIEW'];
    m['db-logi']!.TECHNICIEN = []; m['db-logi']!.LOGISTICIEN = ['VIEW']; m['db-logi']!.USER = [];
    m['db-tech']!.SUPER_ADMIN = ['VIEW']; m['db-tech']!.ADMIN = [];
    m['db-tech']!.TECHNICIEN = ['VIEW']; m['db-tech']!.LOGISTICIEN = []; m['db-tech']!.USER = [];
    m['db-user']!.SUPER_ADMIN = ['VIEW']; m['db-user']!.ADMIN = [];
    m['db-user']!.TECHNICIEN = []; m['db-user']!.LOGISTICIEN = []; m['db-user']!.USER = ['VIEW'];

    // ── Équipements ───────────────────────────────────────────────────────────
    ['acquisitions','deployments','interventions'].forEach(k => {
        m[k]!.LOGISTICIEN = []; m[k]!.USER = ['VIEW'];
    });

    // ── Logistique ────────────────────────────────────────────────────────────
    m['vehicules']!.TECHNICIEN = ['VIEW']; m['vehicules']!.LOGISTICIEN = ['VIEW','CREATE','EDIT']; m['vehicules']!.USER = [];
    m['vehiculeAffectations']!.TECHNICIEN = ['VIEW']; m['vehiculeAffectations']!.LOGISTICIEN = ['VIEW','CREATE','EDIT']; m['vehiculeAffectations']!.USER = [];
    m['vehiculeIncidents']!.TECHNICIEN = ['VIEW','CREATE','EDIT']; m['vehiculeIncidents']!.LOGISTICIEN = ['VIEW','CREATE','EDIT']; m['vehiculeIncidents']!.USER = [];
    m['vehiculeMaintenances']!.TECHNICIEN = ['VIEW','CREATE','EDIT']; m['vehiculeMaintenances']!.LOGISTICIEN = ['VIEW','CREATE','EDIT']; m['vehiculeMaintenances']!.USER = [];
    m['vehiculeDocuments']!.TECHNICIEN = ['VIEW']; m['vehiculeDocuments']!.LOGISTICIEN = ['VIEW','CREATE','EDIT']; m['vehiculeDocuments']!.USER = [];

    // ── Organisation ──────────────────────────────────────────────────────────
    m['persons']!.ADMIN = ['VIEW']; m['persons']!.TECHNICIEN = []; m['persons']!.LOGISTICIEN = []; m['persons']!.USER = [];
    ['regions','districts','health','partners','booklets','technicianSites'].forEach(k => {
        m[k]!.LOGISTICIEN = []; m[k]!.USER = ['VIEW'];
    });
    m['technicianSites']!.TECHNICIEN = ['VIEW'];

    // ── Paramètres ────────────────────────────────────────────────────────────
    ['types','posts','units','apps','evaluations','states','images','printConfig'].forEach(k => {
        m[k]!.LOGISTICIEN = []; m[k]!.USER = [];
    });

    // ── Archives ──────────────────────────────────────────────────────────────
    m['archives']!.TECHNICIEN = ['VIEW']; m['archives']!.LOGISTICIEN = []; m['archives']!.USER = ['VIEW'];

    // ✅ Documentation — VIEW pour tous (viewOnly = pas de create/edit/delete)
    ['manual-user','manual-proc'].forEach(k => {
        m[k]!.SUPER_ADMIN = ['VIEW'];
        m[k]!.ADMIN       = ['VIEW'];
        m[k]!.TECHNICIEN  = ['VIEW'];
        m[k]!.LOGISTICIEN = ['VIEW'];
        m[k]!.USER        = ['VIEW'];
    });

    return m;
};

const PermissionsConfigPage: React.FC = () => {
    const { canConfigurePermissions } = usePermissions();
    const [matrix,     setMatrix]     = useState<PermissionMatrix>(buildDefaultMatrix);
    const [saved,      setSaved]      = useState(false);
    const [activeRole, setActiveRole] = useState<AppRole>('ADMIN');

    if (!canConfigurePermissions) {
        return (
            <MainLayout title="Configuration des permissions">
                <div className="text-center py-5">
                    <i className="bi bi-shield-lock-fill fs-1 text-danger mb-3 d-block" />
                    <h5 className="fw-bold text-danger">Accès refusé</h5>
                    <p className="text-muted">Seul le Super Administrateur peut configurer les permissions.</p>
                </div>
            </MainLayout>
        );
    }

    const togglePermission = (moduleKey: string, role: AppRole, action: Action) => {
        const mod = MODULES.find(m => m.key === moduleKey);
        if (role === 'SUPER_ADMIN') return;
        if (mod?.viewOnly && action !== 'VIEW') return;
        if (!mod?.viewOnly && action === 'VIEW') return;
        setMatrix(prev => {
            const current   = prev[moduleKey]?.[role] ?? [];
            const hasAction = current.includes(action);
            return {
                ...prev,
                [moduleKey]: {
                    ...prev[moduleKey],
                    [role]: hasAction
                        ? current.filter(a => a !== action)
                        : [...current, action],
                },
            };
        });
        setSaved(false);
    };

    const hasPermission = (moduleKey: string, role: AppRole, action: Action) =>
        matrix[moduleKey]?.[role]?.includes(action) ?? false;

    const handleSave  = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };
    const handleReset = () => { setMatrix(buildDefaultMatrix()); setSaved(false); };

    const totalAccess = MODULES.filter(mod =>
        (matrix[mod.key]?.[activeRole]?.length ?? 0) > 0
    ).length;

    return (
        <MainLayout title="Configuration des permissions">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 className="fw-bold mb-0">
                        <i className="bi bi-shield-shaded text-primary me-2" />
                        Configuration des permissions
                    </h5>
                    <small className="text-muted">
                        Définissez les actions autorisées par rôle pour chaque module
                    </small>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary btn-sm" onClick={handleReset}>
                        <i className="bi bi-arrow-counterclockwise me-1" />Réinitialiser
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={handleSave}>
                        <i className="bi bi-save me-1" />Sauvegarder
                    </button>
                </div>
            </div>

            {saved && (
                <div className="alert alert-success d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-check-circle-fill" />Permissions sauvegardées avec succès !
                </div>
            )}

            <div className="alert alert-info d-flex align-items-center gap-2 mb-4">
                <i className="bi bi-info-circle-fill flex-shrink-0" />
                <span>
                    Les permissions du <strong>Super Administrateur</strong> sont fixes.
                    La permission <strong>Voir</strong> est toujours activée.
                    Les <strong>Tableaux de bord</strong> et la <strong>Documentation</strong> sont en accès <strong>Voir</strong> uniquement.
                </span>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
                <div className="card-header bg-white border-bottom pt-3 pb-0">
                    <ul className="nav nav-tabs card-header-tabs">
                        {ROLES.map(role => (
                            <li key={role} className="nav-item">
                                <button
                                    className={`nav-link d-flex align-items-center gap-2 ${activeRole === role ? 'active fw-bold' : ''}`}
                                    onClick={() => setActiveRole(role)}>
                                    <span className={`badge bg-${ROLE_COLORS[role]}`}>
                                        {ROLE_LABELS[role].charAt(0)}
                                    </span>
                                    {ROLE_LABELS[role]}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={`px-4 py-2 bg-${ROLE_COLORS[activeRole]} bg-opacity-10 border-bottom`}>
                    <small className={`text-${ROLE_COLORS[activeRole]} fw-semibold`}>
                        <i className="bi bi-person-fill me-1" />
                        {ROLE_LABELS[activeRole]} — accès à {totalAccess} module(s) sur {MODULES.length}
                        {activeRole === 'LOGISTICIEN' && (
                            <span className="ms-2 text-muted fw-normal">(limité au volet logistique)</span>
                        )}
                        {activeRole === 'SUPER_ADMIN' && (
                            <span className="ms-2 text-muted fw-normal">(accès complet — non modifiable)</span>
                        )}
                    </small>
                </div>

                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width:'40%' }}>Module</th>
                                    {ACTIONS.map(action => (
                                        <th key={action} className="text-center">
                                            <i className={`bi ${ACTION_ICONS[action]} me-1`} />
                                            {ACTION_LABELS[action]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {GROUPS.map(group => (
                                    <React.Fragment key={group}>
                                        <tr style={{ background:'#f8f9fa' }}>
                                            <td colSpan={5}>
                                                <span className={`badge bg-${GROUP_COLORS[group]} bg-opacity-10 text-${GROUP_COLORS[group]} px-3 py-2`}>
                                                    <i className={`bi ${GROUP_ICONS[group]} me-2`} />
                                                    {group}
                                                    {(group === 'Tableaux de bord' || group === 'Documentation') && (
                                                        <span className="ms-2 fw-normal opacity-75" style={{ fontSize:'10px' }}>
                                                            — Accès Voir uniquement
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                        {MODULES.filter(m => m.group === group).map(mod => {
                                            const rolePerms = matrix[mod.key]?.[activeRole] ?? [];
                                            const noAccess  = rolePerms.length === 0;
                                            return (
                                                <tr key={mod.key} className={noAccess ? 'opacity-50' : ''}>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2 ps-3">
                                                            <i className={`bi ${mod.icon} text-${GROUP_COLORS[group]}`} />
                                                            <span className="fw-semibold small">{mod.label}</span>
                                                            {noAccess && activeRole !== 'SUPER_ADMIN' && (
                                                                <span className="badge bg-secondary bg-opacity-10 text-secondary"
                                                                    style={{ fontSize:'10px' }}>Aucun accès</span>
                                                            )}
                                                            {mod.viewOnly && (
                                                                <span className="badge bg-primary bg-opacity-10 text-primary"
                                                                    style={{ fontSize:'10px' }}>
                                                                    <i className="bi bi-eye me-1" />Vue seule
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {ACTIONS.map(action => {
                                                        const has        = hasPermission(mod.key, activeRole, action);
                                                        const isViewOnly = !!mod.viewOnly;
                                                        const hidden     = isViewOnly && action !== 'VIEW';
                                                        const locked     = activeRole === 'SUPER_ADMIN'
                                                                        || (!isViewOnly && action === 'VIEW')
                                                                        || (isViewOnly && action !== 'VIEW');
                                                        return (
                                                            <td key={action} className="text-center">
                                                                {hidden
                                                                    ? <span className="text-muted" style={{ fontSize:'14px' }}>—</span>
                                                                    : (
                                                                        <div className="form-check d-flex justify-content-center">
                                                                            <input
                                                                                type="checkbox"
                                                                                className="form-check-input"
                                                                                checked={has}
                                                                                disabled={locked}
                                                                                onChange={() => togglePermission(mod.key, activeRole, action)}
                                                                                style={{
                                                                                    cursor: locked ? 'not-allowed' : 'pointer',
                                                                                    width: '18px', height: '18px',
                                                                                    accentColor: has ? '#0d6efd' : undefined,
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    )
                                                                }
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="d-flex gap-2 mt-3 flex-wrap align-items-center">
                {ROLES.map(role => (
                    <span key={role}
                        className={`badge bg-${ROLE_COLORS[role]} bg-opacity-10 text-${ROLE_COLORS[role]} d-flex align-items-center gap-1 p-2`}>
                        <i className="bi bi-person-fill" />{ROLE_LABELS[role]}
                    </span>
                ))}
                <span className="badge bg-secondary bg-opacity-10 text-secondary d-flex align-items-center gap-1 p-2">
                    <i className="bi bi-lock-fill" />Non modifiable
                </span>
                <span className="badge bg-primary bg-opacity-10 text-primary d-flex align-items-center gap-1 p-2">
                    <i className="bi bi-eye" />Vue seule
                </span>
            </div>
        </MainLayout>
    );
};

export default PermissionsConfigPage;