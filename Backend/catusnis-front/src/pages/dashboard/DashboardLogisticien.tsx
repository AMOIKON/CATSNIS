import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/common/MainLayout';
import ChartExportButton from '../../components/common/ChartExportButton';
import MultiChart, { ChartFilter, DEFAULT_CHART_FILTER } from '../../components/common/MultiChart';
import { filterByPeriod, PeriodKey } from '../../components/common/PeriodFilter';
import useAuth from '../../hooks/useAuth';
import DashboardService, { GlobalStats } from '../../services/DashboardService';
import FournitureService, { FournitureStats } from '../../services/Fournitureservice';

const COLORS = {
  primary:'#3b82f6', success:'#22c55e', warning:'#f59e0b',
  info:'#06b6d4',    danger:'#ef4444',  purple:'#8b5cf6',
};
const PIE_COLORS = ['#3b82f6','#22c55e','#f59e0b','#06b6d4','#8b5cf6','#ef4444','#ec4899','#14b8a6'];
const TYPE_LABELS: Record<string, string> = {
  MOTO:'Motos', VOITURE:'Voitures', CAMION:'Camions', MINIBUS:'Minibus', AUTRE:'Autres',
};

const DashboardLogisticien: React.FC = () => {
  const { person } = useAuth();
  const navigate   = useNavigate();
  const pageRef    = useRef<HTMLDivElement | null>(null);

  const [stats,           setStats]           = useState<GlobalStats | null>(null);
  const [fournitureStats, setFournitureStats] = useState<FournitureStats | null>(null);
  const [affectations,    setAffectations]    = useState<any[]>([]);
  const [alertes,         setAlertes]         = useState<any[]>([]);
  const [vehicules,       setVehicules]       = useState<any[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [missionPeriod,   setMissionPeriod]   = useState<PeriodKey>('all');

  // Filtres gérés en interne par MultiChart
  const [, setTypeFilter]   = useState<ChartFilter>(DEFAULT_CHART_FILTER);
  const [, setStatusFilter] = useState<ChartFilter>(DEFAULT_CHART_FILTER);
  const [, setRadarFilter]  = useState<ChartFilter>(DEFAULT_CHART_FILTER);
  const [, setAlertFilter]  = useState<ChartFilter>(DEFAULT_CHART_FILTER);
  const [, setNiveauFilter] = useState<ChartFilter>(DEFAULT_CHART_FILTER);
  const [, setCatFilter]    = useState<ChartFilter>(DEFAULT_CHART_FILTER);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, aff, al, fStats] = await Promise.all([
        DashboardService.getGlobalStats(),
        DashboardService.getActiveAffectations(20),
        DashboardService.getAlertes(30),
        FournitureService.stats().catch(() => null),
      ]);
      setStats(g);
      setAffectations(aff);
      setAlertes(al);
      setFournitureStats(fStats);

      const VehiculeService = (await import('../../services/vehiculeService')).default;
      const vPage = await VehiculeService.getAll(0, 200).catch(() => ({ content: [] } as any));
      setVehicules(vPage?.content || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const heure      = new Date().getHours();
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';

  // ── Données graphiques engins ───────────────────────────────────────────────

  const fleetTypeData = useMemo(() =>
    stats ? Object.entries(stats.vehiculesByType)
      .map(([k, v]) => ({ name: TYPE_LABELS[k] || k, value: v }))
    : [], [stats]);

  const fleetStatusData = useMemo(() => [
    { name:'Disponibles', value: vehicules.filter((v:any) => v?.statut === 'DISPONIBLE').length, color: COLORS.success },
    { name:'En mission',  value: vehicules.filter((v:any) => v?.statut === 'EN_MISSION').length, color: COLORS.info    },
    { name:'En panne',    value: vehicules.filter((v:any) => v?.statut === 'EN_PANNE').length,   color: COLORS.danger  },
  ], [vehicules]);

  const radarData = useMemo(() => stats ? [
    { axe:'Total',       valeur: stats.vehiculesTotal       },
    { axe:'Disponibles', valeur: stats.vehiculesDisponibles },
    { axe:'Mission',     valeur: stats.vehiculesEnMission   },
    { axe:'Panne',       valeur: stats.vehiculesEnPanne     },
    { axe:'Alertes',     valeur: stats.alertesTotal         },
  ] : [], [stats]);

  const alertTypeData = useMemo(() => {
    const grouped: Record<string, number> = {};
    alertes.forEach((a: any) => { const t = a?.typeAlerte || 'AUTRE'; grouped[t] = (grouped[t] || 0) + 1; });
    return Object.entries(grouped).map(([name, value], i) => ({
      name: name.replace('_', ' '), value, color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [alertes]);

  const alertNiveauData = useMemo(() => [
    { name:'Expirés',   value: alertes.filter((a:any) => a.niveau === 'EXPIRE').length,    color: COLORS.danger  },
    { name:'Critique',  value: alertes.filter((a:any) => a.niveau === 'CRITIQUE').length,  color: COLORS.warning },
    { name:'Attention', value: alertes.filter((a:any) => a.niveau === 'ATTENTION').length, color: COLORS.info    },
  ].filter(d => d.value > 0), [alertes]);

  // ── Données graphiques fournitures ──────────────────────────────────────────

  const fournitureCatData = useMemo(() => fournitureStats ? [
    { name:'Informatique',   value: fournitureStats.informatique,   color: COLORS.primary   },
    { name:'Mobilier',       value: fournitureStats.mobilier,       color: COLORS.success   },
    { name:'Papeterie',      value: fournitureStats.papeterie,      color: COLORS.warning   },
    { name:'Bureautique',    value: fournitureStats.bureautique,    color: COLORS.info      },
    { name:'Électroménager', value: fournitureStats.electromenager, color: COLORS.danger    },
  ].filter(d => d.value > 0) : [], [fournitureStats]);

  const fournitureStatusData = useMemo(() => fournitureStats ? [
    { name:'Disponibles', value: fournitureStats.disponibles, color: COLORS.success },
    { name:'Déployés',    value: fournitureStats.deployes,    color: COLORS.primary },
    { name:'En rupture',  value: fournitureStats.enRupture,   color: COLORS.danger  },
  ] : [], [fournitureStats]);

  const filteredAff = useMemo(
    () => filterByPeriod(affectations, missionPeriod, 'dateAffectation' as any),
    [affectations, missionPeriod],
  );

  // ── KPIs engins ──────────────────────────────────────────────────────────────
  const kpisEngins = [
    { label:'Total engins',  value: stats?.vehiculesTotal,       icon:'bi-car-front-fill',           color:'primary' },
    { label:'Disponibles',   value: stats?.vehiculesDisponibles,  icon:'bi-check-circle-fill',         color:'success' },
    { label:'En mission',    value: stats?.vehiculesEnMission,    icon:'bi-geo-alt-fill',              color:'info'    },
    { label:'En panne',      value: stats?.vehiculesEnPanne,      icon:'bi-exclamation-triangle-fill', color:'danger'  },
    { label:'Docs expirés',  value: stats?.alertesExpirees,       icon:'bi-file-earmark-x-fill',
      color: (stats?.alertesExpirees ?? 0) > 0 ? 'danger' : 'secondary' },
    { label:'Alertes total', value: stats?.alertesTotal,          icon:'bi-bell-fill',
      color: (stats?.alertesTotal ?? 0) > 0 ? 'warning' : 'secondary' },
  ];

  // ── KPIs fournitures ─────────────────────────────────────────────────────────
  const kpisFournitures = fournitureStats ? [
    { label:'Total articles',      value: fournitureStats.total,             icon:'bi-box-seam-fill',   color:'secondary' },
    { label:'Disponibles',         value: fournitureStats.disponibles,       icon:'bi-check-circle-fill', color:'success' },
    { label:'Déployés',            value: fournitureStats.deployes,          icon:'bi-box-arrow-right',  color:'primary'  },
    { label:'En rupture',          value: fournitureStats.enRupture,         icon:'bi-exclamation-triangle-fill',
      color: fournitureStats.enRupture > 0 ? 'danger' : 'secondary' },
    { label:'Déploiements actifs', value: fournitureStats.totalDeploiements, icon:'bi-people-fill',      color:'info'     },
  ] : [];

  return (
    <MainLayout title="Dashboard logistique">
      <div ref={pageRef}>

        {/* ── Header ── */}
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1">{salutation}, {person?.firstName} 👋</h4>
            <p className="text-muted mb-0 small">Suivi du parc logistique & fournitures</p>
          </div>
          <div className="d-flex gap-2">
            <ChartExportButton targetRef={pageRef} filename="dashboard-logistique" />
            <button className="btn btn-success btn-sm" onClick={() => navigate('/vehicules')}>
              <i className="bi bi-car-front-fill me-1" />Engins
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/fournitures')}>
              <i className="bi bi-box-seam-fill me-1" />Fournitures
            </button>
          </div>
        </div>

        {/* ══ SECTION ENGINS ══ */}
        <div className="d-flex align-items-center gap-2 mb-3 mt-2">
          <div className="rounded-3 bg-success bg-opacity-10 d-flex align-items-center justify-content-center"
            style={{ width:'32px', height:'32px' }}>
            <i className="bi bi-car-front-fill text-success" />
          </div>
          <h6 className="fw-bold mb-0 text-success">Parc — Engins roulants</h6>
        </div>

        <div className="row g-3 mb-4">
          {kpisEngins.map((s, i) => (
            <div key={i} className="col-6 col-md-2">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-3">
                  <div className={`rounded-3 bg-${s.color} bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-2`}
                    style={{ width:'38px', height:'38px' }}>
                    <i className={`bi ${s.icon} text-${s.color}`} />
                  </div>
                  <div className={`fw-bold fs-4 text-${s.color}`}>{loading ? '…' : (s.value ?? 0)}</div>
                  <div className="text-muted small">{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <MultiChart title="Répartition par type" icon="bi-pie-chart-fill" iconColor={COLORS.success}
              data={fleetTypeData} nameKey="name" valueKey="value"
              colors={PIE_COLORS} height={260} defaultType="pie"
              isEmpty={fleetTypeData.length === 0} emptyMsg="Aucun engin"
              onFilterChange={setTypeFilter} />
          </div>
          <div className="col-md-4">
            <MultiChart title="Statuts du parc" icon="bi-bar-chart-fill" iconColor={COLORS.info}
              data={fleetStatusData} nameKey="name" valueKey="value"
              height={260} defaultType="bar"
              onFilterChange={setStatusFilter} />
          </div>
          <div className="col-md-4">
            <MultiChart title="Vue radar parc" icon="bi-radar" iconColor={COLORS.purple}
              data={radarData} nameKey="axe" valueKey="valeur"
              height={260} defaultType="radar"
              isEmpty={radarData.every(d => d.valeur === 0)} emptyMsg="Aucun engin"
              onFilterChange={setRadarFilter} />
          </div>

          {alertTypeData.length > 0 && (
            <div className="col-md-6">
              <MultiChart title="Alertes par type" icon="bi-bell-fill" iconColor={COLORS.danger}
                data={alertTypeData} nameKey="name" valueKey="value"
                height={240} defaultType="bar" onFilterChange={setAlertFilter} />
            </div>
          )}
          {alertNiveauData.length > 0 && (
            <div className="col-md-6">
              <MultiChart title="Alertes par niveau" icon="bi-pie-chart-fill" iconColor={COLORS.danger}
                data={alertNiveauData} nameKey="name" valueKey="value"
                height={240} defaultType="pie" onFilterChange={setNiveauFilter} />
            </div>
          )}
        </div>

        {/* ══ SECTION FOURNITURES ══ */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <div className="rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
            style={{ width:'32px', height:'32px' }}>
            <i className="bi bi-box-seam-fill text-primary" />
          </div>
          <h6 className="fw-bold mb-0 text-primary">Fournitures & Mobilier de bureau</h6>
        </div>

        {fournitureStats ? (
          <>
            <div className="row g-3 mb-4">
              {kpisFournitures.map((s, i) => (
                <div key={i} className="col-6 col-md">
                  <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div className="card-body p-3">
                      <div className={`rounded-3 bg-${s.color} bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-2`}
                        style={{ width:'38px', height:'38px' }}>
                        <i className={`bi ${s.icon} text-${s.color}`} />
                      </div>
                      <div className={`fw-bold fs-4 text-${s.color}`}>{s.value}</div>
                      <div className="text-muted small">{s.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <MultiChart title="Articles par catégorie" icon="bi-pie-chart-fill" iconColor={COLORS.primary}
                  data={fournitureCatData} nameKey="name" valueKey="value"
                  colors={PIE_COLORS} height={260} defaultType="pie"
                  isEmpty={fournitureCatData.length === 0} emptyMsg="Aucun article"
                  onFilterChange={setCatFilter} />
              </div>
              <div className="col-md-6">
                <MultiChart title="Statuts du stock" icon="bi-bar-chart-fill" iconColor={COLORS.primary}
                  data={fournitureStatusData} nameKey="name" valueKey="value"
                  height={260} defaultType="bar"
                  isEmpty={fournitureStatusData.every(d => d.value === 0)}
                  onFilterChange={setCatFilter} />
              </div>
            </div>
          </>
        ) : (
          <div className="alert alert-info border-0 rounded-4 mb-4">
            <i className="bi bi-info-circle-fill me-2" />
            Les données fournitures seront disponibles après le démarrage du module.
          </div>
        )}

        {/* ══ SECTION OPÉRATIONNEL ══ */}
        <div className="row g-4">

          {/* Documents à renouveler */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-transparent border-0 pt-3 pb-0">
                <h6 className="fw-bold mb-0 text-danger"><i className="bi bi-bell-fill me-2" />Documents à renouveler</h6>
              </div>
              <div className="card-body pt-2">
                {alertes.length === 0
                  ? <div className="text-center py-3 text-success">
                      <i className="bi bi-shield-check fs-3 d-block mb-1" />
                      <small>Tous documents valides</small>
                    </div>
                  : alertes.slice(0, 6).map((a: any, i: number) => (
                      <div key={i} className={`d-flex justify-content-between align-items-center py-2 ${i < 5 ? 'border-bottom' : ''}`}>
                        <div>
                          <p className="mb-0 small fw-semibold">{a.immatriculation}</p>
                          <p className="mb-0 text-muted" style={{ fontSize:'11px' }}>{a.typeAlerte?.replace('_', ' ')}</p>
                        </div>
                        <span className={`badge ${a.niveau === 'EXPIRE' ? 'bg-danger' : 'bg-warning text-dark'}`} style={{ fontSize:'9px' }}>
                          {a.niveau === 'EXPIRE' ? 'EXPIRÉ' : `${a.joursRestants}j`}
                        </span>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>

          {/* Missions actives */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-transparent border-0 pt-3 pb-0 d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0"><i className="bi bi-person-fill-check text-info me-2" />Missions actives ({filteredAff.length})</h6>
                <select className="form-select form-select-sm" style={{ width:'auto', fontSize:'11px' }}
                  value={missionPeriod} onChange={e => setMissionPeriod(e.target.value as PeriodKey)}>
                  <option value="all">Toute période</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                </select>
              </div>
              <div className="card-body pt-2">
                {filteredAff.length === 0
                  ? <p className="text-muted small text-center py-3">Aucune mission</p>
                  : filteredAff.slice(0, 6).map((aff: any, i: number) => (
                      <div key={i} className={`d-flex align-items-center gap-2 py-2 ${i < 5 ? 'border-bottom' : ''}`}>
                        <div className="rounded-circle bg-info bg-opacity-10 d-flex align-items-center justify-content-center"
                          style={{ width:'32px', height:'32px', minWidth:'32px' }}>
                          <i className="bi bi-car-front-fill text-info small" />
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                          <p className="mb-0 small fw-semibold text-truncate">{aff.immatriculation}</p>
                          <p className="mb-0 text-muted text-truncate" style={{ fontSize:'11px' }}>{aff.personNom || '—'}</p>
                        </div>
                        <span className="badge bg-info bg-opacity-10 text-info" style={{ fontSize:'9px' }}>Active</span>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardLogisticien;