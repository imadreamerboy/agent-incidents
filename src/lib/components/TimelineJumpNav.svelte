<script lang="ts">
  type JumpItem = { id: string; label: string; date: string; detail?: string };
  let { items }: { items: JumpItem[] } = $props();
  let map: HTMLOListElement | undefined = $state();
  let previewBox: HTMLDivElement | undefined = $state();
  let activeId = $state('');
  let previewId = $state<string | null>(null);
  let previewPosition = $state({ top: 0, right: 0 });
  let previewItem = $derived(items.find((item) => item.id === previewId));
  let hoveredLink: HTMLAnchorElement | null = null;
  let focusedLink: HTMLAnchorElement | null = null;
  let previewLink: HTMLAnchorElement | null = null;
  let previewHovered = false;
  let suppressedId: string | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  let previewFrame = 0;

  function accessibleName(item: JumpItem, index: number) {
    return `${index + 1}. ${item.label}. ${item.date}${item.detail ? `. ${item.detail}` : ''}`;
  }
  function clearCloseTimer() { clearTimeout(closeTimer); }
  function dismissPreview() {
    clearCloseTimer();
    suppressedId = previewId;
    previewId = null;
    previewHovered = false;
  }
  function positionPreview() {
    if (!previewId || !previewLink?.isConnected || !map) return;
    const rect = previewLink.getBoundingClientRect();
    const halfHeight = (previewBox?.offsetHeight ?? 120) / 2;
    previewPosition = {
      top: Math.max(24 + halfHeight, Math.min(window.innerHeight - 24 - halfHeight, rect.top + rect.height / 2)),
      right: window.innerWidth - rect.left
    };
  }
  function showPreview(link: HTMLAnchorElement, freshEntry = false) {
    clearCloseTimer();
    const id = link.dataset.entryId;
    if (freshEntry) suppressedId = null;
    if (!id || id === suppressedId) return;
    previewLink = link;
    previewId = id;
    positionPreview();
    window.cancelAnimationFrame(previewFrame);
    previewFrame = window.requestAnimationFrame(positionPreview);
  }
  function schedulePreviewClose() {
    clearCloseTimer();
    closeTimer = setTimeout(() => {
      if (previewHovered) return;
      const link = hoveredLink ?? focusedLink;
      if (link) showPreview(link);
      else previewId = null;
    }, 120);
  }

  $effect(() => {
    const entries = items;
    const railMap = map;
    if (!railMap || entries.length === 0) {
      activeId = '';
      previewId = null;
      return;
    }
    const targets = entries.map((item) => ({ item, element: document.getElementById(item.id) }));
    const desktop = window.matchMedia('(min-width: 1280px)');
    let frame = 0;
    hoveredLink = null;
    focusedLink = null;
    previewId = null;

    function measure() {
      frame = 0;
      if (!desktop.matches) {
        dismissPreview();
        return;
      }
      const readingLine = Math.min(160, window.innerHeight * 0.25);
      let current = targets[0]?.item.id ?? '';
      for (const { item, element } of targets) {
        if (element && element.getBoundingClientRect().top <= readingLine) current = item.id;
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        current = entries[entries.length - 1].id;
      }
      activeId = current;
      positionPreview();
    }
    function schedule() { if (!frame) frame = window.requestAnimationFrame(measure); }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && previewId) {
        event.preventDefault();
        dismissPreview();
      }
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('keydown', handleEscape);
    desktop.addEventListener('change', schedule);
    schedule();
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(previewFrame);
      clearCloseTimer();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('keydown', handleEscape);
      desktop.removeEventListener('change', schedule);
      hoveredLink = null;
      focusedLink = null;
    };
  });
</script>

{#if items.length > 0}
  <nav class="jump-nav" aria-label="Timeline entries">
    <ol class="jump-map" bind:this={map} style:height={`${items.length * 12}px`}>
      {#each items as item, index (item.id)}
        <li>
          <a href={`#${item.id}`} data-entry-id={item.id} aria-label={accessibleName(item, index)}
            aria-current={activeId === item.id ? 'location' : undefined}
            onmouseenter={(event) => { hoveredLink = event.currentTarget; showPreview(event.currentTarget, true); }}
            onmouseleave={() => { hoveredLink = null; schedulePreviewClose(); }}
            onfocus={(event) => { focusedLink = event.currentTarget; showPreview(event.currentTarget, true); }}
            onblur={() => { focusedLink = null; schedulePreviewClose(); }}
            onclick={dismissPreview}
          ><span aria-hidden="true"></span></a>
        </li>
      {/each}
    </ol>
  </nav>

  {#if previewItem}
    <div class="jump-label" bind:this={previewBox} aria-hidden="true"
      style:top={`${previewPosition.top}px`} style:right={`${previewPosition.right}px`}
      onmouseenter={() => { previewHovered = true; clearCloseTimer(); }}
      onmouseleave={() => { previewHovered = false; schedulePreviewClose(); }}>
      <strong>{previewItem.label}</strong><span>{previewItem.date}</span>
      {#if previewItem.detail}<span>{previewItem.detail}</span>{/if}
    </div>
  {/if}
{/if}

<style>
  .jump-nav, .jump-label { display: none; }
  @media (min-width: 1280px) {
    .jump-nav {
      display: block; position: fixed; z-index: 20; top: 50%; width: 44px;
      right: max(4px, calc((100% - var(--site-max-width)) / 2 + 4px)); transform: translateY(-50%);
    }
    ol { list-style: none; margin: 0; padding: 0; }
    li { margin: 0; padding: 0; }
    .jump-map {
      display: flex; flex-direction: column; max-height: calc(100dvh - 144px);
      box-shadow: inset -1px 0 0 var(--rule);
    }
    .jump-map li { flex: 1; min-height: 0; }
    .jump-map a {
      display: flex; align-items: center; justify-content: flex-end; width: 100%; height: 100%; padding-right: 4px;
    }
    .jump-map a > span {
      width: 28px; height: 4px; background: var(--edge); transform: scaleX(0.5714) scaleY(0.5);
      transform-origin: right center; transition: transform 120ms ease, opacity 120ms ease;
    }
    .jump-map a:not([aria-current]):is(:hover, :focus-visible) > span {
      background: var(--secondary); transform: scaleX(0.8571) scaleY(0.75);
    }
    .jump-map a[aria-current] > span { background: var(--ink); transform: none; }
    .jump-map a:focus-visible { outline-offset: -2px; }
    .jump-map a:focus-visible > span { transition: none; }
    .jump-label {
      display: grid; gap: 4px; position: fixed; z-index: 21; width: max-content; max-width: 300px;
      padding: 8px 12px; border-left: 1px solid var(--rule); background: var(--paper); color: var(--ink);
      font-size: 13px; line-height: 1.4; transform: translateY(-50%); overflow-wrap: anywhere;
    }
    .jump-label strong { font-weight: 500; }
    .jump-label > span { color: var(--secondary); font-size: 12px; }
  }
  @media (prefers-reduced-motion: reduce) { .jump-map a > span { transition: none; } }
</style>
