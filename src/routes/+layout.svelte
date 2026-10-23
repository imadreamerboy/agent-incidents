<script lang="ts">
  import '$lib/styles/base.css';
  import { page } from '$app/state';
  import { site } from '$lib/site';
  import { formatDate } from '$lib/timeline';
  import GitHubIcon from '$lib/components/GitHubIcon.svelte';
  let { children, data } = $props();
</script>
<svelte:head>
  {#if data.demo}<meta name="robots" content="noindex, nofollow" />{/if}
</svelte:head>
<a class="skip-link" href="#main-content">Skip to content</a>
<div class="site-shell">
  <header class="site-header">
    <a class="site-name" href="/">Agent incidents</a>
    <nav class="site-nav" aria-label="Primary">
      <a href="/" aria-current={page.url.pathname === '/' ? 'page' : undefined}>Timeline</a>
      <a href="/about/" aria-current={page.url.pathname === '/about/' ? 'page' : undefined}>About</a>
      <a href="/roadmap/" aria-current={page.url.pathname === '/roadmap/' ? 'page' : undefined}>Roadmap</a>
      <a href="/submit/" aria-current={page.url.pathname === '/submit/' ? 'page' : undefined}>Send a tip</a>
    </nav>
  </header>
  {#if data.demo}<p class="demo-notice">Illustrative data — not real incidents</p>{/if}
  {@render children()}
  <footer class="site-footer">
    <p>Every entry links to its sources. Unknown dates and disputed claims stay visible.</p>
    <nav class="footer-nav" aria-label="Footer">
      <a href="/about/#methodology">Methodology</a>
      <a href="/roadmap/">Roadmap</a>
      <a href="/submit/">Tips and corrections</a>
      <a class="github-link" href={site.repositoryUrl}><GitHubIcon />GitHub</a>
    </nav>
    <p class="footer-meta"><span>Last updated <time datetime={data.updatedDate}>{formatDate(data.updatedDate)}</time></span><a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></p>
  </footer>
</div>
<style>
  .site-shell { max-width: var(--site-max-width); margin: 0 auto; padding: 0 40px 32px; }
  .site-header { display: flex; justify-content: space-between; align-items: center; gap: 16px 40px; padding: 22px 0; border-bottom: 1px solid var(--rule); }
  .site-name { font-size: 19px; font-weight: 650; text-decoration: none; letter-spacing: -.03em; }
  .site-nav { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 26px; font-size: 15px; }
  .site-nav a { padding: 5px 0; color: var(--ink); text-decoration: none; border-bottom: 1px solid transparent; white-space: nowrap; }
  .site-nav a:hover, .site-nav a[aria-current="page"] { border-color: currentColor; }
  .site-footer { margin-top: 64px; border-top: 1px solid var(--rule); padding: 24px max(64px, env(safe-area-inset-right)) 0 0; color: var(--secondary); font-size: 13px; line-height: 1.6; }
  .site-footer > p:first-child { max-width: 72ch; margin: 0 0 16px; }
  .site-footer a { color: var(--ink); overflow-wrap: anywhere; }
  .footer-nav { display: flex; flex-wrap: wrap; gap: 8px 24px; }
  .github-link { display: inline-flex; align-items: center; gap: 6px; }
  .footer-meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 24px; margin: 20px 0 0; }
  @media(min-width:1280px) { .site-shell { padding-right: 64px; } }
  @media(max-width:1023px) { .site-shell { padding: 0 24px 28px; } }
  @media(max-width:639px) { .site-shell { padding: 0 20px 24px; } .site-header { display: block; padding: 20px 0 10px; } .site-nav { gap: 4px 20px; margin-top: 14px; font-size: 14px; } .site-footer { margin-top: 40px; padding-right: 0; } }
  @media(max-width:359px) { .site-shell { padding-right: 16px; padding-left: 16px; } }
</style>
