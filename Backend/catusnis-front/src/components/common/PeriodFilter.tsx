import React from 'react';

export type PeriodKey = 'today' | 'week' | 'month' | 'bimestre' | 'trimester' | 'semester' | 'year' | 'all';

export interface PeriodOption {
  key:    PeriodKey;
  label:  string;
  days:   number;  // -1 = tout
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { key: 'today',     label: "Aujourd'hui", days:   1 },
  { key: 'week',      label: 'Semaine',     days:   7 },
  { key: 'month',     label: 'Mois',        days:  30 },
  { key: 'bimestre',  label: 'Bimestre',    days:  60 },
  { key: 'trimester', label: 'Trimestre',   days:  90 },
  { key: 'semester',  label: 'Semestre',    days: 180 },
  { key: 'year',      label: 'Année',       days: 365 },
  { key: 'all',       label: 'Tout',        days:  -1 },
];

interface Props {
  value:    PeriodKey;
  onChange: (period: PeriodKey) => void;
}

const PeriodFilter: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="d-flex gap-1 align-items-center bg-white border rounded-3 px-2 py-1 shadow-sm" style={{ flexWrap: 'wrap' }}>
      <i className="bi bi-funnel-fill text-secondary me-1" style={{ fontSize: '11px' }} />
      <span className="text-muted small me-1" style={{ fontSize: '11px' }}>Période :</span>
      {PERIOD_OPTIONS.map(opt => (
        <button key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`btn btn-sm ${value === opt.key ? 'btn-dark' : 'btn-light text-muted'}`}
          style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
};

// ── Helper pour filtrer une liste par date ────────────────────────────────────
export function filterByPeriod<T>(
  items: T[],
  period: PeriodKey,
  dateField: keyof T,
): T[] {
  const opt = PERIOD_OPTIONS.find(p => p.key === period);
  if (!opt || opt.days < 0) return items;

  const now = Date.now();
  const cutoff = now - opt.days * 86400000;
  return items.filter(item => {
    const v = item[dateField] as any;
    if (!v) return false;
    const t = new Date(v).getTime();
    return !isNaN(t) && t >= cutoff;
  });
}

export default PeriodFilter;