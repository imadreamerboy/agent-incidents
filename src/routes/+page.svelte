<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { page } from '$app/state';
  import { afterNavigate, pushState, replaceState } from '$app/navigation';
  import type { Incident, Provider } from '$lib/content/schema';
  import { filterIncidents, parseView, serializeView, toggleProvider, type ViewState } from '$lib/timeline';
  import ChronologyControl from '$lib/components/ChronologyControl.svelte';
  import ProviderFilters from '$lib/components/ProviderFilters.svelte';
  import Timeline from '$lib/components/Timeline.svelte';
  import ReportTimeline from '$lib/components/ReportTimeline.svelte';
  import PageMeta from '$lib/components/PageMeta.svelte';
  import BackToTop from '$lib/components/BackToTop.svelte';

  let { data }: { data: { incidents: Incident[]; providers: Provider[]; demo: boolean; updatedDate: string } } = $props();
  let currentUrl = $state<string | null>(null);
  let mounted = $derived(currentUrl !== null);
  const defaultState: ViewState = { mode: 'incident', order: 'desc', providerIds: [] };
  let parsed = $derived(currentUrl ? parseView(new URL(currentUrl).searchParams, data.providers) : { state: defaultState, error: null });
  let view = $derived(parsed.state);
  let viewError = $derived(parsed.error);
  let incidents = $derived(viewError ? [] : filterIncidents(data.incidents, view.providerIds));
  let noun = $derived(data.demo ? 'examples' : 'incidents');
  let filtered = $derived(!!view.providerIds.length);
  let incidentCount = $derived(filtered ? `${incidents.length} of ${data.incidents.length} ${noun}` : `${incidents.length} ${incidents.length === 1 ? (data.demo ? 'example' : 'incident') : noun}`);
  let sourceCount = $derived(incidents.reduce((total, incident) => total + incident.sources.length, 0));
  let totalSources = $derived(data.incidents.reduce((total, incident) => total + incident.sources.length, 0));
  let count = $derived(view.mode === 'incident' ? incidentCount : `${filtered ? `${sourceCount} of ${totalSources} sources` : `${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}`} · ${incidentCount}`);
  let ordering = $derived(`${view.order === 'asc' ? 'Oldest' : 'Newest'} ${view.mode === 'incident' ? 'incidents' : 'sources'} first`);
  let visibleProviders = $derived(data.providers.filter((provider) => view.providerIds.includes(provider.id) || data.incidents.some((incident) => [...incident.providerIds, ...incident.evaluatorIds].includes(provider.id))));

  let evaluatorOnlyIds = $derived(visibleProviders.filter((provider) => !data.incidents.some((incident) => incident.providerIds.includes(provider.id)) && data.incidents.some((incident) => incident.evaluatorIds.includes(provider.id))).map((provider) => provider.id));

  function viewUrl(next: ViewState): URL {
    const url = new URL(window.location.href);
    url.searchParams.delete('mode');
    url.searchParams.delete('providers');
    url.searchParams.delete('order');
    url.searchParams.delete('q');
    url.searchParams.delete('context');
    for (const [key, value] of serializeView(next)) url.searchParams.set(key, value);
    return url;
  }

  function incidentHref(id: string): string {
    const url = viewUrl({ ...view, mode: 'incident' });
    url.hash = id;
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function changeView(next: ViewState) {
    const url = viewUrl(next);
    if (next.mode !== view.mode) url.hash = '';
    if (url.href !== window.location.href) {
      pushState(url, page.state);
      readBrowserUrl();
    }
  }

  // Kit's shallow routing writes browser history without updating page.url.
  // Keep one URL snapshot; all visible state is derived from its query string.
  function readBrowserUrl() {
    currentUrl = window.location.href;
  }

  function revealFragment(fragment: string, scroll = true) {
    const target = document.getElementById(fragment);
    if (!target) return;
    let disclosure = target.closest('details');
    while (disclosure) {
      disclosure.open = true;
      disclosure = disclosure.parentElement?.closest('details') ?? null;
    }
    if (scroll) target.scrollIntoView();
  }

  function restoreHash() {
    readBrowserUrl();
    const fragment = window.location.hash.slice(1);
    void tick().then(() => revealFragment(fragment));
  }

  function restoreHistory() {
    readBrowserUrl();
    const fragment = window.location.hash.slice(1);
    void tick().then(() => revealFragment(fragment, false));
  }

  afterNavigate(({ type, to }) => {
    if (!mounted) return;
    readBrowserUrl();
    // A cross-view link can target an entry that appears only after this redraw.
    // Leave popstate scrolling to Kit so Back/Forward retain saved positions.
    if ((type === 'link' || type === 'goto') && to?.url.hash) {
      const targetUrl = window.location.href;
      const fragment = to.url.hash.slice(1);
      void tick().then(() => {
        if (window.location.href === targetUrl) revealFragment(fragment);
      });
    }
  });

  onMount(() => {
    readBrowserUrl();
    window.addEventListener('popstate', restoreHistory);
    window.addEventListener('hashchange', restoreHash);
    void tick().then(async () => {
      // The router's root must be mounted before its history APIs are called.
      const initial = parseView(new URL(window.location.href).searchParams, data.providers);
      if (!initial.error) {
        const canonical = viewUrl(initial.state);
        if (canonical.href !== window.location.href) {
          replaceState(canonical, page.state);
          readBrowserUrl();
        }
      }
      await tick();
      if (window.location.hash) revealFragment(window.location.hash.slice(1));
    });
    return () => {
      window.removeEventListener('popstate', restoreHistory);
      window.removeEventListener('hashchange', restoreHash);
    };
  });
</script>

<PageMeta title="Agent incidents" />
<main id="main-content" tabindex="-1">
  <header>
    <h1 id="page-title" tabindex="-1">Agent incidents</h1>
    <p class="intro">Published reports describe AI agents leaking credentials, bypassing access restrictions and exchanging messages on public websites. This timeline brings those cases together, with their sources, dates and open questions.</p>
    <p class="intro-links"><a href="/about/#methodology">How the collection works</a><a href="/roadmap/">What’s next</a></p>
    <p class="related-resource">For tools, datasets and people researching AI misalignment incidents, explore <a href="https://swarms.wiki/">swarms.wiki ↗</a>.</p>
  </header>

  <div class="controls">
    <div class="view-controls">
      <ChronologyControl mode={view.mode} disabled={!mounted || !!viewError} onchange={(mode) => changeView({ ...view, mode })} />
      <button
        class="order-control"
        type="button"
        aria-label="Oldest first"
        aria-pressed={view.order === 'asc'}
        title={view.order === 'asc' ? 'Oldest first · Switch to newest first' : 'Newest first · Switch to oldest first'}
        disabled={!mounted || !!viewError}
        onclick={() => changeView({ ...view, order: view.order === 'asc' ? 'desc' : 'asc' })}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 6h9M4 12h6M4 18h3M18 5v14" />
          <path d={view.order === 'asc' ? 'm14 9 4-4 4 4' : 'm14 15 4 4 4-4'} />
        </svg>
      </button>
    </div>
    <div class="filter-row">
      <ProviderFilters providers={visibleProviders} {evaluatorOnlyIds} selected={view.providerIds} disabled={!mounted || !!viewError} ontoggle={(id) => changeView({ ...view, providerIds: toggleProvider(view.providerIds, id) })} onreset={() => changeView({ ...view, providerIds: [] })} />
      {#if !viewError}<span class="result-count" aria-hidden="true">{count}</span>{/if}
    </div>

    <noscript><p class="no-script">Filtering and chronology controls need JavaScript. The full timeline is shown below in incident-date order.</p></noscript>
  </div>

  <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{mounted ? viewError ? 'This timeline view is unavailable. Reset the view to show the timeline.' : `${count}. ${view.mode === 'incident' ? 'Incident date' : 'Reporting date'}. ${ordering}.` : ''}</p>

  <div id="timeline" tabindex="-1">
    {#if viewError}
      <section class="empty-state error-state" aria-labelledby="filter-error">
        <h2 id="filter-error">Timeline view unavailable</h2>
        <p>{viewError}</p>
        <button class="text-button" type="button" onclick={() => changeView(defaultState)}>Reset the view</button>
      </section>
    {:else if data.incidents.length === 0}
      <section class="empty-state" aria-labelledby="empty-title">
        <h2 id="empty-title">No incidents published yet</h2>
        <p>Reports will appear here with their sources and dates once they have been reviewed.</p>
      </section>
    {:else if incidents.length === 0}
      <section class="empty-state" aria-labelledby="no-matches">
        <h2 id="no-matches">No {noun} match the selected filters.</h2>
        <button class="text-button" type="button" onclick={() => changeView({ ...view, providerIds: [] })}>Reset filters</button>
      </section>
    {:else}
      {#if view.mode === 'reported'}
        <ReportTimeline {incidents} providers={data.providers} order={view.order} demo={data.demo} {incidentHref} />
      {:else}
        <Timeline {incidents} providers={data.providers} order={view.order} demo={data.demo} />
      {/if}
    {/if}
  </div>

</main>
<BackToTop />

<style>
  main { padding-top: 48px; }
  header { margin-bottom: 28px; }
  h1 { margin: 0; font-size: clamp(48px, 4.45vw, 64px); line-height: 1.05; letter-spacing: -0.048em; font-weight: 700; }
  .intro { margin: 16px 0 0; font-size: 17px; line-height: 1.5; color: var(--secondary); max-width: 76ch; }
  .intro-links { display: flex; flex-wrap: wrap; gap: 8px 24px; margin: 16px 0 0; font-size: 14px; }
  .intro-links a { text-underline-offset: 3px; }
  .related-resource { margin: 16px 0 0; font-size: 14px; line-height: 1.6; color: var(--secondary); max-width: 76ch; }
  .related-resource a { color: var(--ink); white-space: nowrap; }
  .controls { margin-bottom: 36px; }
  .view-controls { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--rule); }
  .order-control { display: grid; place-items: center; flex-shrink: 0; width: 44px; height: 44px; padding: 0; border: 0; border-radius: 5px; background: transparent; color: var(--ink); }
  .order-control:disabled { cursor: not-allowed; opacity: 0.45; }
  @media (hover: hover) {
    .order-control:hover:not(:disabled) { background: var(--hover); }
  }
  .filter-row { display: flex; gap: 12px 20px; align-items: center; justify-content: space-between; margin-top: 12px; }
  .result-count { font-size: 14px; line-height: 1.45; color: var(--secondary); flex-shrink: 0; font-variant-numeric: tabular-nums; }
  .empty-state { margin-top: 40px; border-top: 1px solid var(--rule); padding: 48px 0 64px; max-width: 760px; }
  .empty-state h2 { margin: 0; font-size: 32px; font-weight: 650; letter-spacing: -0.035em; line-height: 1.2; }
  .empty-state p { margin: 16px 0 0; max-width: 57ch; font-size: 17px; line-height: 1.6; }
  .text-button { margin: 16px 0 0; padding: 10px 0; min-height: 44px; border: 0; background: transparent; font-size: 16px; text-align: left; text-decoration: underline; text-underline-offset: 4px; }
  .no-script { font-size: 14px; color: var(--secondary); line-height: 1.5; }
  @media (max-width: 1023px) {
    main { padding-top: 40px; }
    h1 { font-size: 48px; }
    .filter-row { align-items: flex-start; }
    .filter-row { flex-wrap: wrap; }
  }
  @media (max-width: 639px) {
    main { padding-top: 32px; }
    h1 { font-size: 36px; line-height: 1.1; }
    header { margin-bottom: 24px; }
    .intro { font-size: 16px; margin-top: 12px; }
    .controls { margin-bottom: 28px; }
    .filter-row { flex-direction: column; gap: 12px; margin-top: 12px; }
    .result-count { font-size: 13px; }
    .empty-state { margin-top: 28px; padding: 32px 0; }
    .empty-state h2 { font-size: 28px; }
    .empty-state p { font-size: 16px; }
  }
  @media (max-width: 359px) {
    h1 { font-size: 32px; }
  }
</style>
