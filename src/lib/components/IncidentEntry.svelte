<script lang="ts">
  import type { Incident, Provider } from '$lib/content/schema';
  import { formatDate, formatIncidentDate, CONTEXT_LABELS } from '$lib/timeline';
  import SourceList from './SourceList.svelte';
  import IncidentAttribution from './IncidentAttribution.svelte';
  import EventTimeline from './EventTimeline.svelte';

  let { incident, providers, demo }: {
    incident: Incident;
    providers: Provider[];
    demo: boolean;
  } = $props();

  let incidentDate = $derived(formatIncidentDate(incident.incidentDate));
</script>

<article id={incident.id} aria-labelledby={`${incident.id}-title`} class:unknown={incident.incidentDate.kind === 'unknown'}>
  <div class="primary-date">
    <span class="date-caption">Incident</span>
    {#if incident.incidentDate.kind === 'exact'}
      <time datetime={incident.incidentDate.date}>{incidentDate}</time>
    {:else}
      <span>{incidentDate}</span>
    {/if}
  </div>
  <span class="node" aria-hidden="true"></span>
  <div class="content">
    <IncidentAttribution {incident} {providers} />
    <h3 id={`${incident.id}-title`}><a class="permalink" href={`#${incident.id}`}>{incident.title}</a></h3>
    <p class="context-label">{CONTEXT_LABELS[incident.context]}</p>
    <p class="summary">{incident.summary}</p>
    <EventTimeline {incident} />
    <SourceList sources={incident.sources} incidentId={incident.id} {demo} />
  </div>
  <dl class="dates">
    <div><dt>First reported</dt><dd><time datetime={incident.reportedDate}>{formatDate(incident.reportedDate)}</time></dd></div>
  </dl>
</article>

<style>
  .context-label { margin: 8px 0 0; font-size: 13px; line-height: 1.5; color: var(--secondary); }
  article { position: relative; display: grid; grid-template-columns: 136px minmax(0, 1fr) 160px; gap: 0 48px; scroll-margin-top: 32px; }
  .primary-date { font-size: 18px; font-weight: 500; line-height: 1.4; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .date-caption { display: block; margin-bottom: 4px; color: var(--secondary); font-size: 13px; font-weight: 400; line-height: 1.5; }
  .node { position: absolute; top: 7px; left: 147px; width: 11px; height: 11px; background: var(--ink); border: 1px solid var(--ink); border-radius: 50%; }
  .unknown .node { background: var(--paper); }
  .unknown .primary-date { color: var(--secondary); }
  h3 { margin: 8px 0 0; font-size: 24px; font-weight: 650; line-height: 1.25; letter-spacing: -0.025em; overflow-wrap: anywhere; }
  .permalink { text-decoration: none; }
  article:target h3 .permalink { text-decoration: underline; text-decoration-thickness: 2px; }
  @media (hover: hover) and (pointer: fine) { .permalink:hover { text-decoration: underline; text-decoration-thickness: 1px; } }
  .summary { margin: 8px 0 0; font-size: 17px; line-height: 1.5; max-width: 70ch; overflow-wrap: anywhere; }
  .dates { margin: 0; border-left: 1px solid var(--rule); padding-left: 20px; align-self: start; font-size: 14px; line-height: 1.45; font-variant-numeric: tabular-nums; }
  dt { color: var(--secondary); }
  dd { margin: 2px 0 0; font-size: 15px; overflow-wrap: anywhere; }
  @media (min-width: 1280px) { .summary { font-size: clamp(17px, 1.32vw, 19px); } }
  @media (max-width: 1023px) {
    article { grid-template-columns: 120px minmax(0, 1fr); gap: 0 40px; }
    .node { left: 131px; }
    .dates { grid-column: 2; display: flex; flex-wrap: wrap; gap: 12px 24px; border-left: 0; padding-left: 0; margin-top: 16px; }
    .dates div { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; }
    dd { margin: 0; }
    .primary-date { font-size: 16px; }
  }
  @media (max-width: 639px) {
    article { display: block; padding-left: 30px; }
    .node { left: 0; top: 6px; }
    .primary-date { margin-bottom: 12px; font-size: 16px; }
    .date-caption { display: inline; margin-right: 8px; }
    h3 { font-size: 22px; line-height: 1.3; }
    .summary { font-size: 16px; }
    .dates { gap: 8px 20px; padding-bottom: 0; font-size: 14px; }
    dd { font-size: 14px; }
  }
</style>
