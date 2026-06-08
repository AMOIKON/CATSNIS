import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // ✅ ÉTAPE 1 : ajout useLocation
import useAuth from '../../hooks/useAuth';
import { useNavigation } from '../../hooks/useNavigation';   // ✅ ÉTAPE 2 : menus dynamiques

interface TopNavProps {
  onToggleMode: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#dc2626', ADMIN: '#1a56db',
  TECHNICIEN:  '#d97706', LOGISTICIEN: '#16a34a', USER: '#475569',
};
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', ADMIN:       'Admin',
  TECHNICIEN:  'Technicien',  LOGISTICIEN: 'Logisticien', USER: 'Utilisateur',
};
const MENU_COLOR_MAP: Record<string, string> = {
  primary: '#3b82f6', success: '#22c55e', warning: '#f59e0b',
  info:    '#06b6d4', secondary: '#64748b', danger: '#ef4444',
};

const TopNav: React.FC<TopNavProps> = ({ onToggleMode }) => {
  const { person, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();                           // ✅ ÉTAPE 1 : route réelle
  const navRef    = useRef<HTMLDivElement>(null);

  const { menus, alerteCount } = useNavigation();           // ✅ ÉTAPE 2 : menus dynamiques

  const role         = person?.role || 'USER';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // ✅ ÉTAPE 3 : page courante depuis l'URL réelle, plus de useState manuel
  const currentMenu = menus.find(m =>
    m.children.some(c => location.pathname.startsWith(c.path))
  );
  const currentSub   = currentMenu?.children.find(c => location.pathname.startsWith(c.path));
  const currentLabel = currentSub?.label || currentMenu?.label || 'Tableau de bord';

  const toggle       = (key: string) => setOpenMenu(prev => prev === key ? null : key);
  const close        = () => setOpenMenu(null);
  const handleLogout = () => { logout(); navigate('/login'); };

  // Fermer au clic extérieur
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Sous-item dropdown ──────────────────────────────────────────────────────
  const SubItem: React.FC<{
    icon: string; label: string; path: string; badge?: number; color?: string;
  }> = ({ icon, label, path, badge, color }) => {
    // ✅ ÉTAPE 3 : isActive basé sur l'URL réelle, plus de string.includes()
    const isActive = location.pathname.startsWith(path) && currentSub?.label === label;
    return (
      <div
        onClick={() => { navigate(path); close(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '9px',
          padding: '7px 10px', borderRadius: '7px', cursor: 'pointer',
          background: isActive ? '#eff6ff' : 'transparent',
          transition: 'background .1s',
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <div style={{
          width: '28px', height: '28px', borderRadius: '6px',
          background: color ? `${color}18` : '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <i className={`bi ${icon}`} style={{ fontSize: '12px', color: color || '#64748b' }} />
        </div>
        <span style={{ fontSize: '12px', fontWeight: 500, color: isActive ? '#1a56db' : '#374151', flex: 1 }}>
          {label}
        </span>
        {badge && badge > 0 && (
          <span className="badge bg-danger rounded-pill" style={{ fontSize: '9px' }}>{badge}</span>
        )}
      </div>
    );
  };

  return (
    <div
      ref={navRef}
      style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        height: '52px', display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: '2px', position: 'relative', zIndex: 200,
      }}
    >
      {/* ── Brand ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '20px', flexShrink: 0 }}>
        <div style={{
          width: '32px', height: '32px', background: '#1a56db',
          borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
            <path d="M8 1L15 5V11L8 15L1 11V5L8 1Z"/>
          </svg>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b', letterSpacing: '-.3px' }}>CATUSNIS</span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>2.1</span>
        </div>
        <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 6px' }} />
        {/* ✅ ÉTAPE 3 : currentLabel vient de l'URL, pas d'un useState */}
        <span style={{ fontSize: '12px', color: '#64748b', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentLabel}
        </span>
      </div>

      {/* ── Onglets menus ── */}
      {/* ✅ ÉTAPE 2 : menus.map() — menus viennent de useNavigation, filtrés par rôle automatiquement */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, justifyContent: 'flex-end', overflowX: 'auto' }}>
        {menus.map(menu => {
          const menuColor  = MENU_COLOR_MAP[menu.color] || '#64748b';
          const isMenuOpen = openMenu === menu.key;
          // ✅ ÉTAPE 3 : isActive basé sur l'URL, plus de currentPage.includes()
          const isActive   = currentMenu?.key === menu.key;

          return (
            <div key={menu.key} style={{ position: 'relative' }}>
              <button
                onClick={() => toggle(menu.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  height: '36px', padding: '0 13px', border: 'none', cursor: 'pointer',
                  background: (isMenuOpen || isActive) ? '#1a56db' : 'transparent',
                  color:      (isMenuOpen || isActive) ? '#fff'    : '#475569',
                  fontSize: '13px', fontWeight: 500,
                  borderRadius: '6px', whiteSpace: 'nowrap', transition: 'all .15s',
                }}
                onMouseEnter={e => { if (!isMenuOpen && !isActive) (e.currentTarget as HTMLElement).style.background = '#f1f5f9'; }}
                onMouseLeave={e => { if (!isMenuOpen && !isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <i className={`bi ${menu.icon}`} style={{ fontSize: '13px', opacity: (isMenuOpen || isActive) ? 1 : .65 }} />
                {menu.label}
                {menu.key === 'parc' && alerteCount > 0 && (
                  <span className="badge bg-danger rounded-pill" style={{ fontSize: '8px', padding: '2px 5px' }}>
                    {alerteCount}
                  </span>
                )}
                <i className="bi bi-chevron-down" style={{
                  fontSize: '9px', opacity: (isMenuOpen || isActive) ? .7 : .35,
                  transform: isMenuOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform .2s', marginLeft: '2px',
                }} />
              </button>

              {/* Dropdown sous-menus */}
              {isMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: '#fff', border: '1px solid #e2e8f0',
                  borderRadius: '10px', padding: '6px', minWidth: '220px',
                  zIndex: 400, boxShadow: '0 4px 20px rgba(0,0,0,.09)',
                }}>
                  {/* En-tête du menu */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '6px 10px 8px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px',
                  }}>
                    <i className={`bi ${menu.icon}`} style={{ fontSize: '13px', color: menuColor }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', letterSpacing: '.5px', textTransform: 'uppercase' }}>
                      {menu.label}
                    </span>
                  </div>
                  {/* ✅ ÉTAPE 2 : sous-menus viennent de navigationConfig, pas hardcodés */}
                  {menu.children.map(child => (
                    <SubItem
                      key={child.key}
                      icon={child.icon}
                      label={child.label}
                      path={child.path}
                      badge={child.badge}
                      color={menuColor}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Droite ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '16px', flexShrink: 0 }}>

        {/* Toggle sidebar */}
        <button
          onClick={onToggleMode}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            height: '32px', padding: '0 10px',
            border: '1px solid #e2e8f0', borderRadius: '6px',
            background: '#f8fafc', cursor: 'pointer',
            fontSize: '11px', color: '#64748b', transition: '.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f1f5f9'; (e.currentTarget as HTMLElement).style.color = '#1e293b'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
        >
          <i className="bi bi-layout-sidebar" style={{ fontSize: '12px' }} />
          <span className="d-none d-md-inline">Barre latérale</span>
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            style={{
              width: '32px', height: '32px', borderRadius: '6px',
              background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f1f5f9'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
          >
            <i className="bi bi-bell-fill" style={{ fontSize: '14px' }} />
          </button>
          {/* ✅ Badge dynamique depuis useNavigation */}
          {alerteCount > 0 && (
            <span style={{
              position: 'absolute', top: '4px', right: '4px',
              background: '#ef4444', color: '#fff', fontSize: '8px', fontWeight: 700,
              borderRadius: '50%', width: '14px', height: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid #fff',
            }}>
              {alerteCount > 9 ? '9+' : alerteCount}
            </span>
          )}
        </div>

        {/* Profil */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => toggle('user')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              height: '34px', padding: '0 10px 0 6px',
              border: 'none', borderRadius: '20px',
              background: '#1e3a5f', cursor: 'pointer', transition: '.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1a3354'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#1e3a5f'}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: ROLE_COLORS[role] || '#475569',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {person?.firstName?.charAt(0)}{person?.lastName?.charAt(0)}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#fff', whiteSpace: 'nowrap' }}>
              {person?.firstName}
            </span>
            <i className="bi bi-chevron-down" style={{
              fontSize: '9px', color: 'rgba(255,255,255,.5)',
              transform: openMenu === 'user' ? 'rotate(180deg)' : 'none',
              transition: 'transform .2s',
            }} />
          </button>

          {openMenu === 'user' && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: '10px', padding: '6px', minWidth: '200px',
              zIndex: 400, boxShadow: '0 4px 20px rgba(0,0,0,.09)',
            }}>
              {/* Infos */}
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b' }}>
                  {person?.firstName} {person?.lastName}
                </div>
                <div style={{
                  display: 'inline-block', marginTop: '3px',
                  fontSize: '9px', fontWeight: 600, padding: '1px 7px',
                  borderRadius: '10px',
                  background: `${ROLE_COLORS[role]}18`,
                  color: ROLE_COLORS[role],
                }}>
                  {ROLE_LABELS[role]}
                </div>
              </div>

              {/* Administration — SUPER_ADMIN uniquement */}
              {isSuperAdmin && (
                <>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', letterSpacing: '.8px', textTransform: 'uppercase', padding: '6px 10px 3px' }}>
                    Administration
                  </div>
                  <SubItem icon="bi-people-fill"   label="Gestion des accès" path="/persons"              color="#dc2626" />
                  <SubItem icon="bi-shield-shaded" label="Permissions"        path="/settings/permissions" color="#dc2626" />
                  <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />
                </>
              )}

              {/* Déconnexion */}
              <div
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '7px 10px', borderRadius: '7px', cursor: 'pointer',
                  transition: 'background .1s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fef2f2'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-box-arrow-right" style={{ fontSize: '13px', color: '#dc2626' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#dc2626' }}>Déconnexion</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopNav;