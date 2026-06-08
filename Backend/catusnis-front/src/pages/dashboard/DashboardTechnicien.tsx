import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/common/MainLayout';
import ChartExportButton from '../../components/common/ChartExportButton';
import MultiChart, { ChartFilter, DEFAULT_CHART_FILTER } from '../../components/common/MultiChart';
import useAuth from '../../hooks/useAuth';
import DashboardService from '../../services/DashboardService';
import { applyChartFilter, groupByMonth, groupByField } from '../../utils/Dashboardutils';

const COLORS = {
  primary: '#3b82f6', success: '#22c55e', warning: '#f59e0b',
  info:    '#06b6d4', danger:  '#ef4444', purple:  '#8b5cf6',
};

// ✅ Couleurs par typeInter (champ réel backend)
const TYPE_COLORS: Record<string, string> = {
  EN_LIGNE: '#06b6d4',
  SUR_SITE: '#f59e0b',
  AUTRE:    '#8b5cf6',
};

const DashboardTechnicien: React.FC = () => {
  const { person } = useAuth();
  const navigate   = useNavigate();
  const pageRef    = useRef<HTMLDivElement | null>(null);

  const [rawInt,  setRawInt]  = useState<any[]>([]);
  const [sites,   setSites]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter,     setTypeFilter]     = useState<ChartFilter>(DEFAULT_CHART_FILTER);
  const [actionFilter,   setActionFilter]   = useState<ChartFilter>(DEFAULT_CHART_FILTER);
  const [activityFilter, setActivityFilter] = useState<ChartFilter>(DEFAULT_CHART_FILTER);
  const [, setRadarFilter] = useState<ChartFilter>(DEFAULT_CHART_FILTER);

  const heure      = new Date().getHours();
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon après-midi' : 'Bonsoir';

  const load = useCallback(async () => {
    if (!person?.id) return;
    setLoading(true);
    try {
      const data = await DashboardService.getTechnicienStats(person.id);
      setRawInt(data.interventions);
      setSites(data.sites);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [person?.id]);

  useEffect(() => { load(); }, [load]);

  // ✅ KPIs basés sur typeInter (EN_LIGNE / SUR_SITE) — pas sur statut inexistant
  const enLigne  = useMemo(() => rawInt.filter((i: any) =>
    (i?.typeInter || i?.typeIntervention) === 'EN_LIGNE'), [rawInt]);
  const surSite  = useMemo(() => rawInt.filter((i: any) =>
    (i?.typeInter || i?.typeIntervention) === 'SUR_SITE'), [rawInt]);
  const recent   = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return rawInt.filter((i: any) => {
      const d = i?.dateIntervention || i?.dateInter;
      return d && new Date(d).getTime() >= cutoff;
    });
  }, [rawInt]);

  // ✅ Graphique par type (typeInter)
  const typeData = useMemo(() => {
    const filtered = applyChartFilter(rawInt, typeFilter, 'dateIntervention');
    const grouped: Record<string, number> = {};
    filtered.forEach((it: any) => {
      const t = it?.typeInter || it?.typeIntervention || 'AUTRE';
      grouped[t] = (grouped[t] || 0) + 1;
    });
    return Object.entries(grouped).map(([k, v]) => ({
      name: k.replace('_', ' '), value: v,
      color: TYPE_COLORS[k] || COLORS.primary,
    }));
  }, [rawInt, typeFilter]);

  // ✅ Graphique par action (actionInter)
  const actionData = useMemo(() => {
    const filtered = applyChartFilter(rawInt, actionFilter, 'dateIntervention');
    return groupByField(filtered, 'actionInter');
  }, [rawInt, actionFilter]);

  // ✅ Évolution mensuelle
  const activityData = useMemo(() => {
    const filtered = applyChartFilter(rawInt, activityFilter, 'dateIntervention');
    const monthly  = groupByMonth(filtered, 'dateIntervention');
    return Object.entries(monthly).map(([mois, total]) => ({ mois, total }));
  }, [rawInt, activityFilter]);

  // ✅ Radar basé sur données réelles
  const radarData = useMemo(() => [
    { axe: 'Total',    valeur: rawInt.length  },
    { axe: 'EN_LIGNE', valeur: enLigne.length },
    { axe: 'SUR_SITE', valeur: surSite.length },
    { axe: '30 jours', valeur: recent.length  },
    { axe: 'Sites',    valeur: sites.length   },
  ], [rawInt, enLigne, surSite, recent, sites]);

  const kpis = [
    { label: 'Total interventions', value: rawInt.length,  icon: 'bi-clipboard2-pulse-fill', color: 'primary' },
    { label: 'En ligne',            value: enLigne.length, icon: 'bi-wifi',                  color: 'info'    },
    { label: 'Sur site',            value: surSite.length, icon: 'bi-tools',                 color: 'warning' },
    { label: 'Sites assignés',      value: sites.length,   icon: 'bi-hospital-fill',         color: 'success' },
  ];

  return (
    <MainLayout title="Mon espace technicien">
      <div ref={pageRef}>

        {/* ── En-tête ──────────────────────────────────────────────────── */}
        <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1">{salutation}, {person?.firstName} 👋</h4>
            <p className="text-muted mb-0 small">
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <div className="d-flex gap-2">
            <ChartExportButton targetRef={pageRef} filename="dashboard-technicien" />
            <button className="btn btn-warning btn-sm d-flex align-items-center gap-2"
              onClick={() => navigate('/interventions')}>
              <i className="bi bi-tools" />Mes interventions
            </button>
          </div>
        </div>

        {/* ── KPIs ─────────────────────────────────────────────────────── */}
        <div className="row g-3 mb-4">
          {kpis.map((s, i) => (
            <div key={i} className="col-6 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-3">
                  <div className={`rounded-3 bg-${s.color} bg-opacity-10 d-inline-flex
                    align-items-center justify-content-center mb-2`}
                    style={{ width: '40px', height: '40px' }}>
                    <i className={`bi ${s.icon} text-${s.color} fs-5`} />
                  </div>
                  <div className={`fw-bold fs-3 text-${s.color}`}>
                    {loading ? <span className="spinner-border spinner-border-sm" /> : s.value}
                  </div>
                  <div className="text-muted small">{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Graphiques ligne 1 ────────────────────────────────────────── */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <MultiChart
              title="Par type d'intervention" icon="bi-pie-chart-fill" iconColor={COLORS.info}
              data={typeData} nameKey="name" valueKey="value"
              height={280} defaultType="pie"
              isEmpty={typeData.length === 0} emptyMsg="Aucune intervention"
              onFilterChange={setTypeFilter} />
          </div>
          <div className="col-md-4">
            <MultiChart
              title="Par action" icon="bi-bar-chart-fill" iconColor={COLORS.warning}
              data={actionData} nameKey="name" valueKey="value"
              colors={[COLORS.warning]} height={280} defaultType="bar"
              isEmpty={actionData.length === 0} emptyMsg="Aucune donnée"
              onFilterChange={setActionFilter} />
          </div>
          <div className="col-md-4">
            <MultiChart
              title="Vue radar" icon="bi-radar" iconColor={COLORS.purple}
              data={radarData} nameKey="axe" valueKey="valeur"
              height={280} defaultType="radar"
              onFilterChange={setRadarFilter} />
          </div>
        </div>

        {/* ── Évolution 6 mois ──────────────────────────────────────────── */}
        <div className="mb-4">
          <MultiChart
            title="Évolution interventions — 6 mois" icon="bi-graph-up-arrow" iconColor={COLORS.warning}
            data={activityData} nameKey="mois" valueKey="total"
            colors={[COLORS.warning]} height={260} defaultType="area"
            onFilterChange={setActivityFilter} />
        </div>

        {/* ── Listes ───────────────────────────────────────────────────── */}
        <div className="row g-4">

          {/* Interventions récentes */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-transparent border-0 pt-3 pb-0
                d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-clipboard2-pulse-fill text-primary me-2" />
                  Interventions récentes
                </h6>
                <button className="btn btn-sm btn-link text-primary p-0"
                  onClick={() => navigate('/interventions')}>Tout voir</button>
              </div>
              <div className="card-body pt-2">
                {rawInt.length === 0
                  ? <p className="text-muted small text-center py-4">
                      <i className="bi bi-inbox fs-3 d-block mb-2 opacity-50" />
                      Aucune intervention
                    </p>
                  : rawInt.slice(0, 5).map((it: any, i: number) => {
                      const type  = it?.typeInter || it?.typeIntervention || 'AUTRE';
                      const color = type === 'EN_LIGNE' ? 'info' : type === 'SUR_SITE' ? 'warning' : 'secondary';
                      const date  = it?.dateIntervention || it?.dateInter;
                      return (
                        <div key={i} className={`d-flex align-items-center gap-3 py-2 ${i < 4 ? 'border-bottom' : ''}`}>
                          <div className={`rounded-3 bg-${color} bg-opacity-10 d-flex
                            align-items-center justify-content-center flex-shrink-0`}
                            style={{ width: '38px', height: '38px' }}>
                            <i className={`bi ${type === 'EN_LIGNE' ? 'bi-wifi' : 'bi-tools'} text-${color} small`} />
                          </div>
                          <div className="flex-grow-1 overflow-hidden">
                            <p className="mb-0 small fw-semibold text-truncate">
                              {it.codeInter || it.code || `INT-${it.id}`}
                            </p>
                            <p className="mb-0 text-muted text-truncate" style={{ fontSize: '11px' }}>
                              {it.healthSiteName || it.healthName || it.siteName || '—'}
                            </p>
                          </div>
                          <div className="text-end flex-shrink-0">
                            <span className={`badge bg-${color} bg-opacity-10 text-${color} d-block mb-1`}
                              style={{ fontSize: '10px' }}>
                              {type.replace('_', ' ')}
                            </span>
                            {date && (
                              <small className="text-muted" style={{ fontSize: '10px' }}>
                                {new Date(date).toLocaleDateString('fr-FR')}
                              </small>
                            )}
                          </div>
                        </div>
                      );
                    })
                }
              </div>
            </div>
          </div>

          {/* Sites assignés */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-transparent border-0 pt-3 pb-0">
                <h6 className="fw-bold mb-0">
                  <i className="bi bi-hospital-fill text-success me-2" />
                  Sites assignés ({sites.length})
                </h6>
              </div>
              <div className="card-body pt-2">
                {sites.length === 0
                  ? <p className="text-muted small text-center py-4">
                      <i className="bi bi-hospital fs-3 d-block mb-2 opacity-50" />
                      Aucun site assigné
                    </p>
                  : sites.map((site: any, i: number) => (
                      <div key={i} className={`d-flex align-items-center gap-3 py-2 ${i < sites.length - 1 ? 'border-bottom' : ''}`}>
                        <div className="rounded-3 bg-success bg-opacity-10 d-flex
                          align-items-center justify-content-center flex-shrink-0"
                          style={{ width: '38px', height: '38px' }}>
                          <i className="bi bi-hospital-fill text-success small" />
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                          {/* ✅ FIX — champ réel : healthName (TechnicianSiteResponse) */}
                          <p className="mb-0 small fw-semibold text-truncate">
                            {site.healthName || site.healthSiteName || site.name || '—'}
                          </p>
                          <p className="mb-0 text-muted text-truncate" style={{ fontSize: '11px' }}>
                            {site.districtName
                              ? `${site.districtName}${site.regionName ? ' — ' + site.regionName : ''}`
                              : site.regionName || '—'}
                          </p>
                        </div>
                        <span className="badge bg-success bg-opacity-10 text-success">Actif</span>
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

export default DashboardTechnicien;