import { filterByPeriod } from '../components/common/PeriodFilter';
import { ChartFilter } from '../components/common/MultiChart';

/**
 * Applique un ChartFilter (région, district, période) sur un tableau de données brutes.
 */
export function applyChartFilter(
  items: any[],
  filter: ChartFilter,
  dateField: string,
  regionField    = 'regionId',
  districtField  = 'districtId',
): any[] {
  let result = items;
  if (filter.regionId)   result = result.filter(d => d[regionField]   === filter.regionId);
  if (filter.districtId) result = result.filter(d => d[districtField] === filter.districtId);
  if (filter.period !== 'all') result = filterByPeriod(result, filter.period, dateField as any);
  return result;
}

/** Groupe par champ et compte les occurrences. */
export function groupByField(items: any[], field: string, label?: (k: string) => string): Array<{ name: string; value: number }> {
  const out: Record<string, number> = {};
  items.forEach(it => {
    const k = it?.[field] || 'AUTRE';
    out[k] = (out[k] || 0) + 1;
  });
  return Object.entries(out).map(([k, v]) => ({ name: label ? label(k) : k.replace(/_/g, ' '), value: v }));
}

/** Initialise 6 mois glissants et agrège les items par mois. */
export function groupByMonth(items: any[], dateField: string): Record<string, number> {
  const out: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out[d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })] = 0;
  }
  items.forEach((it: any) => {
    if (!it?.[dateField]) return;
    const dt = new Date(it[dateField]);
    if (isNaN(dt.getTime())) return;
    const key = dt.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    if (key in out) out[key]++;
  });
  return out;
}