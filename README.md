# Agent incidents

A sourced timeline of unexpected AI-agent actions. Incident dates and reporting dates remain separate; each entry links to its evidence and retains the source's uncertainty.

This repository contains the website and its reviewed content: the timeline, About and methodology, Roadmap, and tip/correction page.

On wide screens, a compact jump rail shows your position in the timeline. In Incidents, each mark previews an entry's title and date. In Reports, each mark previews a publication month and source count, then jumps to that month's first report. Undated sources have a separate mark. The rail follows the selected filters, date view and sort order.

## Run locally

Use Node.js 24 LTS and npm 11, as specified in `.nvmrc` and `package.json`.

```sh
npm ci
npm run dev -- --port 5173 --strictPort
```

Open <http://127.0.0.1:5173/>. All required content is included. No database, research checkout, account or credentials are needed.

```sh
npm run check
npm run check:worker
npm test
npm run build
npx playwright install --no-shell chromium webkit
npm run test:e2e
```

Run builds and browser tests sequentially because SvelteKit uses a shared intermediate output directory. `npm run dev:demo` uses labelled fictional fixtures; `npm run build:demo` writes to `build-demo/`. The production build always uses the reviewed collection in `content/` and writes to `build/`.

## Contribute

Use the issue forms to [correct an entry](https://github.com/imadreamerboy/agent-incidents/issues/new?template=correction.yml), [suggest a case or source](https://github.com/imadreamerboy/agent-incidents/issues/new?template=new-evidence.yml), or [report a website problem](https://github.com/imadreamerboy/agent-incidents/issues/new?template=website.yml).

Read [CONTRIBUTING.md](CONTRIBUTING.md) before editing a record. Suggestions are reviewed before publication. For material that should not appear in a GitHub issue, email [agent-incidents@jowimo.com](mailto:agent-incidents@jowimo.com).

## Structure

- `content/incidents/`: one reviewed JSON record per incident.
- `content/providers.json` and `content/site.json`: provider/evaluator names and the explicit editorial update date.
- `src/`: static SvelteKit application and strict content validation.
- `tests/`: validation, chronology and browser checks; fictional examples are separate from published records.
- `docs/`: [content contract](docs/data-contract.md), [collection decisions](docs/collection.md), and [release boundary](docs/release.md).

The research database, raw captures, candidates and private annotations are maintained separately. They are not inputs to this build. Future query features must use a separately reviewed publication dataset; the website must never receive access to the full research store.

## Hosting

The site builds to static HTML and assets. `npm run preview:static` serves the build locally with Cloudflare's static-asset routing and real 404 responses. The checked-in configuration has no Cloudflare account, production routes or database binding. GitHub Actions checks changes; it does not deploy.

The website lives at [agent-incidents.com](https://agent-incidents.com/). The previous subdomain, [agent-incidents.jowimo.com](https://agent-incidents.jowimo.com/), and the www alias redirect there, preserving paths and query strings. See [release operations](docs/release.md) for deployment and verification.

## Licences

Code is licensed under [MIT](LICENSE). Original editorial text, documentation and timeline data are licensed under [CC BY 4.0](LICENSE-CONTENT). See [LICENSING.md](LICENSING.md) for scope and attribution. Linked sources, quotations and third-party marks retain their own rights.
