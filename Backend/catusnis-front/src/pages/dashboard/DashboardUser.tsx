import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';

import MainLayout      from '../../components/common/MainLayout';
import PeriodFilter, { PeriodKey, filterByPeriod } from '../../components/common/PeriodFilter';
import useAuth         from '../../hooks/useAuth';
import DashboardService, { UserStats } from '../../services/DashboardService';
import { groupByMonth } from '../../utils/Dashboardutils';

// ── Config ────────────────────────────────────────────────────────────────────
const COLORS = {
  primary:'#3b82f6', success:'#22c55e', info:'#06b6d4',
  warning:'#f59e0b', danger:'#ef4444', secondary:'#64748b', purple:'#8b5cf6',
};
const PIE_COLORS = ['#3b82f6','#22c55e','#06b6d4','#f59e0b','#8b5cf6','#ef4444','#ec4899','#14b8a6'];
const STATUS_COLORS: Record<string, string> = {
  DISPONIBLE:      COLORS.success,
  DEPLOYE:         COLORS.primary,
  NON_FONCTIONNEL: COLORS.danger,
  FONCTIONNEL:     COLORS.success,
  INCONNU:         COLORS.secondary,
};

type SectionTab = 'acquisitions' | 'deployments';

// ── Wrapper graphique sans SafeChart ─────────────────────────────────────────
// ✅ Hauteur fixe + minWidth:0 évitent width(-1)/height(-1) dans flex
const ChartBox: React.FC<{ height: number; children: React.ReactNode }> = ({ height, children }) => (
  <div style={{ height, minHeight: height, width: '100%', minWidth: 0, display: 'block', overflow: 'hidden' }}>
    {children}
  </div>
);

// ── Tooltip personnalisé ──────────────────────────────────────────────────────
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded-3 shadow-sm px-3 py-2" style={{ fontSize:'12px' }}>
      <p className="fw-bold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="mb-0" style={{ color: p.color || p.fill }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const DashboardUser: React.FC = () => {
  const { person } = useAuth();
  const pageRef    = useRef<HTMLDivElement | null>(null);

  const [data,          setData]          = useState<UserStats | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [period,        setPeriod]        = useState<PeriodKey>('all');
  const [searchTerm,    setSearchTerm]    = useState('');
  const [selectedType,  setSelectedType]  = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionTab>('acquisitions');
  const [showAll,       setShowAll]       = useState(false);

  const heure      = new Date().getHours();
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await DashboardService.getUserStats()); }
    catch (err) { console.error('[DashboardUser]', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredAcq = useMemo(
    () => data ? filterByPeriod(data.acquisitions, period, 'dateAcquisition' as any) : [],
    [data, period],
  );
  const filteredDep = useMemo(
    () => data ? filterByPeriod(data.deployments, period, 'dateDeployment' as any) : [],
    [data, period],
  );

  const acqKpiValue = period === 'all' ? (data?.acquisitionsTotal ?? 0) : filteredAcq.length;
  const depKpiValue = period === 'all' ? (data?.deploymentsTotal  ?? 0) : filteredDep.length;

  const equipTypes = useMemo(() => {
    const types: Record<string, number> = {};
    filteredAcq.forEach(a => {
      const t = (a.typeName || a.Type || 'Autre') as string;
      types[t] = (types[t] || 0) + 1;
    });
    return Object.entries(types).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filteredAcq]);

  const displayedAcq = useMemo(() => {
    return filteredAcq
      .filter(a => !selectedType || (a.typeName || a.Type || 'Autre') === selectedType)
      .filter(a => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          (a.tag      || '').toLowerCase().includes(q) ||
          (a.typeName || a.Type || '').toLowerCase().includes(q) ||
          (a.serial   || '').toLowerCase().includes(q) ||
          (a.status   || a.statut || '').toLowerCase().includes(q)
        );
      });
  }, [filteredAcq, selectedType, searchTerm]);

  const displayedDep = useMemo(() => {
    if (!searchTerm) return filteredDep;
    const q = searchTerm.toLowerCase();
    return filteredDep.filter(d =>
      (d.codeDep          || d.code          || '').toLowerCase().includes(q) ||
      (d.healthDeploy     || d.healthSiteName|| '').toLowerCase().includes(q) ||
      (d.regionDeploy     || d.regionName    || '').toLowerCase().includes(q) ||
      (d.districtDeploy   || d.districtName  || '').toLowerCase().includes(q)
    );
  }, [filteredDep, searchTerm]);

  const pieData = useMemo(
    () => equipTypes.map(([name, value]) => ({ name, value })),
    [equipTypes],
  );

  const monthlyData = useMemo(() => {
    if (!data) return [];
    const monthly = groupByMonth(data.acquisitions, 'dateAcquisition');
    return Object.entries(monthly).map(([mois, total]) => ({ mois, total }));
  }, [data]);

  const summaryBarData = [
    { name:'Acquis.',   value: acqKpiValue,                fill: COLORS.primary },
    { name:'Déploi.',   value: depKpiValue,                fill: COLORS.success },
    { name:'Sites',     value: data?.sitesTotal ?? 0,      fill: COLORS.info    },
    { name:'Archives',  value: data?.archivesTotal ?? 0,   fill: COLORS.secondary },
  ];

  const coverageRate = data?.sitesTotal
    ? Math.min(100, Math.round(((data.deploymentsTotal ?? 0) / data.sitesTotal) * 100))
    : 0;

  const acqStatuts = useMemo(() => {
    const s: Record<string, number> = {};
    filteredAcq.forEach(a => {
      const st = a.status || a.statut || 'INCONNU';
      s[st] = (s[st] || 0) + 1;
    });
    return Object.entries(s).sort((a, b) => b[1] - a[1]);
  }, [filteredAcq]);

  const topRegions = useMemo(() => {
    const r: Record<string, number> = {};
    filteredDep.forEach(d => {
      const reg = d.regionDeploy || d.regionName || '—';
      r[reg] = (r[reg] || 0) + 1;
    });
    return Object.entries(r).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredDep]);

  const currentList = activeSection === 'acquisitions' ? displayedAcq : displayedDep;
  const listItems   = showAll ? currentList : currentList.slice(0, 8);
  const listCount   = currentList.length;

  const getStatusColor = (st: string) => STATUS_COLORS[st] || COLORS.secondary;

  return (
    <MainLayout title="Accueil">
      <div ref={pageRef}>

        {/* ── Header ── */}
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1">{salutation}, {person?.firstName} 👋</h4>
            <p className="text-muted mb-0 small">
              {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={load} disabled={loading}>
              {loading
                ? <span className="spinner-border spinner-border-sm" />
                : <i className="bi bi-arrow-clockwise" />}
              Actualiser
            </button>
            <span className="badge bg-light text-secondary border px-3 py-2 d-flex align-items-center gap-1" style={{ fontSize:'12px' }}>
              <i className="bi bi-eye" />Lecture seule
            </span>
            <PeriodFilter value={period} onChange={setPeriod} />
          </div>
        </div>

        {/* ── Bandeau info ── */}
        <div className="alert alert-info border-0 rounded-4 d-flex align-items-center gap-3 mb-4 py-2 px-3">
          <i className="bi bi-info-circle-fill text-info" />
          <p className="mb-0 small">
            Votre rôle <strong>Utilisateur</strong> vous permet de consulter les données.
            Pour effectuer des actions, contactez un Administrateur.
          </p>
        </div>

        {/* ── KPI Cards ── */}
        <div className="row g-3 mb-4">
          {[
            { label:'Acquisitions',   value: loading ? '…' : acqKpiValue,                icon:'bi-box-seam-fill',  color:'primary'   },
            { label:'Déploiements',   value: loading ? '…' : depKpiValue,                icon:'bi-truck',          color:'success'   },
            { label:'Sites de santé', value: loading ? '…' : (data?.sitesTotal   ?? 0),  icon:'bi-hospital-fill',  color:'info'      },
            { label:'Archives',       value: loading ? '…' : (data?.archivesTotal ?? 0), icon:'bi-archive-fill',   color:'secondary' },
          ].map((c, i) => (
            <div key={i} className="col-6 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className={`rounded-3 bg-${c.color} bg-opacity-10 d-flex align-items-center justify-content-center`}
                      style={{ width:'44px', height:'44px' }}>
                      <i className={`bi ${c.icon} text-${c.color} fs-5`} />
                    </div>
                    <i className="bi bi-lock-fill text-muted opacity-50" style={{ fontSize:'13px' }} />
                  </div>
                  <div className={`fw-bold text-${c.color}`} style={{ fontSize:'32px', lineHeight:1 }}>{c.value}</div>
                  <div className="text-muted small mt-1">{c.label}</div>
                  <div className="mt-2 badge bg-secondary bg-opacity-10 text-secondary" style={{ fontSize:'9px' }}>
                    <i className="bi bi-lock me-1" />Accès restreint
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Métriques rapides ── */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width:'34px', height:'34px' }}>
                  <i className="bi bi-activity text-primary" style={{ fontSize:'14px' }} />
                </div>
                <span className="fw-semibold small">Couverture des sites</span>
              </div>
              <div className="d-flex align-items-end gap-2 mb-2">
                <span className="fw-bold text-primary" style={{ fontSize:'28px', lineHeight:1 }}>{coverageRate}%</span>
                <span className="text-muted small mb-1">des sites couverts</span>
              </div>
              <div className="progress rounded-3 mb-2" style={{ height:'10px' }}>
                <div className={`progress-bar ${coverageRate > 66 ? 'bg-success' : coverageRate > 33 ? 'bg-warning' : 'bg-danger'}`}
                  style={{ width:`${coverageRate}%`, transition:'width 1s ease' }} />
              </div>
              <small className="text-muted" style={{ fontSize:'10px' }}>
                {depKpiValue} déploiements / {data?.sitesTotal ?? 0} sites
              </small>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-3 bg-success bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width:'34px', height:'34px' }}>
                  <i className="bi bi-cpu text-success" style={{ fontSize:'14px' }} />
                </div>
                <span className="fw-semibold small">Types d'équipements</span>
              </div>
              <div className="d-flex align-items-end gap-2 mb-2">
                <span className="fw-bold text-success" style={{ fontSize:'28px', lineHeight:1 }}>{equipTypes.length}</span>
                <span className="text-muted small mb-1">types différents</span>
              </div>
              <div className="d-flex flex-wrap gap-1">
                {equipTypes.slice(0, 4).map(([t, n]) => (
                  <span key={t}
                    className={`badge ${selectedType === t ? 'bg-success text-white' : 'bg-success bg-opacity-10 text-success'}`}
                    style={{ fontSize:'9px', cursor:'pointer' }}
                    onClick={() => setSelectedType(selectedType === t ? null : t)}>
                    {t} ({n})
                  </span>
                ))}
                {equipTypes.length > 4 && (
                  <span className="badge bg-secondary bg-opacity-10 text-secondary" style={{ fontSize:'9px' }}>
                    +{equipTypes.length - 4}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div className="rounded-3 bg-warning bg-opacity-10 d-flex align-items-center justify-content-center" style={{ width:'34px', height:'34px' }}>
                  <i className="bi bi-pie-chart-fill text-warning" style={{ fontSize:'14px' }} />
                </div>
                <span className="fw-semibold small">Statuts équipements</span>
              </div>
              {loading || acqStatuts.length === 0 ? (
                <p className="text-muted small mt-2">—</p>
              ) : (
                <div className="mt-1">
                  {acqStatuts.slice(0, 4).map(([s, n], i) => {
                    const pct = filteredAcq.length > 0 ? Math.round((n / filteredAcq.length) * 100) : 0;
                    const col = getStatusColor(s);
                    return (
                      <div key={i} className="d-flex align-items-center gap-2 mb-1">
                        <span className="text-truncate" style={{ minWidth:'95px', fontSize:'10px', color:'#64748b' }}>
                          {s.replace(/_/g,' ')}
                        </span>
                        <div className="progress flex-grow-1 rounded-3" style={{ height:'6px' }}>
                          <div className="progress-bar" style={{ width:`${pct}%`, backgroundColor: col, transition:'width 0.8s ease' }} />
                        </div>
                        <span className="fw-bold small" style={{ minWidth:'22px', color: col, fontSize:'11px' }}>{n}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Corps principal ── */}
        <div className="row g-4">

          {/* ── GAUCHE ── */}
          <div className="col-lg-7" style={{ minWidth: 0 }}>
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-transparent border-0 pt-3 px-4 pb-0">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <div className="d-flex gap-1 p-1 rounded-3" style={{ background:'#f1f5f9' }}>
                    {([
                      { key:'acquisitions', label:'Acquisitions', count: displayedAcq.length, icon:'bi-box-seam-fill', color:'primary' },
                      { key:'deployments',  label:'Déploiements', count: displayedDep.length,  icon:'bi-truck',         color:'success' },
                    ] as { key: SectionTab; label: string; count: number; icon: string; color: string }[]).map(t => (
                      <button key={t.key}
                        className={`btn btn-sm d-flex align-items-center gap-1 rounded-2 ${activeSection === t.key ? `btn-${t.color}` : 'border-0 bg-transparent text-muted'}`}
                        style={{ fontSize:'12px' }}
                        onClick={() => {
                          setActiveSection(t.key);
                          setSearchTerm('');
                          setShowAll(false);
                          if (t.key === 'acquisitions') setSelectedType(null);
                        }}>
                        <i className={`bi ${t.icon}`} />
                        {t.label}
                        <span className={`badge ${activeSection === t.key ? 'bg-white text-'+t.color : 'bg-secondary bg-opacity-10 text-secondary'} ms-1`}
                          style={{ fontSize:'9px' }}>{t.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="input-group mb-2">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted" style={{ fontSize:'11px' }} />
                  </span>
                  <input type="text" className="form-control border-start-0"
                    placeholder={activeSection === 'acquisitions' ? 'Rechercher par tag, type, série...' : 'Rechercher par code, site, région...'}
                    value={searchTerm} style={{ fontSize:'12px' }}
                    onChange={e => { setSearchTerm(e.target.value); setShowAll(false); }} />
                  {searchTerm && (
                    <button className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
                      <i className="bi bi-x" />
                    </button>
                  )}
                </div>
                {activeSection === 'acquisitions' && equipTypes.length > 0 && (
                  <div className="d-flex flex-wrap gap-1 pb-2">
                    <button className={`btn btn-sm rounded-pill ${!selectedType ? 'btn-primary' : 'btn-outline-secondary'}`}
                      style={{ fontSize:'10px', padding:'2px 10px' }}
                      onClick={() => setSelectedType(null)}>
                      Tous ({filteredAcq.length})
                    </button>
                    {equipTypes.map(([t, n]) => (
                      <button key={t}
                        className={`btn btn-sm rounded-pill ${selectedType === t ? 'btn-primary' : 'btn-outline-primary'}`}
                        style={{ fontSize:'10px', padding:'2px 10px' }}
                        onClick={() => setSelectedType(selectedType === t ? null : t)}>
                        {t}
                        <span className={`ms-1 badge ${selectedType === t ? 'bg-white text-primary' : 'bg-primary bg-opacity-10 text-primary'}`}
                          style={{ fontSize:'8px' }}>{n}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="card-body pt-1 px-4">
                {loading ? (
                  <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary" /></div>
                ) : listItems.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className={`bi ${activeSection === 'acquisitions' ? 'bi-box-seam' : 'bi-truck'} fs-1 d-block mb-2 opacity-25`} />
                    <small>{searchTerm ? 'Aucun résultat' : 'Aucune donnée disponible'}</small>
                  </div>
                ) : activeSection === 'acquisitions' ? (
                  listItems.map((a: any, i: number) => {
                    const type   = a.typeName || a.Type || 'Autre';
                    const statut = a.status || a.statut || '';
                    const col    = getStatusColor(statut);
                    return (
                      <div key={i}
                        className={`d-flex align-items-center gap-3 py-2 ${i < listItems.length - 1 ? 'border-bottom' : ''}`}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8faff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <div className="rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ width:'36px', height:'36px' }}>
                          <i className="bi bi-box-seam-fill text-primary" style={{ fontSize:'13px' }} />
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-semibold small text-truncate">{a.tag || `ID-${a.id}`}</span>
                            <span className="badge bg-warning bg-opacity-10 text-warning flex-shrink-0" style={{ fontSize:'9px' }}>{type}</span>
                          </div>
                          <span className="text-muted text-truncate d-block" style={{ fontSize:'11px' }}>{a.serial || '—'}</span>
                        </div>
                        <div className="text-end flex-shrink-0">
                          {statut && (
                            <span className="badge d-block mb-1" style={{ background: col+'1a', color: col, fontSize:'9px' }}>
                              {statut.replace(/_/g,' ')}
                            </span>
                          )}
                          <span className="text-muted" style={{ fontSize:'10px' }}>
                            {a.dateAcquisition ? new Date(a.dateAcquisition).toLocaleDateString('fr-FR') : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  listItems.map((d: any, i: number) => (
                    <div key={i}
                      className={`d-flex align-items-center gap-3 py-2 ${i < listItems.length - 1 ? 'border-bottom' : ''}`}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div className="rounded-3 bg-success bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width:'36px', height:'36px' }}>
                        <i className="bi bi-truck text-success" style={{ fontSize:'13px' }} />
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="fw-semibold small text-truncate">{d.codeDep || d.code || `DEP-${d.id}`}</div>
                        <span className="text-muted text-truncate d-block" style={{ fontSize:'11px' }}>{d.healthDeploy || d.healthSiteName || '—'}</span>
                      </div>
                      <div className="text-end flex-shrink-0">
                        {(d.regionDeploy || d.regionName) && (
                          <span className="badge bg-info bg-opacity-10 text-info d-block mb-1" style={{ fontSize:'9px' }}>
                            {d.regionDeploy || d.regionName}
                          </span>
                        )}
                        <span className="text-muted" style={{ fontSize:'10px' }}>
                          {(d.dateRecep || d.dateDeployment)
                            ? new Date(d.dateRecep || d.dateDeployment).toLocaleDateString('fr-FR') : '—'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                {!showAll && listCount > 8 && listItems.length > 0 && (
                  <div className="text-center pt-3">
                    <button className="btn btn-sm btn-outline-primary rounded-pill d-inline-flex align-items-center gap-1"
                      onClick={() => setShowAll(true)} style={{ fontSize:'12px' }}>
                      <i className="bi bi-chevron-down" />Voir {listCount - 8} de plus
                    </button>
                  </div>
                )}
                {showAll && listCount > 8 && (
                  <div className="text-center pt-3">
                    <button className="btn btn-sm btn-outline-secondary rounded-pill d-inline-flex align-items-center gap-1"
                      onClick={() => setShowAll(false)} style={{ fontSize:'12px' }}>
                      <i className="bi bi-chevron-up" />Réduire
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── DROITE — graphiques ── */}
          <div className="col-lg-5" style={{ minWidth: 0 }}>

            {/* Pie */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-transparent border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-pie-chart-fill text-warning me-2" />Répartition par type
                </h6>
                {selectedType && (
                  <button className="btn btn-sm btn-primary rounded-pill d-inline-flex align-items-center gap-1"
                    style={{ fontSize:'10px' }} onClick={() => setSelectedType(null)}>
                    <i className="bi bi-funnel-fill" />{selectedType}<i className="bi bi-x ms-1" />
                  </button>
                )}
              </div>
              {pieData.length === 0 ? (
                <p className="text-muted small text-center py-5">Aucune acquisition</p>
              ) : (
                <ChartBox height={220}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" outerRadius={75} innerRadius={30} paddingAngle={2}
                        onClick={(entry: any) => setSelectedType(selectedType === entry.name ? null : entry.name)}>
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}
                            opacity={!selectedType || selectedType === entry.name ? 1 : 0.25}
                            style={{ cursor:'pointer' }} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize:'10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartBox>
              )}
              <p className="text-center text-muted pb-2 mb-0" style={{ fontSize:'10px' }}>
                Cliquez sur un segment pour filtrer la liste
              </p>
            </div>

            {/* Bar */}
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-transparent border-0 pt-3 pb-0">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-bar-chart-fill text-primary me-2" />Vue d'ensemble
                </h6>
              </div>
              <ChartBox height={190}>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={summaryBarData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize:10 }} />
                    <YAxis tick={{ fontSize:10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[6,6,0,0]}>
                      {summaryBarData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>

            {/* Top régions */}
            {topRegions.length > 0 && (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-header bg-transparent border-0 pt-3 pb-0">
                  <h6 className="fw-bold mb-0">
                    <i className="bi bi-geo-alt-fill text-success me-2" />Top régions déployées
                  </h6>
                </div>
                <div className="card-body pt-2">
                  {topRegions.map(([reg, count], i) => {
                    const max = topRegions[0][1];
                    const pct = max > 0 ? Math.round((count / max) * 100) : 0;
                    return (
                      <div key={i} className="mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="small fw-semibold text-truncate" style={{ maxWidth:'160px' }}>{reg}</span>
                          <span className="badge bg-success bg-opacity-10 text-success" style={{ fontSize:'10px' }}>{count} dép.</span>
                        </div>
                        <div className="progress rounded-3" style={{ height:'6px' }}>
                          <div className="progress-bar bg-success" style={{ width:`${pct}%`, transition:'width 0.8s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── BAS — évolution mensuelle ── */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-transparent border-0 pt-3 pb-0">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-graph-up-arrow text-primary me-2" />Évolution mensuelle des acquisitions — 6 derniers mois
                </h6>
              </div>
              <ChartBox height={220}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="gradUserBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={COLORS.primary} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0}   />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mois" tick={{ fontSize:11 }} />
                    <YAxis tick={{ fontSize:11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="total" name="Acquisitions"
                      stroke={COLORS.primary} strokeWidth={2.5} fill="url(#gradUserBlue)"
                      dot={{ r:4, fill:COLORS.primary, strokeWidth:2, stroke:'white' }}
                      activeDot={{ r:6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartBox>
            </div>
          </div>

          {/* ── Accès restreints ── */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-transparent border-0 pt-3 pb-0">
                <h6 className="fw-bold mb-0 text-danger">
                  <i className="bi bi-lock-fill me-2" />Accès non disponibles pour votre rôle
                </h6>
              </div>
              <div className="card-body pt-2">
                <p className="text-muted small fw-semibold mb-2" style={{ fontSize:'11px' }}>
                  <i className="bi bi-eye-slash me-1" />Pages de consultation
                </p>
                <div className="row g-2 mb-3">
                  {[
                    { label:'Accéder aux acquisitions',   icon:'bi-box-seam-fill'  },
                    { label:'Accéder aux déploiements',   icon:'bi-truck'          },
                    { label:'Accéder aux sites de santé', icon:'bi-hospital-fill'  },
                    { label:'Accéder aux archives',       icon:'bi-archive-fill'   },
                  ].map((item, i) => (
                    <div key={i} className="col-md-3">
                      <div className="d-flex align-items-center gap-2 p-2 rounded-3"
                        style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.15)' }}>
                        <i className={`bi ${item.icon} text-danger`} style={{ fontSize:'13px' }} />
                        <span className="small text-danger flex-grow-1" style={{ fontSize:'11px' }}>{item.label}</span>
                        <i className="bi bi-lock-fill text-danger" style={{ fontSize:'9px', opacity:0.7 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-muted small fw-semibold mb-2" style={{ fontSize:'11px' }}>
                  <i className="bi bi-slash-circle me-1" />Actions de gestion
                </p>
                <div className="row g-2">
                  {[
                    { label:'Créer des acquisitions',     icon:'bi-plus-circle'      },
                    { label:'Gérer les déploiements',     icon:'bi-truck'            },
                    { label:'Enregistrer interventions',  icon:'bi-tools'            },
                    { label:'Gérer le parc logistique',   icon:'bi-car-front-fill'   },
                    { label:'Créer des comptes',          icon:'bi-person-plus-fill' },
                    { label:'Configurer les permissions', icon:'bi-shield-shaded'    },
                  ].map((item, i) => (
                    <div key={i} className="col-md-4">
                      <div className="d-flex align-items-center gap-2 p-2 rounded-3"
                        style={{ background:'rgba(100,116,139,0.07)', border:'1px solid rgba(100,116,139,0.15)' }}>
                        <i className={`bi ${item.icon} text-secondary`} style={{ fontSize:'13px' }} />
                        <span className="small text-secondary flex-grow-1" style={{ fontSize:'11px' }}>{item.label}</span>
                        <i className="bi bi-lock-fill text-secondary" style={{ fontSize:'9px', opacity:0.6 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardUser;