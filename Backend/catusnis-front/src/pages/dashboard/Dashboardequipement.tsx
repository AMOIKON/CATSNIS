import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import MainLayout from '../../components/common/MainLayout';
import ChartExportButton from '../../components/common/ChartExportButton';
import MultiChart, { ChartFilter, DEFAULT_CHART_FILTER, RegionOption, DistrictOption } from '../../components/common/MultiChart';
import DashboardService from '../../services/DashboardService';
import RegionService from '../../services/regionService';
import DistrictService from '../../services/districtService';
import { applyChartFilter, groupByMonth, groupByField } from '../../utils/Dashboardutils';

const COLORS = {
  primary:'#3b82f6', success:'#22c55e', warning:'#f59e0b',
  info:'#06b6d4', danger:'#ef4444', purple:'#8b5cf6',
};
const PIE_COLORS = ['#3b82f6','#22c55e','#f59e0b','#06b6d4','#8b5cf6','#ef4444','#ec4899','#14b8a6'];

const DashboardEquipement: React.FC = () => {
  const pageRef = useRef<HTMLDivElement | null>(null);

  // ── Données brutes ──────────────────────────────────────────────────────────
  const [rawAcq,     setRawAcq]     = useState<any[]>([]);
  const [rawDep,     setRawDep]     = useState<any[]>([]);
  const [rawInt,     setRawInt]     = useState<any[]>([]);
  const [sitesTotal, setSitesTotal] = useState(0);
  const [regions,    setRegions]    = useState<RegionOption[]>([]);
  const [districts,  setDistricts]  = useState<DistrictOption[]>([]);
  const [loading,    setLoading]    = useState(true);

  // ── Filtres par graphique ───────────────────────────────────────────────────
  const [typeFilter,     setTypeFilter]     = useState<ChartFilter>(DEFAULT_CHART_FILTER);
  const [statusFilter,   setStatusFilter]   = useState<ChartFilter>(DEFAULT_CHART_FILTER);
  const [deplFilter,     setDeplFilter]     = useState<ChartFilter>(DEFAULT_CHART_FILTER);
  const [activityFilter, setActivityFilter] = useState<ChartFilter>(DEFAULT_CHART_FILTER);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, regs, dists] = await Promise.all([
        DashboardService.getGlobalStats(),
        RegionService.getAllList(),
        DistrictService.getAllList(),
      ]);
      setRawAcq(stats.acquisitions);
      setRawDep(stats.deployments);
      setRawInt(stats.interventions);
      setSitesTotal(stats.sitesTotal);
      setRegions(regs.map((r: any) => ({ id: r.id, regionName: r.regionName })));
      setDistricts(dists.map((d: any) => ({ id: d.id, districtName: d.districtName, regionId: d.regionId })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Données calculées ───────────────────────────────────────────────────────

  const typeData = useMemo(() => {
    const filtered = applyChartFilter(rawAcq, typeFilter, 'dateAcquisition');
    const grouped: Record<string, number> = {};
    filtered.forEach((a: any) => {
      const t = a.typeName || 'Autre';
      grouped[t] = (grouped[t] || 0) + (a.quantite ?? 1);
    });
    return Object.entries(grouped).slice(0, 8).map(([name, value]) => ({ name, value }));
  }, [rawAcq, typeFilter]);

  const intStatusData = useMemo(() => {
    const filtered = applyChartFilter(rawInt, statusFilter, 'dateIntervention');
    return groupByField(filtered, 'typeInter');
  }, [rawInt, statusFilter]);

  const deplData = useMemo(() => {
    const filtered = applyChartFilter(rawDep, deplFilter, 'dateDeployment');
    const monthly  = groupByMonth(filtered, 'dateDeployment');
    return Object.entries(monthly).map(([mois, deploiements]) => ({ mois, deploiements }));
  }, [rawDep, deplFilter]);

  const activityData = useMemo(() => {
    const acq = applyChartFilter(rawAcq, activityFilter, 'dateAcquisition');
    const dep = applyChartFilter(rawDep, activityFilter, 'dateDeployment');
    const int = applyChartFilter(rawInt, activityFilter, 'dateIntervention');
    const acqM = groupByMonth(acq, 'dateAcquisition');
    const depM = groupByMonth(dep, 'dateDeployment');
    const intM = groupByMonth(int, 'dateIntervention');
    return Object.keys(acqM).map(mois => ({
      mois,
      acquisitions:  acqM[mois],
      deploiements:  depM[mois] || 0,
      interventions: intM[mois] || 0,
    }));
  }, [rawAcq, rawDep, rawInt, activityFilter]);

  const kpis = [
    { label:'Acquisitions',   value: rawAcq.length, icon:'bi-box-seam-fill', color:'primary' },
    { label:'Déploiements',   value: rawDep.length, icon:'bi-truck',         color:'success' },
    { label:'Interventions',  value: rawInt.length, icon:'bi-tools',         color:'warning' },
    { label:'Sites couverts', value: sitesTotal,    icon:'bi-hospital-fill', color:'info'    },
  ];

  return (
    <MainLayout title="Dashboard équipements">
      <div ref={pageRef}>

        {/* ── Header ── */}
        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1">
              Équipements <i className="bi bi-box-seam-fill text-warning ms-2" />
            </h4>
            <p className="text-muted mb-0 small">Suivi des acquisitions, déploiements et interventions</p>
          </div>
          <ChartExportButton targetRef={pageRef} filename="dashboard-equipement" />
        </div>

        {/* ── KPI ── */}
        <div className="row g-3 mb-4">
          {loading
            ? <div className="col-12 text-center py-3"><div className="spinner-border" /></div>
            : kpis.map((s, i) => (
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
              ))
          }
        </div>

        {/* ── Graphiques ── */}
        <div className="row g-4">
          <div className="col-md-6">
            <MultiChart
              title="Acquisitions par type"
              icon="bi-pie-chart-fill" iconColor={COLORS.warning}
              data={typeData} nameKey="name" valueKey="value"
              colors={PIE_COLORS} height={320} defaultType="pie"
              isEmpty={typeData.length === 0}
              regions={regions} districts={districts}
              onFilterChange={setTypeFilter}
            />
          </div>

          <div className="col-md-6">
            <MultiChart
              title="Interventions par statut"
              icon="bi-bar-chart-fill" iconColor={COLORS.warning}
              data={intStatusData} nameKey="name" valueKey="value"
              height={320} defaultType="bar"
              isEmpty={intStatusData.length === 0}
              regions={regions} districts={districts}
              onFilterChange={setStatusFilter}
            />
          </div>

          <div className="col-md-6">
            <MultiChart
              title="Évolution déploiements"
              icon="bi-graph-up" iconColor={COLORS.success}
              data={deplData} nameKey="mois" valueKey="deploiements"
              colors={[COLORS.success]} height={300} defaultType="line"
              regions={regions} districts={districts}
              onFilterChange={setDeplFilter}
            />
          </div>

          <div className="col-md-6">
            <MultiChart
              title="Activité combinée mensuelle"
              icon="bi-bezier" iconColor={COLORS.primary}
              data={activityData} nameKey="mois"
              valueKey={['acquisitions', 'deploiements', 'interventions']}
              colors={[COLORS.primary, COLORS.success, COLORS.warning]}
              height={300} defaultType="composed"
              regions={regions} districts={districts}
              onFilterChange={setActivityFilter}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardEquipement;