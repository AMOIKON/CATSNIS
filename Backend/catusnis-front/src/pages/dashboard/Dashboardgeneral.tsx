import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/common/MainLayout';
import ChartExportButton from '../../components/common/ChartExportButton';
import MultiChart, { ChartFilter, DEFAULT_CHART_FILTER, RegionOption, DistrictOption } from '../../components/common/MultiChart';
import useAuth from '../../hooks/useAuth';
import DashboardService from '../../services/DashboardService';
import FournitureService, { FournitureStats } from '../../services/Fournitureservice';
import RegionService from '../../services/regionService';
import DistrictService from '../../services/districtService';
import VehiculeService from '../../services/vehiculeService';
import { applyChartFilter, groupByMonth } from '../../utils/Dashboardutils';

const COLORS = {
  primary:'#3b82f6', success:'#22c55e', warning:'#f59e0b',
  info:'#06b6d4', danger:'#ef4444', purple:'#8b5cf6', secondary:'#64748b',
};

const DashboardGeneral: React.FC = () => {
  const { person } = useAuth();
  const navigate   = useNavigate();
  const pageRef    = useRef<HTMLDivElement | null>(null);

  const [rawAcq,          setRawAcq]          = useState<any[]>([]);
  const [rawDep,          setRawDep]           = useState<any[]>([]);
  const [rawInt,          setRawInt]           = useState<any[]>([]);
  const [vehicules,       setVehicules]        = useState<any[]>([]);
  const [alertes,         setAlertes]          = useState<any[]>([]);
  const [sitesTotal,      setSitesTotal]       = useState(0);
  const [regions,         setRegions]          = useState<RegionOption[]>([]);
  const [districts,       setDistricts]        = useState<DistrictOption[]>([]);
  const [fournitureStats, setFournitureStats]  = useState<FournitureStats | null>(null);
  const [loading,         setLoading]          = useState(true);

  // Filtres
  const [globalFilter,   setGlobalFilter]   = useState<ChartFilter>(DEFAULT_CHART_FILTER);
  const [activityFilter, setActivityFilter] = useState<ChartFilter>(DEFAULT_CHART_FILTER);
  const [, setStatusFilter] = useState<ChartFilter>(DEFAULT_CHART_FILTER);
  const [, setRadarFilter]  = useState<ChartFilter>(DEFAULT_CHART_FILTER);
  const [, setCatFilter]    = useState<ChartFilter>(DEFAULT_CHART_FILTER);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, regs, dists, vPage, al, fStats] = await Promise.all([
        DashboardService.getGlobalStats(),
        RegionService.getAllList(),
        DistrictService.getAllList(),
        VehiculeService.getAll(0, 200).catch(() => ({ content: [], totalElements: 0 } as any)),
        DashboardService.getAlertes(30),
        FournitureService.stats().catch(() => null),
      ]);
      setRawAcq(stats.acquisitions);
      setRawDep(stats.deployments);
      setRawInt(stats.interventions);
      setSitesTotal(stats.sitesTotal);
      setVehicules(vPage?.content || []);
      setAlertes(al);
      setFournitureStats(fStats);
      setRegions(regs.map((r: any) => ({ id: r.id, regionName: r.regionName })));
      setDistricts(dists.map((d: any) => ({ id: d.id, districtName: d.districtName, regionId: d.regionId })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const heure      = new Date().getHours();
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';

  // ── Données équipements ─────────────────────────────────────────────────────
  const kpiAcq = useMemo(() => applyChartFilter(rawAcq, globalFilter, 'dateAcquisition'), [rawAcq, globalFilter]);
  const kpiDep = useMemo(() => applyChartFilter(rawDep, globalFilter, 'dateDeployment'),  [rawDep, globalFilter]);
  const kpiInt = useMemo(() => applyChartFilter(rawInt, globalFilter, 'dateIntervention'), [rawInt, globalFilter]);

  const globalChartData = useMemo(() => [
    { name:'Acquisitions',  value: kpiAcq.length,    color: COLORS.primary   },
    { name:'Déploiements',  value: kpiDep.length,    color: COLORS.success   },
    { name:'Interventions', value: kpiInt.length,    color: COLORS.warning   },
    { name:'Engins',        value: vehicules.length, color: COLORS.info      },
    { name:'Sites',         value: sitesTotal,       color: COLORS.secondary },
  ], [kpiAcq, kpiDep, kpiInt, vehicules, sitesTotal]);

  const activityData = useMemo(() => {
    const acq  = applyChartFilter(rawAcq, activityFilter, 'dateAcquisition');
    const dep  = applyChartFilter(rawDep, activityFilter, 'dateDeployment');
    const int_ = applyChartFilter(rawInt, activityFilter, 'dateIntervention');
    const acqM = groupByMonth(acq,  'dateAcquisition');
    const depM = groupByMonth(dep,  'dateDeployment');
    const intM = groupByMonth(int_, 'dateIntervention');
    return Object.keys(acqM).map(mois => ({
      mois, acquisitions: acqM[mois], deploiements: depM[mois] || 0, interventions: intM[mois] || 0,
    }));
  }, [rawAcq, rawDep, rawInt, activityFilter]);

  const fleetStatusData = useMemo(() => [
    { name:'Disponibles', value: vehicules.filter((v:any) => v?.statut === 'DISPONIBLE').length, color: COLORS.success },
    { name:'En mission',  value: vehicules.filter((v:any) => v?.statut === 'EN_MISSION').length, color: COLORS.info    },
    { name:'En panne',    value: vehicules.filter((v:any) => v?.statut === 'EN_PANNE').length,   color: COLORS.danger  },
  ], [vehicules]);

  const radarData = useMemo(() => [
    { axe:'Total',       valeur: vehicules.length },
    { axe:'Disponibles', valeur: vehicules.filter((v:any) => v?.statut === 'DISPONIBLE').length },
    { axe:'Mission',     valeur: vehicules.filter((v:any) => v?.statut === 'EN_MISSION').length },
    { axe:'Panne',       valeur: vehicules.filter((v:any) => v?.statut === 'EN_PANNE').length   },
    { axe:'Alertes',     valeur: alertes.length },
  ], [vehicules, alertes]);

  // ── Données fournitures ─────────────────────────────────────────────────────
  const fournitureCatData = useMemo(() => fournitureStats ? [
    { name:'Informatique',   value: fournitureStats.informatique,   color: COLORS.primary  },
    { name:'Mobilier',       value: fournitureStats.mobilier,       color: COLORS.success  },
    { name:'Papeterie',      value: fournitureStats.papeterie,      color: COLORS.warning  },
    { name:'Bureautique',    value: fournitureStats.bureautique,    color: COLORS.info     },
    { name:'Électroménager', value: fournitureStats.electromenager, color: COLORS.danger   },
  ].filter(d => d.value > 0) : [], [fournitureStats]);

  // ── KPI globaux ─────────────────────────────────────────────────────────────
  const kpis = [
    { label:'Acquisitions',   value: kpiAcq.length,            icon:'bi-box-seam-fill',  color:'primary'   },
    { label:'Déploiements',   value: kpiDep.length,            icon:'bi-truck',          color:'success'   },
    { label:'Interventions',  value: kpiInt.length,            icon:'bi-tools',          color:'warning'   },
    { label:'Engins',         value: vehicules.length,         icon:'bi-car-front-fill', color:'info'      },
    { label:'Sites',          value: sitesTotal,               icon:'bi-hospital-fill',  color:'secondary' },
    { label:'Alertes',        value: alertes.length,           icon:'bi-bell-fill',
      color: alertes.length > 0 ? 'danger' : 'secondary' },
  ];

  const kpisFournitures = fournitureStats ? [
    { label:'Articles',    value: fournitureStats.total,             icon:'bi-box-seam-fill',    color:'secondary' },
    { label:'Disponibles', value: fournitureStats.disponibles,       icon:'bi-check-circle-fill', color:'success'  },
    { label:'Déployés',    value: fournitureStats.deployes,          icon:'bi-box-arrow-right',   color:'primary'  },
    { label:'En rupture',  value: fournitureStats.enRupture,         icon:'bi-exclamation-triangle-fill',
      color: fournitureStats.enRupture > 0 ? 'danger' : 'secondary' },
  ] : [];

  return (
    <MainLayout title="Dashboard général">
      <div ref={pageRef}>

        {/* ── Header ── */}
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1">{salutation}, {person?.firstName} 👋</h4>
            <p className="text-muted mb-0 small">
              {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>
          <div className="d-flex gap-2">
            <ChartExportButton targetRef={pageRef} filename="dashboard-general" />
            <button className="btn btn-sm btn-outline-warning" onClick={() => navigate('/dashboard-equipement')}>
              <i className="bi bi-box-seam-fill me-1" />Équipements
            </button>
          </div>
        </div>

        {/* ══ KPI ÉQUIPEMENTS ══ */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <div className="rounded-3 bg-warning bg-opacity-10 d-flex align-items-center justify-content-center"
            style={{ width:'28px', height:'28px' }}>
            <i className="bi bi-box-seam-fill text-warning small" />
          </div>
          <span className="fw-semibold small text-muted">Équipements & Logistique</span>
        </div>

        <div className="row g-3 mb-4">
          {loading
            ? <div className="col-12 text-center py-3"><div className="spinner-border" /></div>
            : kpis.map((s, i) => (
                <div key={i} className="col-6 col-md-2">
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
              ))
          }
        </div>

        {/* ══ KPI FOURNITURES ══ */}
        {kpisFournitures.length > 0 && (
          <>
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="rounded-3 bg-primary bg-opacity-10 d-flex align-items-center justify-content-center"
                style={{ width:'28px', height:'28px' }}>
                <i className="bi bi-box-seam-fill text-primary small" />
              </div>
              <span className="fw-semibold small text-muted">Fournitures & Mobilier</span>
            </div>
            <div className="row g-3 mb-4">
              {kpisFournitures.map((s, i) => (
                <div key={i} className="col-6 col-md-3">
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
          </>
        )}

        {/* ── Graphiques équipements ── */}
        <div className="row g-4">
          <div className="col-md-6">
            <MultiChart title="Vue globale" icon="bi-bar-chart-fill" iconColor={COLORS.primary}
              data={globalChartData} nameKey="name" valueKey="value"
              height={280} defaultType="bar"
              regions={regions} districts={districts}
              onFilterChange={setGlobalFilter} />
          </div>

          <div className="col-md-6">
            <MultiChart title="Statuts du parc" icon="bi-pie-chart-fill" iconColor={COLORS.info}
              data={fleetStatusData} nameKey="name" valueKey="value"
              height={280} defaultType="pie"
              isEmpty={vehicules.length === 0} emptyMsg="Aucun engin"
              onFilterChange={setStatusFilter} />
          </div>

          <div className="col-md-8">
            <MultiChart title="Activité combinée — 6 derniers mois" icon="bi-graph-up-arrow" iconColor={COLORS.success}
              data={activityData} nameKey="mois"
              valueKey={['acquisitions', 'deploiements', 'interventions']}
              colors={[COLORS.primary, COLORS.success, COLORS.warning]}
              height={280} defaultType="area"
              regions={regions} districts={districts}
              onFilterChange={setActivityFilter} />
          </div>

          <div className="col-md-4">
            <MultiChart title="Vue radar parc" icon="bi-radar" iconColor={COLORS.purple}
              data={radarData} nameKey="axe" valueKey="valeur"
              height={280} defaultType="radar"
              isEmpty={vehicules.length === 0} emptyMsg="Aucun engin"
              onFilterChange={setRadarFilter} />
          </div>

          {/* Graphique fournitures par catégorie */}
          {fournitureCatData.length > 0 && (
            <div className="col-md-6">
              <MultiChart title="Fournitures par catégorie" icon="bi-box-seam-fill" iconColor={COLORS.primary}
                data={fournitureCatData} nameKey="name" valueKey="value"
                height={260} defaultType="pie"
                onFilterChange={setCatFilter} />
            </div>
          )}

          {/* Vue combinée fournitures */}
          {fournitureStats && (
            <div className="col-md-6">
              <MultiChart
                title="Stock fournitures"
                icon="bi-bar-chart-fill" iconColor={COLORS.primary}
                data={[
                  { name:'Disponibles', value: fournitureStats.disponibles,       color: COLORS.success },
                  { name:'Déployés',    value: fournitureStats.deployes,          color: COLORS.primary },
                  { name:'En rupture',  value: fournitureStats.enRupture,         color: COLORS.danger  },
                  { name:'Dépl. actifs',value: fournitureStats.totalDeploiements, color: COLORS.info    },
                ]}
                nameKey="name" valueKey="value"
                height={260} defaultType="bar"
                onFilterChange={setCatFilter}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardGeneral;