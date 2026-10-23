import type { Incident, IncidentDate, IncidentEvent, Provider, Source } from '../content/schema';

export type Mode = 'incident' | 'reported';
export type Order = 'asc' | 'desc';
export const CONTEXT_LABELS = { 'external-deployment': 'External deployment', 'internal-deployment': 'Internal deployment', training: 'Training', evaluation: 'Evaluation', mixed: 'Mixed contexts', unknown: 'Unknown context' } as const;
export type ViewState = { mode: Mode; order: Order; providerIds: string[] };
export type IncidentGroup = { id: 'dated' | 'unknown'; label: string | null; incidents: Incident[] };
export type EventGroup = { id: 'dated' | 'unknown'; label: string | null; events: IncidentEvent[] };
export type ReportEntry = { id: string; incident: Incident; source: Source };
export type ReportGroup = { id: string; label: string; date: string | null; entries: ReportEntry[] };
export type ReportMonthGroup = { id: string; month: string | null; label: string; sourceCount: number };

export function parseView(search: URLSearchParams, providers: Provider[]): { state: ViewState; error: string | null } {
  const initial: ViewState = { mode: 'incident', order: 'desc', providerIds: [] };
  for (const key of ['mode', 'order', 'providers']) {
    if (search.getAll(key).length > 1) return { state: initial, error: `Unrecognised filter: repeated ${key} parameter.` };
  }
  const mode = search.get('mode') ?? 'incident';
  if (mode !== 'incident' && mode !== 'reported') return { state: initial, error: 'Unrecognised filter: choose incident or reporting date.' };
  const order = search.get('order') ?? 'desc';
  if (order !== 'asc' && order !== 'desc') return { state: { ...initial, mode }, error: 'Unrecognised filter: choose ascending or descending order.' };
  const raw = search.get('providers');
  const ids = raw === null ? [] : raw.split(',');
  const allowed = new Set(providers.map((provider) => provider.id));
  if (ids.some((id) => !allowed.has(id))) return { state: { mode, order, providerIds: [] }, error: 'Unrecognised filter: one or more providers or evaluators are invalid.' };
  if (search.has('q') || search.has('context')) {
    return { state: initial, error: 'Search is not available in this timeline preview.' };
  }
  return { state: { mode, order, providerIds: [...new Set(ids)].sort() }, error: null };
}

export function serializeView(state: ViewState): URLSearchParams {
  const search = new URLSearchParams();
  if (state.mode !== 'incident') search.set('mode', state.mode);
  if (state.order !== 'desc') search.set('order', state.order);
  if (state.providerIds.length) search.set('providers', [...new Set(state.providerIds)].sort().join(','));
  return search;
}

export function toggleProvider(selected: string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id].sort();
}

export function filterIncidents(incidents: Incident[], providerIds: string[]): Incident[] {
  const selected = new Set(providerIds);
  return incidents.filter((incident) => !selected.size || [...incident.providerIds, ...incident.evaluatorIds].some((id) => selected.has(id)));
}

const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
const dateCompare = (a: string, b: string, order: Order) => compare(a, b) * (order === 'asc' ? 1 : -1);
/** Ordering anchor only; displayed dates retain their original precision. */
export function chronologyDate(date: IncidentDate): string | null {
  switch (date.kind) {
    case 'exact': return date.date;
    case 'range': return date.start;
    case 'month': return `${date.month}-01`;
    case 'approximate': return date.sortDate ?? null;
    case 'unknown': return null;
  }
}

export function groupIncidents(incidents: Incident[], order: Order = 'desc'): IncidentGroup[] {
  const byReport = (a: Incident, b: Incident) => dateCompare(a.reportedDate, b.reportedDate, order) || compare(a.id, b.id);
  const groups: IncidentGroup[] = [
    { id: 'dated', label: null, incidents: [] },
    { id: 'unknown', label: 'Incident date unknown', incidents: [] }
  ];
  for (const incident of incidents) groups[chronologyDate(incident.incidentDate) === null ? 1 : 0].incidents.push(incident);
  groups[0].incidents.sort((a, b) => dateCompare(chronologyDate(a.incidentDate)!, chronologyDate(b.incidentDate)!, order) || byReport(a, b));
  groups[1].incidents.sort(byReport);
  return groups.filter((group) => group.incidents.length);
}

/** Event chronology is independent of the curated incident and first-report dates. */
export function groupEvents(events: IncidentEvent[]): EventGroup[] {
  const groups: EventGroup[] = [
    { id: 'dated', label: null, events: [] },
    { id: 'unknown', label: 'Event date unknown', events: [] }
  ];
  for (const event of events) groups[chronologyDate(event.date) === null ? 1 : 0].events.push(event);
  // Stable sort preserves the authored sequence for events with the same ordering anchor.
  groups[0].events.sort((a, b) => compare(chronologyDate(a.date)!, chronologyDate(b.date)!));
  return groups.filter((group) => group.events.length);
}

/** Expand sources after incident filtering, so a provider union never duplicates an incident's reports. */
export function groupReports(incidents: Incident[], order: Order = 'desc'): ReportGroup[] {
  const dated = new Map<string, ReportEntry[]>();
  const undated: ReportEntry[] = [];
  for (const incident of incidents) {
    for (const source of incident.sources) {
      // Strict IDs contain no double hyphens, making this tuple encoding unambiguous.
      const entry: ReportEntry = { id: `report--${incident.id}--${source.id}`, incident, source };
      if (!source.publishedDate) undated.push(entry);
      else {
        const entries = dated.get(source.publishedDate) ?? [];
        entries.push(entry);
        dated.set(source.publishedDate, entries);
      }
    }
  }
  const byIdentity = (a: ReportEntry, b: ReportEntry) => compare(a.incident.id, b.incident.id) || compare(a.source.id, b.source.id);
  const groups: ReportGroup[] = [...dated.keys()].sort((a, b) => dateCompare(a, b, order)).map((date) => ({
    id: `report-date--${date}`, label: formatDate(date), date, entries: dated.get(date)!.sort(byIdentity)
  }));
  if (undated.length) groups.push({ id: 'report-date--unknown', label: 'Publication date unknown', date: null, entries: undated.sort(byIdentity) });
  return groups;
}

/** Navigation only: each month targets its first source in the visible daily chronology. */
export function groupReportMonths(incidents: Incident[], order: Order = 'desc'): ReportMonthGroup[] {
  const groups = new Map<string | null, ReportMonthGroup>();
  for (const group of groupReports(incidents, order)) {
    const month = group.date?.slice(0, 7) ?? null;
    const existing = groups.get(month);
    if (existing) existing.sourceCount += group.entries.length;
    else groups.set(month, {
      id: group.entries[0].id,
      month,
      label: month ? formatMonth(month) : group.label,
      sourceCount: group.entries.length
    });
  }
  return [...groups.values()];
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function formatMonth(date: string): string {
  const [year, month] = date.split('-');
  return `${months[Number(month) - 1]} ${year}`;
}
export function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${Number(day)} ${months[Number(month) - 1]} ${year}`;
}
export function formatIncidentDate(date: IncidentDate): string {
  switch (date.kind) {
    case 'exact': return formatDate(date.date);
    case 'month': return formatMonth(date.month);
    case 'range': return `${formatDate(date.start)} – ${formatDate(date.end)}`;
    case 'approximate': return date.label;
    case 'unknown': return 'Unknown';
  }
}
