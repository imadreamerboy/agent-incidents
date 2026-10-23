import { beforeAll, describe, expect, it } from 'vitest';
import type { Incident, IncidentEvent, Provider } from '../../src/lib/content/schema';
import { loadCollection } from '../../src/lib/server/content';
import { chronologyDate, filterIncidents, formatDate, formatIncidentDate, groupIncidents, groupReports, groupReportMonths, groupEvents, parseView, serializeView, toggleProvider } from '../../src/lib/timeline';

let incidents: Incident[];
let providers: Provider[];
beforeAll(async () => { ({ incidents, providers } = await loadCollection({ demo: true })); });
const ids = (items: Incident[]) => items.map((item) => item.id);

describe('chronology and provider membership', () => {
  it('orders incident dates independently of each incident first report', () => {
    const pair = incidents.filter((incident) => ['example-incident-a', 'example-incident-b'].includes(incident.id));
    expect(ids(groupIncidents(pair)[0].incidents)).toEqual(['example-incident-a', 'example-incident-b']);
    expect(ids(groupIncidents(pair, 'asc')[0].incidents)).toEqual(['example-incident-b', 'example-incident-a']);
  });
  it('interleaves date precisions by their earliest known date in both directions', () => {
    const source = incidents[0];
    const dates: Incident['incidentDate'][] = [
      { kind: 'exact', date: '2026-07-12', sourceIds: ['s'] },
      { kind: 'month', month: '2026-08', sourceIds: ['s'] },
      { kind: 'range', start: '2026-06-24', end: '2026-08-12', sourceIds: ['s'] },
      { kind: 'approximate', label: 'Early May 2026', sortDate: '2026-05-01', sourceIds: ['s'] },
      { kind: 'unknown' },
      { kind: 'approximate', label: 'Before publication', sourceIds: ['s'] }
    ];
    const records = dates.map((incidentDate, index) => ({ ...source, id: `record-${index}`, incidentDate, reportedDate: '2026-09-18' }));
    const ascending = groupIncidents(records, 'asc');
    const descending = groupIncidents(records, 'desc');
    expect(ascending.map((group) => group.id)).toEqual(['dated', 'unknown']);
    expect(ids(ascending[0].incidents)).toEqual(['record-3', 'record-2', 'record-0', 'record-1']);
    expect(ids(descending[0].incidents)).toEqual(['record-1', 'record-0', 'record-2', 'record-3']);
    for (const groups of [ascending, descending]) {
      expect(groups[0].label).toBeNull();
      expect(ids(groups[1].incidents)).toEqual(['record-4', 'record-5']);
      expect(new Set(groups.flatMap((group) => ids(group.incidents)))).toEqual(new Set(ids(records)));
    }
    expect(dates.map(chronologyDate)).toEqual(['2026-07-12', '2026-08-01', '2026-06-24', '2026-05-01', null, null]);
    expect(ids(records)).toEqual(dates.map((_, index) => `record-${index}`));
  });
  it('breaks equal dates by the other exact date and then stable ID without mutating input', () => {
    const source = incidents.find((item) => item.id === 'example-incident-a')!;
    const a = { ...source, id: 'a' }, b = { ...source, id: 'b' };
    const c = { ...source, id: 'c', reportedDate: '2026-09-19' };
    const input = [b, a, c];
    expect(ids(groupIncidents(input)[0].incidents)).toEqual(['c', 'a', 'b']);
    expect(ids(input)).toEqual(['b', 'a', 'c']);
    expect(ids(groupIncidents(input, 'asc')[0].incidents)).toEqual(['a', 'b', 'c']);
  });
  it('uses a provider union, counts a multi-provider incident once, and retains unknown dates', () => {
    const filtered = filterIncidents(incidents, ['example-lab-a', 'example-lab-b']);
    expect(filtered).toHaveLength(5);
    expect(ids(filtered).filter((id) => id === 'example-multiple-providers')).toHaveLength(1);
    expect(filterIncidents(incidents, ['unknown'])[0].incidentDate.kind).toBe('unknown');
    expect(filterIncidents(incidents, [])).toHaveLength(incidents.length);
    expect(filterIncidents(incidents, ['example-empty'])).toEqual([]);
    expect(groupIncidents([])).toEqual([]);
  });
  it('returns to all providers when the last individual selection is removed', () => {
    expect(toggleProvider([], 'example-lab-a')).toEqual(['example-lab-a']);
    expect(toggleProvider(['example-lab-a'], 'example-lab-b')).toEqual(['example-lab-a', 'example-lab-b']);
    expect(toggleProvider(['example-lab-a'], 'example-lab-a')).toEqual([]);
  });
  it('filters by evaluator without changing model-provider attribution or duplicating reports', () => {
    const filtered = filterIncidents(incidents, ['example-evaluator']);
    expect(ids(filtered)).toEqual(['example-unknown-date']);
    expect(filtered[0].providerIds).toEqual(['unknown']);
    const union = filterIncidents(incidents, ['example-evaluator', 'unknown']);
    expect(union).toEqual(filtered);
    expect(groupReports(union).flatMap((group) => group.entries)).toHaveLength(1);
    for (const mode of ['incident', 'reported'] as const) {
      const state = { mode, order: 'asc' as const, providerIds: ['example-evaluator'] };
      expect(parseView(serializeView(state), providers)).toEqual({ state, error: null });
    }
  });
});

describe('shareable URL state', () => {
  it('defaults to incident chronology and all providers', () => {
    expect(parseView(new URLSearchParams(), providers)).toEqual({ state: { mode: 'incident', order: 'desc', providerIds: [] }, error: null });
    expect(serializeView({ mode: 'incident', order: 'desc', providerIds: [] }).toString()).toBe('');
  });
  it('canonicalises unions and round-trips durable state', () => {
    const parsed = parseView(new URLSearchParams('mode=reported&order=asc&providers=example-lab-b,example-lab-a,example-lab-b'), providers);
    expect(parsed.error).toBeNull();
    const url = serializeView(parsed.state);
    expect(url.get('order')).toBe('asc');
    expect(url.get('providers')).toBe('example-lab-a,example-lab-b');
    expect(parseView(url, providers)).toEqual(parsed);
  });
  it.each(['mode=other', 'mode=', 'order=other', 'order=', 'order=asc&order=desc', 'order=asc&order=asc', 'providers=', 'providers=missing', 'providers=example-lab-a,', 'mode=incident&mode=reported', 'providers=example-lab-a&providers=example-lab-b'])('rejects invalid or ambiguous query %s', (query) => {
    expect(parseView(new URLSearchParams(query), providers).error).toMatch(/Unrecognised filter/);
  });
});

describe('calendar date display', () => {
  it('does not shift dates when the local timezone changes', () => {
    const previous = process.env.TZ;
    try {
      for (const timezone of ['Pacific/Honolulu', 'Pacific/Kiritimati', 'Europe/Berlin']) {
        process.env.TZ = timezone;
        expect(formatDate('2026-09-12')).toBe('12 Sep 2026');
      }
    } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
  });
  it('preserves each precision without manufacturing a day', () => {
    expect(formatIncidentDate({ kind: 'unknown' })).toBe('Unknown');
    expect(formatIncidentDate({ kind: 'month', month: '2026-08', sourceIds: ['s'] })).toBe('Aug 2026');
    expect(formatIncidentDate({ kind: 'range', start: '2026-08-28', end: '2026-09-03', sourceIds: ['s'] })).toBe('28 Aug 2026 – 3 Sep 2026');
    expect(formatIncidentDate({ kind: 'approximate', label: 'Early summer 2026', sortDate: '2026-06-01', sourceIds: ['s'] })).toBe('Early summer 2026');
  });
});


describe('publication chronology', () => {
  it('expands each source without replacing the first reporting date', () => {
    const incident = incidents.find((item) => item.id === 'example-incident-a')!;
    const groups = groupReports([incident]);
    expect(groups.map((group) => group.date)).toEqual(['2026-11-18', '2026-09-18', null]);
    expect(groups[0].entries[0].source.kind).toBe('independent-research');
    expect(groups[1].entries[0].source.kind).toBe('official-report');
    expect(groups[2].entries[0].source.kind).toBe('repository');
    expect(groups[2].label).toBe('Publication date unknown');
    expect(incident.reportedDate).toBe('2026-09-18');
    expect(groups.flatMap((group) => group.entries)).toHaveLength(incident.sources.length);
  });
  it('orders date groups in both directions while retaining undated sources last', () => {
    const descending = groupReports(incidents);
    const ascending = groupReports(incidents, 'asc');
    const dated = descending.filter((group) => group.date).map((group) => group.date);
    expect(ascending.filter((group) => group.date).map((group) => group.date)).toEqual([...dated].reverse());
    expect(ascending.at(-1)?.date).toBeNull();
    expect(descending.at(-1)?.date).toBeNull();
    expect(groupReports([])).toEqual([]);
  });
  it('groups same-day publications with stable incident and source identity ordering', () => {
    const incident = incidents.find((item) => item.id === 'example-incident-a')!;
    const source = incident.sources[0];
    const records: Incident[] = [
      { ...incident, id: 'b', sources: [{ ...source, id: 'z' }] },
      { ...incident, id: 'a', sources: [{ ...source, id: 'z' }, { ...source, id: 'a' }] }
    ];
    for (const order of ['asc', 'desc'] as const) {
      const groups = groupReports(records, order);
      expect(groups).toHaveLength(1);
      expect(groups[0].entries.map((entry) => entry.id)).toEqual(['report--a--a', 'report--a--z', 'report--b--z']);
      expect(groups[0].label).toBe('18 Sep 2026');
    }
    expect(records[1].sources.map((item) => item.id)).toEqual(['z', 'a']);
  });
  it('keeps provider unions unique before expanding reports and produces distinct DOM IDs', () => {
    const filtered = filterIncidents(incidents, ['example-lab-a', 'example-lab-b']);
    const reports = groupReports(filtered).flatMap((group) => group.entries);
    expect(reports).toHaveLength(filtered.reduce((count, incident) => count + incident.sources.length, 0));
    expect(new Set(reports.map((report) => report.id)).size).toBe(reports.length);
    expect(reports.filter((report) => report.incident.id === 'example-multiple-providers')).toHaveLength(3);
    expect(reports.every((report) => /^[a-z0-9-]+$/.test(report.id))).toBe(true);
    // A single-hyphen separator would confuse these distinct ID tuples.
    const source = filtered[0].sources[0];
    const collisionCandidates = [{ ...filtered[0], id: 'a-b', sources: [{ ...source, id: 'c' }] }, { ...filtered[0], id: 'a', sources: [{ ...source, id: 'b-c' }] }];
    expect(new Set(groupReports(collisionCandidates).flatMap((group) => group.entries.map((entry) => entry.id))).size).toBe(2);
  });
});

describe('report month navigation', () => {
  it('counts sources per publication month and targets the first visible report in each order', () => {
    const records = incidents.filter((incident) => ['example-incident-a', 'example-incident-b'].includes(incident.id));
    expect(groupReportMonths(records)).toEqual([
      { id: 'report--example-incident-a--example-follow-up', month: '2026-11', label: 'Nov 2026', sourceCount: 1 },
      { id: 'report--example-incident-b--example-report', month: '2026-09', label: 'Sep 2026', sourceCount: 2 },
      { id: 'report--example-incident-a--example-repository', month: null, label: 'Publication date unknown', sourceCount: 1 }
    ]);
    expect(groupReportMonths(records, 'asc')).toEqual([
      { id: 'report--example-incident-a--example-report', month: '2026-09', label: 'Sep 2026', sourceCount: 2 },
      { id: 'report--example-incident-a--example-follow-up', month: '2026-11', label: 'Nov 2026', sourceCount: 1 },
      { id: 'report--example-incident-a--example-repository', month: null, label: 'Publication date unknown', sourceCount: 1 }
    ]);
    expect(groupReports(records).map((group) => group.date)).toEqual(['2026-11-18', '2026-09-20', '2026-09-18', null]);
  });
  it('keeps years distinct and preserves the daily chronology identity order for same-day targets', () => {
    const incident = incidents.find((item) => item.id === 'example-incident-a')!;
    const source = incident.sources[0];
    const records = [{ ...incident, sources: [
      { ...source, id: 'example-z', publishedDate: '2026-09-18' },
      { ...source, id: 'example-earlier-year', publishedDate: '2025-09-18' },
      { ...source, id: 'example-a', publishedDate: '2026-09-18' }
    ] }];
    const descending = groupReportMonths(records);
    expect(descending.map((group) => group.month)).toEqual(['2026-09', '2025-09']);
    expect(descending.map((group) => group.label)).toEqual(['Sep 2026', 'Sep 2025']);
    expect(descending.map((group) => group.sourceCount)).toEqual([2, 1]);
    expect(descending[0].id).toBe('report--example-incident-a--example-a');
    expect(groupReportMonths(records, 'asc').map((group) => group.id)).toEqual([...descending].reverse().map((group) => group.id));
    expect(records[0].sources.map((item) => item.id)).toEqual(['example-z', 'example-earlier-year', 'example-a']);
  });
  it('uses the filtered provider union without duplicating sources or retaining empty months', () => {
    const records = incidents.filter((incident) => ['example-incident-a', 'example-incident-b'].includes(incident.id));
    const onlyB = groupReportMonths(filterIncidents(records, ['example-lab-b']));
    expect(onlyB).toEqual([{ id: 'report--example-incident-b--example-report', month: '2026-09', label: 'Sep 2026', sourceCount: 1 }]);
    const union = groupReportMonths(filterIncidents(records, ['example-lab-a', 'example-lab-b']));
    expect(union.reduce((count, group) => count + group.sourceCount, 0)).toBe(4);
    const shared = incidents.filter((incident) => incident.id === 'example-multiple-providers');
    expect(groupReportMonths(filterIncidents(shared, ['example-lab-a', 'example-lab-b'])).map((group) => group.sourceCount)).toEqual([3]);
    expect(groupReportMonths(filterIncidents(records, ['example-empty']))).toEqual([]);
    expect(groupReportMonths([])).toEqual([]);
  });
});


describe('events within an incident', () => {
  it('places exact events in ascending order and retains authored order within a day', () => {
    const incident = incidents.find((item) => item.id === 'example-incident-a')!;
    const [assigned, crossed, contained] = incident.events;
    const authored = [contained, crossed, assigned];
    const groups = groupEvents(authored);
    expect(groups).toHaveLength(1);
    expect(groups[0].id).toBe('dated');
    expect(groups[0].events.map((event) => event.id)).toEqual(['scope-crossed', 'task-assigned', 'task-contained']);
    expect(authored.map((event) => event.id)).toEqual(['task-contained', 'scope-crossed', 'task-assigned']);
  });
  it('interleaves event precisions earliest-first and leaves only unpositioned events last', () => {
    const incident = incidents.find((item) => item.id === 'example-incident-a')!;
    const other = incidents.find((item) => item.id === 'example-multiple-providers')!;
    const [month, range, unknown] = other.events;
    const approximate: IncidentEvent = { ...month, id: 'approximate', date: { kind: 'approximate', label: 'Late August 2026', sortDate: '2026-08-25', sourceIds: ['example-statement'] } };
    const unpositioned: IncidentEvent = { ...month, id: 'unpositioned', date: { kind: 'approximate', label: 'During the workflow', sourceIds: ['example-statement'] } };
    const unknownTwo: IncidentEvent = { ...unknown, id: 'another-unknown' };
    const groups = groupEvents([unknown, range, incident.events[0], approximate, unpositioned, unknownTwo, month]);
    expect(groups.map((group) => group.id)).toEqual(['dated', 'unknown']);
    expect(groups[0].events.map((event) => event.id)).toEqual(['shared-workflow-started', 'approximate', 'access-expanded', 'task-assigned']);
    expect(groups[1].events.map((event) => event.id)).toEqual(['credentials-revoked', 'unpositioned', 'another-unknown']);
    expect(groups[0].label).toBeNull();
    expect(groups[1].label).toBe('Event date unknown');
    expect(groupEvents([])).toEqual([]);
  });
  it('retains authored event order when different precisions share an ordering anchor', () => {
    const event = incidents.find((item) => item.id === 'example-incident-a')!.events[0];
    const dates: IncidentEvent['date'][] = [
      { kind: 'month', month: '2026-08', sourceIds: ['s'] },
      { kind: 'approximate', label: 'Early August 2026', sortDate: '2026-08-01', sourceIds: ['s'] },
      { kind: 'exact', date: '2026-08-01', sourceIds: ['s'] },
      { kind: 'range', start: '2026-08-01', end: '2026-08-03', sourceIds: ['s'] }
    ];
    const events = dates.map((date, index) => ({ ...event, id: `event-${index}`, date }));
    expect(groupEvents(events)[0].events.map((item) => item.id)).toEqual(events.map((item) => item.id));
  });
  it('keeps incidents with no recorded events in the collection', () => {
    const withoutEvents = incidents.filter((incident) => incident.events.length === 0);
    expect(withoutEvents).toHaveLength(5);
    expect(groupIncidents(incidents).flatMap((group) => group.incidents)).toHaveLength(7);
  });
});


describe('unavailable discovery features', () => {
  it.each(['q=scope', 'q=', 'context=evaluation', 'context=', 'q=one&q=two'])('rejects unsupported search state %s without showing misleading results', (query) => {
    expect(parseView(new URLSearchParams(query), providers).error).toBe('Search is not available in this timeline preview.');
  });
});
