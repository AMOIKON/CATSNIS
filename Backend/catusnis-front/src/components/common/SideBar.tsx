import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useNavigation } from '../../hooks/useNavigation';

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN:'bg-danger', ADMIN:'bg-primary',
  TECHNICIEN:'bg-warning text-dark', LOGISTICIEN:'bg-success', USER:'bg-secondary',
};

const Sidebar: React.FC = () => {
  const { person, logout }    = useAuth();
  const { menus, alerteCount } = useNavigation();
  const navigate               = useNavigate();

  const [collapsed,   setCollapsed]   = useState(false);
  const [openMenus,   setOpenMenus]   = useState<Record<string,boolean>>({ dashboard: true });

  const toggleMenu = (key: string) =>
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = () => { logout(); navigate('/login'); };

  const COLOR_MAP: Record<string,string> = {
    primary:'#3b82f6', success:'#22c55e', warning:'#f59e0b',
    info:'#06b6d4', secondary:'#64748b', danger:'#ef4444',
  };

  return (
    <div
      className="d-flex flex-column bg-dark text-white min-vh-100"
      style={{ width: collapsed ? '64px' : '240px', transition:'width 0.25s ease', flexShrink:0 }}
    >
      {/* ── Header brand ── */}
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-secondary">
        {!collapsed && (
          <div className="d-flex align-items-center gap-2">
            {/* ✅ Logo image */}
            <img
              src="/images/equipements/concept-medias.avif"
              alt="CATUSNIS"
              style={{ width:'28px', height:'28px', minWidth:'28px', borderRadius:'6px', objectFit:'cover' }}
            />
            <div>
              <div style={{fontSize:'13px',fontWeight:600,color:'#fff',lineHeight:1.2}}>CATUSNIS</div>
              <div style={{fontSize:'8px',color:'rgba(255,255,255,.35)',letterSpacing:'1px',textTransform:'uppercase'}}>Côte d'Ivoire</div>
            </div>
          </div>
        )}
        <button
          className="btn btn-sm btn-outline-secondary text-white border-0"
          onClick={() => setCollapsed(c => !c)}>
          <i className={`bi ${collapsed ? 'bi-layout-sidebar' : 'bi-layout-sidebar-reverse'}`} />
        </button>
      </div>

      {/* ── Profil ── */}
      {!collapsed && person && (
        <div className="mx-2 mt-2 mb-1 p-2 rounded-3 d-flex align-items-center gap-2"
          style={{background:'rgba(255,255,255,.06)'}}>
          <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
            style={{width:'32px',height:'32px',minWidth:'32px',background: COLOR_MAP[ROLE_COLORS[person.role]?.split('-')[1]] || '#475569',fontSize:'11px'}}>
            {person.firstName?.charAt(0)}{person.lastName?.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <div style={{fontSize:'11px',fontWeight:500,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
              {person.firstName} {person.lastName}
            </div>
            <span className={`badge ${ROLE_COLORS[person.role] || 'bg-secondary'}`} style={{fontSize:'9px'}}>
              {person.role}
            </span>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-grow-1 overflow-auto p-2" style={{scrollbarWidth:'none'}}>
        <ul className="nav flex-column gap-1">
          {menus.map(menu => {
            const isOpen   = !!openMenus[menu.key];
            const menuColor = COLOR_MAP[menu.color] || '#64748b';

            return (
              <li key={menu.key} className="nav-item">
                {/* ── Bouton menu parent ── */}
                <button
                  onClick={() => !collapsed && toggleMenu(menu.key)}
                  title={collapsed ? menu.label : undefined}
                  className="btn w-100 d-flex align-items-center gap-2 rounded-3 px-2 py-2 border-0 text-white-50"
                  style={{
                    background: isOpen ? `${menuColor}18` : 'transparent',
                    transition: 'background .15s',
                    marginTop:'4px',
                  }}
                >
                  <i className={`bi ${menu.icon} fs-6`} style={{color: menuColor, minWidth:'16px'}} />
                  {!collapsed && (
                    <>
                      <span style={{fontSize:'12px',fontWeight:600,color: menuColor,flex:1,textAlign:'left'}}>
                        {menu.label}
                      </span>
                      {/* Badge alertes sur le menu Parc */}
                      {menu.key === 'parc' && alerteCount > 0 && (
                        <span className="badge bg-danger rounded-pill" style={{fontSize:'9px'}}>
                          {alerteCount}
                        </span>
                      )}
                      <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'} small`}
                        style={{opacity:.3,fontSize:'10px'}} />
                    </>
                  )}
                </button>

                {/* ── Sous-menus ── */}
                {(isOpen || collapsed) && (
                  <ul className="nav flex-column gap-1 mt-1"
                    style={{paddingLeft: collapsed ? '0' : '12px'}}>
                    {menu.children.map(child => (
                      <li key={child.key} className="nav-item">
                        <NavLink
                          to={child.path}
                          title={collapsed ? child.label : undefined}
                          className={({ isActive }) =>
                            `nav-link d-flex align-items-center gap-2 rounded-3 px-2 py-1 ${isActive ? 'bg-primary text-white' : 'text-white-50'}`
                          }
                          style={{fontSize:'11px', transition:'.12s', borderLeft: collapsed ? 'none' : `1px solid rgba(255,255,255,.07)`}}
                        >
                          <i className={`bi ${child.icon} small`} style={{minWidth:'13px'}} />
                          {!collapsed && (
                            <span style={{flex:1}}>{child.label}</span>
                          )}
                          {/* Badge dynamique */}
                          {!collapsed && child.badge && child.badge > 0 && (
                            <span className="badge bg-danger rounded-pill" style={{fontSize:'8px'}}>
                              {child.badge}
                            </span>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Bas de sidebar ── */}
      <div className="p-2 border-top border-secondary">
        <button
          className="btn btn-outline-danger w-100 d-flex align-items-center gap-2"
          style={{fontSize:'12px', borderRadius:'8px'}}
          onClick={handleLogout}>
          <i className="bi bi-box-arrow-left" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;