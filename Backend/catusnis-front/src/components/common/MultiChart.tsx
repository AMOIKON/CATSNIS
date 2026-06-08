import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import SafeChart from './SafeChart';
import { PeriodKey } from './PeriodFilter';

// ── Types ─────────────────────────────────────────────────────────────────────
export type ChartType = 'bar' | 'pie' | 'line' | 'area' | 'radar' | 'composed';

export interface ChartFilter {
  chartType:  ChartType;
  regionId:   number | null;
  districtId: number | null;
  period:     PeriodKey;
}

export const DEFAULT_CHART_FILTER: ChartFilter = {
  chartType: 'bar', regionId: null, districtId: null, period: 'all',
};

export interface RegionOption   { id: number; regionName:   string; }
export interface DistrictOption { id: number; districtName: string; regionId?: number; }

export interface MultiChartProps {
  title:       string;
  icon?:       string;
  iconColor?:  string;
  data:        any[];
  nameKey:     string;
  valueKey:    string | string[];
  colors?:     string[];
  height?:     number;
  isEmpty?:    boolean;
  emptyMsg?:   string;
  regions?:    RegionOption[];
  districts?:  DistrictOption[];
  onFilterChange?: (f: ChartFilter) => void;
  defaultType?: ChartType;
}

// ── Constantes ────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#3b82f6','#22c55e','#f59e0b','#06b6d4','#8b5cf6','#ef4444','#ec4899','#14b8a6'];

const CHART_BTNS: { key: ChartType; icon: string; title: string }[] = [
  { key: 'bar',      icon: 'bi-bar-chart-fill', title: 'Barres'    },
  { key: 'pie',      icon: 'bi-pie-chart-fill',  title: 'Camembert' },
  { key: 'line',     icon: 'bi-graph-up',        title: 'Lignes'    },
  { key: 'area',     icon: 'bi-graph-up-arrow',  title: 'Aire'      },
  { key: 'radar',    icon: 'bi-radar',           title: 'Radar'     },
  { key: 'composed', icon: 'bi-bar-chart-steps', title: 'Combiné'   },
];

const PERIODS: { v: PeriodKey; l: string }[] = [
  { v: 'all',       l: 'Tout'        },
  { v: 'today',     l: "Aujourd'hui" },
  { v: 'week',      l: 'Semaine'     },
  { v: 'month',     l: 'Mois'        },
  { v: 'bimestre',  l: 'Bimestre'    },
  { v: 'trimester', l: 'Trimestre'   },
  { v: 'semester',  l: 'Semestre'    },
  { v: 'year',      l: 'Année'       },
];

// ── Composant ─────────────────────────────────────────────────────────────────
const MultiChart: React.FC<MultiChartProps> = ({
  title, icon, iconColor = '#3b82f6',
  data, nameKey, valueKey,
  colors, height = 300,
  isEmpty = false, emptyMsg = 'Aucune donnée',
  regions = [], districts = [],
  onFilterChange, defaultType = 'bar',
}) => {
  const [chartType,  setChartType]  = useState<ChartType>(defaultType);
  const [regionId,   setRegionId]   = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [period,     setPeriod]     = useState<PeriodKey>('all');

  const filtDistricts = useMemo(
    () => regionId ? districts.filter(d => d.regionId === regionId) : districts,
    [districts, regionId],
  );

  const notify = (ct: ChartType, r: number|null, d: number|null, p: PeriodKey) =>
    onFilterChange?.({ chartType: ct, regionId: r, districtId: d, period: p });

  const keys = Array.isArray(valueKey) ? valueKey : [valueKey];
  const clrs = colors?.length ? colors : PIE_COLORS;

  // ── Rendu du graphique selon le type ──────────────────────────────────────
  const renderChart = (): React.ReactElement => {
    switch (chartType) {

      case 'pie': return (
        <PieChart>
          <Pie data={data} dataKey={keys[0]} nameKey={nameKey} cx="50%" cy="50%" outerRadius={85} label>
            {data.map((_, i) => <Cell key={i} fill={clrs[i % clrs.length]} />)}
          </Pie>
          <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      );

      case 'line': return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
          {keys.map((k, i) => (
            <Line key={k} type="monotone" dataKey={k}
              stroke={clrs[i % clrs.length]} strokeWidth={2} dot={{ r: 4 }} />
          ))}
        </LineChart>
      );

      case 'area': return (
        <AreaChart data={data}>
          <defs>{keys.map((k, i) => (
            <linearGradient key={k} id={`mcag-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={clrs[i % clrs.length]} stopOpacity={0.5} />
              <stop offset="100%" stopColor={clrs[i % clrs.length]} stopOpacity={0}   />
            </linearGradient>
          ))}</defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
          {keys.map((k, i) => (
            <Area key={k} type="monotone" dataKey={k}
              stroke={clrs[i % clrs.length]} fill={`url(#mcag-${k})`} strokeWidth={2} />
          ))}
        </AreaChart>
      );

      case 'radar': return (
        <RadarChart data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey={nameKey} tick={{ fontSize: 10 }} />
          <PolarRadiusAxis tick={{ fontSize: 9 }} />
          {keys.map((k, i) => (
            <Radar key={k} dataKey={k}
              stroke={clrs[i % clrs.length]} fill={clrs[i % clrs.length]} fillOpacity={0.4} />
          ))}
          <Tooltip />{keys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        </RadarChart>
      );

      case 'composed': return (
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
          {keys.map((k, i) =>
            i === keys.length - 1 && keys.length > 1
              ? <Line key={k} type="monotone" dataKey={k} stroke={clrs[i % clrs.length]} strokeWidth={2} />
              : <Bar  key={k} dataKey={k} fill={clrs[i % clrs.length]} barSize={18} radius={[4,4,0,0]} />
          )}
        </ComposedChart>
      );

      default: return ( // bar
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />{keys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {keys.map((k, i) => (
            <Bar key={k} dataKey={k} fill={clrs[i % clrs.length]} radius={[6,6,0,0]}>
              {keys.length === 1 && data.map((e: any, j: number) => (
                <Cell key={j} fill={e.color || clrs[j % clrs.length]} />
              ))}
            </Bar>
          ))}
        </BarChart>
      );
    }
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="card border-0 shadow-sm rounded-4 h-100">
      <div className="card-header bg-transparent border-0 pt-3 pb-2">

        {/* Titre + sélecteur de type */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <h6 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: iconColor }}>
            {icon && <i className={`bi ${icon}`} />}
            {title}
          </h6>
          <div className="d-flex gap-1 flex-wrap">
            {CHART_BTNS.map(btn => (
              <button
                key={btn.key}
                title={btn.title}
                onClick={() => { setChartType(btn.key); notify(btn.key, regionId, districtId, period); }}
                style={{
                  width: '26px', height: '26px', flexShrink: 0,
                  border: chartType === btn.key ? `2px solid ${iconColor}` : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: chartType === btn.key ? `${iconColor}18` : '#f8fafc',
                  color: chartType === btn.key ? iconColor : '#94a3b8',
                  cursor: 'pointer', fontSize: '11px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <i className={`bi ${btn.icon}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div className="d-flex gap-2 flex-wrap">
          {regions.length > 0 && (
            <select
              className="form-select form-select-sm"
              style={{ fontSize: '11px', width: 'auto', maxWidth: '150px' }}
              value={regionId ?? ''}
              onChange={e => {
                const v = e.target.value ? Number(e.target.value) : null;
                setRegionId(v); setDistrictId(null);
                notify(chartType, v, null, period);
              }}
            >
              <option value="">🗺 Toutes régions</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.regionName}</option>)}
            </select>
          )}
          {districts.length > 0 && (
            <select
              className="form-select form-select-sm"
              style={{ fontSize: '11px', width: 'auto', maxWidth: '150px' }}
              value={districtId ?? ''}
              onChange={e => {
                const v = e.target.value ? Number(e.target.value) : null;
                setDistrictId(v); notify(chartType, regionId, v, period);
              }}
            >
              <option value="">🏘 Tous districts</option>
              {filtDistricts.map(d => <option key={d.id} value={d.id}>{d.districtName}</option>)}
            </select>
          )}
          <select
            className="form-select form-select-sm"
            style={{ fontSize: '11px', width: 'auto', maxWidth: '150px' }}
            value={period}
            onChange={e => {
              const v = e.target.value as PeriodKey;
              setPeriod(v); notify(chartType, regionId, districtId, v);
            }}
          >
            {PERIODS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
      </div>

      <SafeChart height={height} isEmpty={isEmpty || data.length === 0} emptyMsg={emptyMsg}>
        {/* minWidth={0} évite le warning width(-1) quand le parent est en flexbox */}
        <ResponsiveContainer width="100%" height={height} minWidth={0}>
          {renderChart()}
        </ResponsiveContainer>
      </SafeChart>
    </div>
  );
};

export default MultiChart;