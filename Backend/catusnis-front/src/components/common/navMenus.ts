// ── Types exportés ───────────────────────────────────────────────────────────
export interface NavSubItem {
  key:    string;
  label:  string;
  path:   string;
  icon:   string;
  badge?: number;
}

export interface NavMenu {
  key:      string;
  label:    string;
  icon:     string;
  color:    string;
  children: NavSubItem[];
}

// ── Définition complète de tous les menus et sous-menus ──────────────────────
export const ALL_MENUS: NavMenu[] = [
  {
    key:'dashboard', label:'Tableau de bord', icon:'bi-grid-fill', color:'primary',
    children:[
      { key:'db-general', label:'Dashboard général',     path:'/dashboard-general',    icon:'bi-house-fill'      },
      { key:'db-equip',   label:'Dashboard équipements', path:'/dashboard-equipement', icon:'bi-box-seam-fill'   },
      { key:'db-logi',    label:'Dashboard logistique',  path:'/dashboard-logistique', icon:'bi-car-front-fill'  },
      { key:'db-tech',    label:'Mon espace technicien', path:'/dashboard-technicien', icon:'bi-tools'           },
      { key:'db-user',    label:'Accueil',               path:'/dashboard-user',       icon:'bi-person-fill'     },
    ],
  },
  {
    key:'organisation', label:'Organisation', icon:'bi-diagram-3-fill', color:'info',
    children:[
      { key:'regions',      label:'Régions',                path:'/regions',          icon:'bi-geo-alt-fill'      },
      { key:'districts',    label:'Districts',               path:'/districts',        icon:'bi-map-fill'          },
      { key:'health-sites', label:'Sites de santé',          path:'/health-sites',     icon:'bi-hospital-fill'     },
      { key:'partners',     label:'Partenaires',             path:'/partners',         icon:'bi-building'          },
      { key:'booklets',     label:'Registre Booklets',       path:'/booklets',         icon:'bi-journal-text'      },
      { key:'tech-sites',   label:'Assignation techniciens', path:'/technician-sites', icon:'bi-person-check-fill' },
    ],
  },
  {
    key:'equipements', label:'Équipements', icon:'bi-box-seam-fill', color:'warning',
    children:[
      { key:'acquisitions',  label:'Acquisitions',  path:'/acquisitions',  icon:'bi-box-seam-fill' },
      { key:'deployments',   label:'Déploiements',  path:'/deployments',   icon:'bi-truck'         },
      { key:'interventions', label:'Interventions', path:'/interventions', icon:'bi-tools'         },
      { key:'types',         label:'Types',         path:'/types',         icon:'bi-tag-fill'      },
      { key:'archives',      label:'Archives',      path:'/archives',      icon:'bi-archive-fill'  },
    ],
  },
  {
    key:'parc', label:'Parc logistique', icon:'bi-car-front-fill', color:'success',
    children:[
      { key:'logistique',  label:'Logistique (engins)',    path:'/vehicules',   icon:'bi-car-front-fill' },
      { key:'fournitures', label:'Fournitures & Mobilier', path:'/fournitures', icon:'bi-box-seam-fill'  },
    ],
  },
  {
    key:'parametres', label:'Paramètres', icon:'bi-gear-fill', color:'secondary',
    children:[
      { key:'posts',        label:'Postes',           path:'/settings/posts',        icon:'bi-briefcase-fill' },
      { key:'units',        label:'Unités',            path:'/settings/units',        icon:'bi-building-fill'  },
      { key:'apps',         label:'Applications',      path:'/settings/apps',         icon:'bi-grid-fill'      },
      { key:'states',       label:'États',             path:'/settings/states',       icon:'bi-toggle-on'      },
      { key:'images',       label:'Images',            path:'/settings/images',       icon:'bi-image-fill'     },
      { key:'print-config', label:'Config impression', path:'/settings/print-config', icon:'bi-printer-fill'   },
      { key:'evaluations',  label:'Évaluations',       path:'/settings/evaluations',  icon:'bi-star-fill'      },
    ],
  },
  {
    key:'administration', label:'Administration', icon:'bi-shield-shaded', color:'danger',
    children:[
      { key:'persons',     label:'Gestion des accès', path:'/persons',              icon:'bi-people-fill'   },
      { key:'permissions', label:'Permissions',        path:'/settings/permissions', icon:'bi-shield-shaded' },
    ],
  },

  // ✅ Documentation — accessible à tous les rôles authentifiés
  {
    key:'documentation', label:'Documentation', icon:'bi-book-fill', color:'info',
    children:[
      {
        key:   'manual-user',
        label: 'Manuel utilisateur',
        path:  '/manuals',
        icon:  'bi-person-lines-fill',
      },
      {
        key:   'manual-proc',
        label: 'Manuel de procédure',
        path:  '/manuals',
        icon:  'bi-file-earmark-text-fill',
      },
    ],
  },
];

// ── Filtrage des sous-menus par rôle ─────────────────────────────────────────
const SUBMENU_RULES: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'db-general','db-equip','db-logi',
    'regions','districts','health-sites','partners','booklets','tech-sites',
    'acquisitions','deployments','interventions','types','archives',
    'logistique','fournitures',
    'posts','units','apps','states','images','print-config','evaluations',
    // ✅ Documentation
    'manual-user','manual-proc',
  ],
  TECHNICIEN: [
    'db-tech',
    'regions','health-sites','booklets',
    'deployments','interventions','archives',
    'logistique','fournitures',
    'tech-sites','evaluations',
    // ✅ Documentation
    'manual-user','manual-proc',
  ],
  LOGISTICIEN: [
    'db-logi',
    'logistique','fournitures',
    // ✅ Documentation
    'manual-user','manual-proc',
  ],
  USER: [
    'db-user',
    'acquisitions','deployments','archives',
    // ✅ Documentation
    'manual-user','manual-proc',
  ],
};

// ── Construit les menus filtrés pour un rôle donné ───────────────────────────
export function buildMenusForRole(role: string): NavMenu[] {
  const allowed = SUBMENU_RULES[role] || [];
  const isAll   = allowed.includes('*');

  return ALL_MENUS
    .map(menu => ({
      ...menu,
      children: isAll
        ? menu.children
        : menu.children.filter(c => allowed.includes(c.key)),
    }))
    .filter(menu => menu.children.length > 0);
}