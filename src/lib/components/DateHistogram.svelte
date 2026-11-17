<script lang="ts">
  import type { Mode } from '$lib/timeline';

  let { counts, year, month, mode, disabled = false, onchange }: {
    counts: Record<string, number[]>;
    year?: string;
    month?: string;
    mode: Mode;
    disabled?: boolean;
    onchange: (year?: string, month?: string) => void;
  } = $props();

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let years = $derived([...new Set([...Object.keys(counts), ...(year ? [year] : [])])].sort());
  let totals = $derived(years.map((y) => (counts[y] ?? []).reduce((sum, n) => sum + n, 0)));
  let yearPeak = $derived(Math.max(1, ...totals));
  let monthlyCounts = $derived(year ? counts[year] ?? [] : []);
  let monthPeak = $derived(Math.max(1, ...monthlyCounts));

  function describe(count: number) {
    const noun = mode === 'incident' ? 'incident' : 'source';
    return count + ' ' + noun + (count === 1 ? '' : 's');
  }
</script>

<fieldset {disabled}>
  <legend class="sr-only">{mode === 'incident' ? 'Filter by incident date' : 'Filter by publication date'}</legend>
  <div class="years" class:overview={!year}>
    <button type="button" class="period" aria-pressed={!year} onclick={() => onchange()}>
      <span class="period-name">All time</span>
    </button>
    {#each years as y, index (y)}
      <button
        type="button"
        class="period"
        aria-label={y + ', ' + describe(totals[index])}
        aria-pressed={year === y}
        onclick={() => onchange(y)}
      >
        {#if !year}
          <span class="year-plot" aria-hidden="true">
            <span class="count">{totals[index]}</span>
            <span class="bar" style:height={28 * totals[index] / yearPeak + 'px'}></span>
          </span>
        {/if}
        <span class="period-name">{y}</span>
      </button>
    {/each}
    {#if year}
      <button type="button" class="clear" onclick={() => onchange()}>Clear date</button>
    {/if}
  </div>
  {#if year}
    <div class="months" role="group" aria-label={'Months in ' + year}>
      {#each months as name, index}
        {@const key = String(index + 1).padStart(2, '0')}
        {@const count = monthlyCounts[index] ?? 0}
        <button
          type="button"
          class="bucket"
          aria-label={name + ' ' + year + ', ' + describe(count)}
          aria-pressed={month === key}
          onclick={() => onchange(year, key)}
        >
          <span class="plot" aria-hidden="true">
            <span class="count">{count}</span>
            <span class="bar" style:height={32 * count / monthPeak + 'px'}></span>
          </span>
          <span class="label">{name.slice(0, 3)}</span>
        </button>
      {/each}
    </div>
  {/if}
</fieldset>

<style>
  fieldset { min-width: 0; margin: 0; padding: 0 0 6px; border: 0; border-bottom: 1px solid var(--rule); }
  button { border: 0; background: transparent; color: var(--secondary); font-size: 14px; line-height: 1.25; font-variant-numeric: tabular-nums; }
  .years { display: flex; align-items: end; flex-wrap: wrap; gap: 0 18px; }
  .period, .clear { min-height: 44px; padding: 5px 0; }
  .period { display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .period-name { padding: 5px 0; border-bottom: 2px solid transparent; }
  .period[aria-pressed='true'] .period-name { color: var(--ink); font-weight: 600; border-color: currentColor; }
  .overview { gap: 0 12px; padding: 8px 0 0; }
  .overview .period { justify-content: end; min-height: 0; }
  .overview .period-name { min-height: 32px; display: grid; align-items: center; }
  .overview .period:first-child { min-height: 44px; }
  .year-plot, .plot { width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: end; border-bottom: 1px solid var(--rule); }
  .year-plot { width: 58px; height: 45px; }
  .clear { margin-left: auto; text-decoration: underline; text-underline-offset: 3px; }
  .months { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); }
  .bucket { display: flex; flex-direction: column; align-items: center; min-width: 0; padding: 0; }
  .plot { height: 49px; }
  .count { font-size: 11px; line-height: 15px; }
  .bar { width: 62%; max-width: 68px; background: var(--edge); border-radius: 2px 2px 0 0; }
  .label { padding: 5px 0; font-size: 13px; }
  .bucket[aria-pressed='true'] { color: var(--ink); font-weight: 650; }
  .bucket[aria-pressed='true'] .bar { background: var(--ink); }
  @media (hover: hover) {
    button:hover:not(:disabled) { color: var(--ink); }
    .period:hover:not(:disabled) .bar, .bucket:hover:not(:disabled) .bar { background: var(--ink); }
    .bucket:hover:not(:disabled) { background: var(--hover); }
  }
  @media (max-width: 600px) {
    .months { grid-template-columns: repeat(6, minmax(0, 1fr)); row-gap: 3px; }
  }
</style>
