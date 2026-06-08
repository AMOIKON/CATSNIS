import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/common/MainLayout';
import ChartExportButton from '../../components/common/ChartExportButton';
import PeriodFilter, { PeriodKey, filterByPeriod } from '../../components/common/PeriodFilter';
import SafeChart from '../../components/common/SafeChart';
import useAuth from '../../hooks/useAuth';
import DashboardService, { GlobalStats, EquipStats } from '../../services/DashboardService';

type DashTab = 'general' | 'equip' | 'logi';

const COLORS = {
  primary: '#3b82f6', success: '#22c55e', warning: '#f59e0b',
  info: '#06b6d4', danger: '#ef4444', secondary: '#64748b', purple: '#8b5cf6',
};
const PIE_COLORS = ['#3b82f6','#22c55e','#f59e0b','#06b6d4','#8b5cf6','#ef4444','#ec4899','#14b8a6'];
const TYPE_LABELS: Record<string, string> = {
  MOTO:'Motos', VOITURE:'Voitures', CAMION:'Camions', MINIBUS:'Minibus', AUTRE:'Autres',
};

interface KpiCardProps { label: string; value: number | string | undefined; icon: string; color: string; }
const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, color }) => (
  <div className="card border-0 shadow-sm rounded-4 h-100">
    <div className="card-body p-3">
      <div className={`rounded-3 bg-${color} bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-2`}
        style={{ width: '38px', height: '38px' }}>
        <i className={`bi ${icon} text-${color}`} />
      </div>
      <div className={`fw-bold fs-4 text-${color}`}>{value ?? 0}</div>
      <div className="text-muted small">{label}</div>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { person } = useAuth();
  const navigate   = useNavigate();
  const pageRef    = useRef<HTMLDivElement>(null);

  const [activeTab,    setActiveTab]    = useState<DashTab>('general');
  const [period,       setPeriod]       = useState<PeriodKey>('all');
  const [stats,        setStats]        = useState<GlobalStats | null>(null);
  const [equipStats,   setEquipStats]   = useState<EquipStats | null>(null);
  const [affectations, setAffectations] = useState<any[]>([]);
  const [alertes,      setAlertes]      = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, e, aff, al] = await Promise.all([
        DashboardService.getGlobalStats(),
        DashboardService.getEquipStats(),
        DashboardService.getActiveAffectations(10),
        DashboardService.getAlertes(30),
      ]);
      setStats(g); setEquipStats(e); setAffectations(aff); setAlertes(al);
    } catch (err) { console.error('[DashboardPage]', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!stats || !equipStats) return null;
    const list = stats.acquisitions as any[];
    return {
      acquisitions:  filterByPeriod(list, period, 'dateAcquisition' as any),
      deployments:   filterByPeriod(stats.deployments  as any[], period, 'dateDeployment'   as any),
      interventions: filterByPeriod(stats.interventions as any[], period, 'dateIntervention' as any),
    };
  }, [stats, equipStats, period]);

  const heure      = new Date().getHours();
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';

  const tabs: Array<{ key: DashTab; icon: string; label: string }> = [
    { key: 'general', icon: 'bi-house-fill',     label: 'Général'     },
    { key: 'equip',   icon: 'bi-box-seam-fill',  label: 'Équipements' },
    { key: 'logi',    icon: 'bi-car-front-fill',  label: 'Logistique'  },
  ];

  const fleetTypeData = stats
    ? Object.entries(stats.vehiculesByType).map(([k, v]) => ({ name: TYPE_LABELS[k] || k, value: v }))
    : [];

  const fleetStatusData = stats ? [
    { name: 'Disponibles', value: stats.vehiculesDisponibles, color: COLORS.success },
    { name: 'En mission',  value: stats.vehiculesEnMission,   color: COLORS.info    },
    { name: 'En panne',    value: stats.vehiculesEnPanne,     color: COLORS.danger  },
  ] : [];

  const generalKpiData = filtered ? [
    { name: 'Acquis.',  value: filtered.acquisitions.length,  color: COLORS.primary },
    { name: 'Déploi.',  value: filtered.deployments.length,   color: COLORS.success },
    { name: 'Interv.',  value: filtered.interventions.length, color: COLORS.warning },
    { name: 'Engins',   value: stats?.vehiculesTotal ?? 0,    color: COLORS.info    },
    { name: 'Sites',    value: stats?.sitesTotal ?? 0,        color: COLORS.purple  },
  ] : [];

  const equipTypeData = useMemo(() => {
    if (!filtered) return [];
    const grouped: Record<string, number> = {};
    filtered.acquisitions.forEach((a: any) => {
      const t: string = a?.typeName || a?.Type || a?.type?.name || a?.type || 'Autre';
      grouped[t] = (grouped[t] || 0) + (Number(a?.quantite ?? a?.quantity) || 1);
    });
    return Object.entries(grouped).slice(0, 8).map(([k, v]) => ({ name: k, value: v }));
  }, [filtered]);

  const equipStatusData = useMemo(() => {
    if (!filtered) return [];
    const grouped: Record<string, number> = {};
    filtered.interventions.forEach((it: any) => {
      const s: string = it?.statut || it?.status || 'INCONNU';
      grouped[s] = (grouped[s] || 0) + 1;
    });
    return Object.entries(grouped).map(([k, v]) => ({ name: k.replace('_', ' '), value: v }));
  }, [filtered]);

  const monthlyData = equipStats
    ? Object.keys(equipStats.deploymentsByMonth).map(mois => ({
        mois,
        acquisitions:  equipStats.acquisitionsByMonth[mois]  || 0,
        deploiements:  equipStats.deploymentsByMonth[mois]   || 0,
        interventions: equipStats.interventionsByMonth[mois] || 0,
      }))
    : [];

  const radarData = stats ? [
    { axe: 'Total',       valeur: stats.vehiculesTotal       },
    { axe: 'Disponibles', valeur: stats.vehiculesDisponibles },
    { axe: 'Mission',     valeur: stats.vehiculesEnMission   },
    { axe: 'Panne',       valeur: stats.vehiculesEnPanne     },
    { axe: 'Alertes',     valeur: stats.alertesTotal         },
  ] : [];

  return (
    <MainLayout title="Tableau de bord">
      <div ref={pageRef}>
        {/* ── Header ── */}
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1">{salutation}, {person?.firstName} 👋</h4>
            <p className="text-muted mb-0 small">
              {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <ChartExportButton targetRef={pageRef} filename={`dashboard-${activeTab}`} />
            <button className="btn btn-sm btn-outline-success" onClick={() => navigate('/vehicules')}>
              <i className="bi bi-car-front-fill me-1" />Parc
            </button>
          </div>
        </div>

        {/* ── Onglets + Filtre ── */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div className="d-flex gap-2 p-1 rounded-4 bg-white shadow-sm border" style={{ width: 'fit-content' }}>
            {tabs.map(t => (
              <button key={t.key}
                className={`btn btn-sm d-flex align-items-center gap-2 rounded-3 ${activeTab === t.key ? 'btn-dark' : 'btn-outline-secondary border-0 text-muted'}`}
                onClick={() => setActiveTab(t.key)}>
                <i className={`bi ${t.icon}`} />{t.label}
              </button>
            ))}
          </div>
          <PeriodFilter value={period} onChange={setPeriod} />
        </div>

        {/* ══ GÉNÉRAL ══ */}
        {activeTab === 'general' && (
          <>
            <div className="row g-3 mb-4">
              {loading ? (
                <div className="col-12 text-center py-3"><div className="spinner-border" /></div>
              ) : ([
                { label:'Acquisitions',  value: filtered?.acquisitions.length ?? 0,  icon:'bi-box-seam-fill',  color:'primary'   },
                { label:'Déploiements',  value: filtered?.deployments.length ?? 0,    icon:'bi-truck',          color:'success'   },
                { label:'Interventions', value: filtered?.interventions.length ?? 0,  icon:'bi-tools',          color:'warning'   },
                { label:'Engins',        value: stats?.vehiculesTotal ?? 0,            icon:'bi-car-front-fill', color:'info'      },
                { label:'Sites',         value: stats?.sitesTotal ?? 0,                icon:'bi-hospital-fill',  color:'secondary' },
                { label:'Alertes',       value: stats?.alertesTotal ?? 0,              icon:'bi-bell-fill',
                  color: (stats?.alertesTotal ?? 0) > 0 ? 'danger' : 'secondary' },
              ] as KpiCardProps[]).map((s, i) => (
                <div key={i} className="col-6 col-md-2"><KpiCard {...s} /></div>
              ))}
            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-transparent border-0 pt-3 pb-0">
                    <h6 className="fw-bold mb-0"><i className="bi bi-bar-chart-fill text-primary me-2" />Vue globale</h6>
                  </div>
                  <SafeChart height={280} isEmpty={generalKpiData.length === 0}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={generalKpiData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[6,6,0,0]}>
                          {generalKpiData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </SafeChart>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-transparent border-0 pt-3 pb-0">
                    <h6 className="fw-bold mb-0"><i className="bi bi-pie-chart-fill text-info me-2" />Statuts du parc</h6>
                  </div>
                  <SafeChart height={280} isEmpty={fleetStatusData.every(d => d.value === 0)} emptyMsg="Aucun engin">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={fleetStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {fleetStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </SafeChart>
                </div>
              </div>

              <div className="col-md-8">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-transparent border-0 pt-3 pb-0">
                    <h6 className="fw-bold mb-0"><i className="bi bi-graph-up-arrow text-success me-2" />Activité combinée — 6 derniers mois</h6>
                  </div>
                  <SafeChart height={280}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData}>
                        <defs>
                          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={COLORS.primary} stopOpacity={0.6} />
                            <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0}   />
                          </linearGradient>
                          <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={COLORS.success} stopOpacity={0.6} />
                            <stop offset="100%" stopColor={COLORS.success} stopOpacity={0}   />
                          </linearGradient>
                          <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor={COLORS.warning} stopOpacity={0.6} />
                            <stop offset="100%" stopColor={COLORS.warning} stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="acquisitions"  stroke={COLORS.primary} fill="url(#g1)" />
                        <Area type="monotone" dataKey="deploiements"  stroke={COLORS.success} fill="url(#g2)" />
                        <Area type="monotone" dataKey="interventions" stroke={COLORS.warning} fill="url(#g3)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </SafeChart>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-transparent border-0 pt-3 pb-0">
                    <h6 className="fw-bold mb-0" style={{ color: COLORS.purple }}><i className="bi bi-radar me-2" />Vue radar parc</h6>
                  </div>
                  <SafeChart height={280} isEmpty={radarData.every(d => d.valeur === 0)} emptyMsg="Aucun engin">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="axe" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis tick={{ fontSize: 9 }} />
                        <Radar dataKey="valeur" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.4} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </SafeChart>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ ÉQUIPEMENTS ══ */}
        {activeTab === 'equip' && filtered && (
          <>
            <div className="row g-3 mb-4">
              {([
                { label:'Acquisitions',   value: filtered.acquisitions.length,  icon:'bi-box-seam-fill', color:'primary' },
                { label:'Déploiements',   value: filtered.deployments.length,   icon:'bi-truck',         color:'success' },
                { label:'Interventions',  value: filtered.interventions.length, icon:'bi-tools',         color:'warning' },
                { label:'Sites couverts', value: stats?.sitesTotal ?? 0,        icon:'bi-hospital-fill', color:'info'    },
              ] as KpiCardProps[]).map((s, i) => (
                <div key={i} className="col-6 col-md-3"><KpiCard {...s} /></div>
              ))}
            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-transparent border-0 pt-3 pb-0">
                    <h6 className="fw-bold mb-0"><i className="bi bi-pie-chart-fill text-warning me-2" />Acquisitions par type</h6>
                  </div>
                  <SafeChart height={320} isEmpty={equipTypeData.length === 0}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={equipTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                          {equipTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </SafeChart>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-transparent border-0 pt-3 pb-0">
                    <h6 className="fw-bold mb-0"><i className="bi bi-bar-chart-steps text-primary me-2" />Top types d'équipements</h6>
                  </div>
                  <SafeChart height={320} isEmpty={equipTypeData.length === 0}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={equipTypeData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[0,6,6,0]}>
                          {equipTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </SafeChart>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-transparent border-0 pt-3 pb-0">
                    <h6 className="fw-bold mb-0"><i className="bi bi-bar-chart-fill text-warning me-2" />Interventions par statut</h6>
                  </div>
                  <SafeChart height={300} isEmpty={equipStatusData.length === 0}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={equipStatusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill={COLORS.warning} radius={[6,6,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </SafeChart>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-transparent border-0 pt-3 pb-0">
                    <h6 className="fw-bold mb-0"><i className="bi bi-graph-up text-success me-2" />Évolution déploiements</h6>
                  </div>
                  <SafeChart height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="deploiements" stroke={COLORS.success} strokeWidth={3} dot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </SafeChart>
                </div>
              </div>

              <div className="col-12">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-transparent border-0 pt-3 pb-0">
                    <h6 className="fw-bold mb-0"><i className="bi bi-bezier text-primary me-2" />Activité équipements — combiné mensuel</h6>
                  </div>
                  <SafeChart height={320}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="acquisitions" barSize={20} fill={COLORS.primary} radius={[4,4,0,0]} />
                        <Bar dataKey="deploiements" barSize={20} fill={COLORS.success} radius={[4,4,0,0]} />
                        <Line type="monotone" dataKey="interventions" stroke={COLORS.warning} strokeWidth={3} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </SafeChart>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ LOGISTIQUE ══ */}
        {activeTab === 'logi' && stats && (
          <>
            <div className="row g-3 mb-4">
              {([
                { label:'Total engins',  value: stats.vehiculesTotal,       icon:'bi-car-front-fill',           color:'primary' },
                { label:'Disponibles',   value: stats.vehiculesDisponibles,  icon:'bi-check-circle-fill',         color:'success' },
                { label:'En mission',    value: stats.vehiculesEnMission,    icon:'bi-geo-alt-fill',              color:'info'    },
                { label:'En panne',      value: stats.vehiculesEnPanne,      icon:'bi-exclamation-triangle-fill', color:'danger'  },
                { label:'Docs expirés',  value: stats.alertesExpirees,       icon:'bi-file-earmark-x-fill',
                  color: stats.alertesExpirees > 0 ? 'danger' : 'secondary' },
                { label:'Alertes total', value: stats.alertesTotal,          icon:'bi-bell-fill',
                  color: stats.alertesTotal > 0 ? 'warning' : 'secondary' },
              ] as KpiCardProps[]).map((s, i) => (
                <div key={i} className="col-6 col-md-2"><KpiCard {...s} /></div>
              ))}
            </div>

            <div className="row g-4">
              <div className="col-md-4">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-transparent border-0 pt-3 pb-0">
                    <h6 className="fw-bold mb-0"><i className="bi bi-pie-chart-fill text-success me-2" />Répartition par type</h6>
                  </div>
                  <SafeChart height={280} isEmpty={fleetTypeData.length === 0} emptyMsg="Aucun engin">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={fleetTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {fleetTypeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip /><Legend wrapperStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </SafeChart>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-transparent border-0 pt-3 pb-0">
                    <h6 className="fw-bold mb-0"><i className="bi bi-bar-chart-fill text-info me-2" />Statuts</h6>
                  </div>
                  <SafeChart height={280}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fleetStatusData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[6,6,0,0]}>
                          {fleetStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </SafeChart>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-transparent border-0 pt-3 pb-0">
                    <h6 className="fw-bold mb-0" style={{ color: COLORS.purple }}><i className="bi bi-radar me-2" />Vue radar</h6>
                  </div>
                  <SafeChart height={280} isEmpty={radarData.every(d => d.valeur === 0)} emptyMsg="Aucun engin">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="axe" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis tick={{ fontSize: 9 }} />
                        <Radar dataKey="valeur" stroke={COLORS.purple} fill={COLORS.purple} fillOpacity={0.4} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </SafeChart>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-transparent border-0 pt-3 pb-0">
                    <h6 className="fw-bold mb-0 text-danger"><i className="bi bi-bell-fill me-2" />Alertes documents</h6>
                  </div>
                  <div className="card-body pt-2">
                    {alertes.length === 0
                      ? <div className="text-center py-3 text-success">
                          <i className="bi bi-shield-check fs-3 d-block mb-1" />
                          <small>Tous documents valides</small>
                        </div>
                      : alertes.slice(0, 6).map((a: any, i: number) => (
                          <div key={i} className={`d-flex justify-content-between align-items-center py-2 ${i < alertes.slice(0,6).length - 1 ? 'border-bottom' : ''}`}>
                            <div>
                              <p className="mb-0 small fw-semibold">{a.immatriculation}</p>
                              <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>{a.typeAlerte?.replace('_', ' ')}</p>
                            </div>
                            <span className={`badge ${a.niveau === 'EXPIRE' ? 'bg-danger' : 'bg-warning text-dark'}`} style={{ fontSize: '9px' }}>
                              {a.niveau === 'EXPIRE' ? 'EXPIRÉ' : `${a.joursRestants}j`}
                            </span>
                          </div>
                        ))
                    }
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-transparent border-0 pt-3 pb-0">
                    <h6 className="fw-bold mb-0"><i className="bi bi-person-fill-check text-info me-2" />Missions actives</h6>
                  </div>
                  <div className="card-body pt-2">
                    {affectations.length === 0
                      ? <p className="text-muted small text-center py-3">Aucune mission</p>
                      : affectations.slice(0, 6).map((aff: any, i: number) => (
                          <div key={i} className={`d-flex align-items-center gap-2 py-2 ${i < affectations.slice(0,6).length - 1 ? 'border-bottom' : ''}`}>
                            <div className="rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center"
                              style={{ width: '32px', height: '32px', minWidth: '32px' }}>
                              <i className="bi bi-car-front-fill text-info small" />
                            </div>
                            <div className="flex-grow-1 overflow-hidden">
                              <p className="mb-0 small fw-semibold text-truncate">{aff.immatriculation}</p>
                              <p className="mb-0 text-muted text-truncate" style={{ fontSize: '11px' }}>{aff.personNom || '—'}</p>
                            </div>
                            <span className="badge bg-info bg-opacity-10 text-info" style={{ fontSize: '9px' }}>Active</span>
                          </div>
                        ))
                    }
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default DashboardPage;