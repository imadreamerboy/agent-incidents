# Incident data contract

**Status:** implemented in `src/lib/content/schema.ts` and `src/lib/server/content.ts`. Production records live in `content/incidents/`, one JSON file per incident, validated with Zod at build time. The published curated collection follows [the collection decisions](collection.md); fictional fixtures remain in `tests/fixtures/`.

## Dates represent different facts

- **Incident date:** when the event happened, at the precision supported by evidence.
- **First reported date (`reportedDate`):** the earliest located, supported public report of the incident. It remains incident metadata, supported by `reportedDateSourceId`.
- **Source publication date (`sources[].publishedDate`):** the release date of each individual report or link. The reporting timeline uses this date, so later research appears at its own release date. Neither date is the day this website added a record.
- **Event date (`events[].date`):** when a smaller step within an incident happened. It neither changes the parent incident's date nor the release date of evidence describing it.
- **Record update:** when the site’s own record changed; store independently if needed.

Store exact calendar dates as `YYYY-MM-DD` strings and validate actual calendar validity. Avoid converting date-only values through local time zones. A day has no invented time or time zone; preserve a source timestamp separately if it matters.

## Suggested record fields

| Field | Shape and rule |
| --- | --- |
| `id` | Unique stable slug; filename matches ID |
| `title` | Concise non-empty title |
| `summary` | Plain-text account, normally one or two sentences |
| `context` | Required: `external-deployment`, `internal-deployment`, `training`, `evaluation`, `mixed` or `unknown`; classify the originating task, not the affected system |
| `contextEvidence` | Optional concise explanation of the authored context and its uncertainty |
| `providerIds` | Non-empty array of unique IDs from the shared organisation registry; explicit `unknown` when unidentified |
| `evaluatorIds` | Optional array of unique, known evaluator IDs from the same registry; omission means an empty list; `unknown` is not a valid evaluator |
| `incidentDate` | Discriminated union described below |
| `reportedDate` | Valid exact calendar date |
| `reportedDateSourceId` | ID of a source in this record supporting the reporting date |
| `sources` | Non-empty list of source objects |
| `events` | Optional list of smaller events; omission means an empty list |

Each source has a record-local unique `id`, descriptive `label`, `publisher`, absolute HTTP(S) `url`, `kind` from the source-type list below, and `publishedDate` when known. Date evidence should be recorded in a short note when the relationship is not obvious. A source publication date must not be inferred from a URL or a page’s last-modified field alone.

Source URLs must be absolute HTTP(S) links. Preserve authored paths, queries and fragments; changing a URL can change the cited evidence. The website has no URL lookup or research-database dependency.

Source labels must describe what the link opens. Multiple sources may support different parts of the account; do not equate the existence of a link with verification of every claim.

## Incident-date union

| `kind` | Fields | Display and placement |
| --- | --- | --- |
| `exact` | `date`, `sourceIds` | Formatted date; ordered by `date` |
| `month` | `month` as `YYYY-MM`, `sourceIds` | Month and year; ordered by an internal first-of-month boundary |
| `range` | `start`, `end`, `sourceIds` | Visible range; ordered by `start` |
| `approximate` | `label`, `sourceIds`; optional `sortDate` | Evidence-based wording; ordered by `sortDate` when supplied, otherwise in the final unknown-date section |
| `unknown` | No invented date value | `Unknown`; unknown-date section |

`sourceIds` refer to sources within the same record and are required for known or imprecise date claims. Validate that date ranges are ordered. Month-start boundaries are internal ordering values, never displayed as exact occurrence dates. `sortDate` must be a valid `YYYY-MM-DD` calendar date; it is an editor-chosen chronology anchor, not a replacement for `label`. Explain its interpretation in `evidenceNote` and support it with the existing `sourceIds`. Labels are never parsed to manufacture anchors. An upper-bound reference may be used explicitly if the label and evidence note explain it; it must not be displayed as an exact occurrence day.

## Two timeline views

- **Incident date:** one entry per incident, with every source listed together. All anchored dates share a continuous newest/oldest chronology using the values above. Equal anchors use first-reported date in the selected direction, then stable ID. Unknown dates and approximate dates without `sortDate` remain in a final `Incident date unknown` section, ordered by first-reported date and stable ID within that section. A reporting date is never substituted as an incident-date anchor.
- **Reporting date:** one entry per source, grouped by its own publication date. All sources released on the same day share a date group; ties use incident ID and source ID. Date groups follow the selected order. Sources without a publication date remain visible in a final `Publication date unknown` group and never inherit an incident's first-reported date.

For example, an incident occurring in September with an official report on 18 September and independent research on 18 November appears once with both links in incident view, and twice on those publication dates in reporting view. Additional links are appended to the same `sources` array, not represented as duplicate incidents. Reporting counts distinguish sources from unique incidents.

## Source types

Each source has a small monochrome icon and an explicit text label. Types describe the destination, not its reliability or whether its claims are verified.

| `kind` | Display label |
| --- | --- |
| `official-report` | Official report |
| `independent-research` | Independent research |
| `news-article` | News article |
| `paper` | Paper |
| `video` | Video |
| `repository` | Repository |
| `discussion` | Discussion |
| `other` | Other source |

Unknown kind values fail validation. Use `other` deliberately for a reviewed source that fits none of the listed categories.

## Events within an incident

Use `events` for steps in the incident: a task starting, an action occurring, access being revoked or another supported development. A newly published report belongs in `sources`; it does not need to be duplicated as an event just to appear in reporting view.

| Event field | Rule |
| --- | --- |
| `id` | Stable slug, unique within its incident |
| `title` | Short, non-empty event title |
| `summary` | Non-empty plain-text account of this step |
| `date` | The same exact, month, range, approximate or unknown union as `incidentDate` |
| `sourceIds` | Non-empty, unique references to this incident's sources |

For known or imprecise event dates, `date.sourceIds` must also appear in that event's `sourceIds`. Unknown dates still require sources supporting the event itself. Event IDs, dates and references are checked at build time. Events do not automatically determine the parent's incident date or first-reported date.

The incident entry shows a native expandable timeline when events exist. All anchored events are ordered earliest-first using the same date rules, with authored order retained for equal anchors. Only events without an anchor appear in a final `Event date unknown` section, retaining authored order. The main timeline's ascending/descending setting does not reverse this local sequence.

An event link uses `#event--<incident-id>--<event-id>` and opens its enclosing timeline after hydration. Citations point to the incident's visible source list, using `#source--<incident-id>--<source-id>`. Reports use `#report--<incident-id>--<source-id>` in reporting view. Source numbering follows the record's source order.

## Illustrative shape

This example demonstrates the structure only. A [copyable JSON template including events](examples/incident.json) is also available. `example.invalid` is a deliberately non-resolving placeholder; these records are not real incidents and must not be included in a production dataset.

```json
{
  "id": "example-incident-a",
  "title": "Example incident A",
  "summary": "Illustrative placeholder, not a real incident.",
  "context": "unknown",
  "providerIds": ["example-provider"],
  "incidentDate": {
    "kind": "exact",
    "date": "2026-09-12",
    "sourceIds": ["example-statement"]
  },
  "reportedDate": "2026-09-18",
  "reportedDateSourceId": "example-statement",
  "sources": [
    {
      "id": "example-statement",
      "label": "Example statement",
      "publisher": "Example provider",
      "kind": "official-report",
      "url": "https://example.invalid/statement",
      "publishedDate": "2026-09-18"
    },
    {
      "id": "example-research",
      "label": "Independent analysis of the same incident",
      "publisher": "Example researchers",
      "kind": "independent-research",
      "url": "https://example.invalid/research",
      "publishedDate": "2026-11-18"
    }
  ]
}
```

Keep any implementation fixtures separate from the real collection. The production content check must reject known placeholder records, placeholder providers and placeholder source hosts. Structural validation cannot prove source accuracy; editorial review is still required.

## Provider and evaluator registry

`content/providers.json` is the shared organisation registry. Membership alone does not assign a role: incidents reference it through `providerIds` and, where supported, `evaluatorIds`. Keep an unidentified third-party model under `providerIds: ["unknown"]` even when its evaluator is known. Both timeline views label an explicit evaluator separately from the model provider. Existing operator attributions, such as Meta’s internal agent, remain qualified by their summaries.

Filters match either role using a union, with each incident and source counted once. Organisations appearing only as evaluators have an “(evaluator)” suffix in the filter. The existing `providers` URL parameter and `ViewState.providerIds` name are retained for shared-link compatibility; their selections now include evaluator IDs. For example, `?providers=tencent` selects Tencent’s evaluations without attributing the model to Tencent.

Each organisation has a stable `id`, display `name` and optional local `logoPath`. Validate all provider and evaluator references. A missing logo does not imply a missing provider: render its name. Do not invent a logo. `unknown` must have an explicit display name such as `Unknown provider` and no fabricated affiliation.

## Build failures and editorial review

Fail the content build on duplicate IDs, invalid calendar dates, broken internal source/provider/evaluator references, absent sources or malformed URLs. Do not silently drop offending records. Keep error messages tied to a file and field.

A transient external-link failure should produce a review report, not deletion of an incident or a silently substituted source. Source accuracy, incident identity and the earliest report date need human or agent evidence review beyond schema validation.

Do not enforce `reportedDate >= incidentDate` as a universal rule: a source may report an ongoing incident whose end comes later. Flag surprising chronology for evidence review and retain supported values.

## Collection membership

The current local selection contains 29 parent incidents, including the explicitly requested 2026 image-upload disclosure with an unknown occurrence date. Follow [the accepted collection decisions](collection.md), including grouped wiki/Australia and Irregular events and the PocketOS, DataTalks.Club, Grok/Bankr, Grok Build and OpenClaw gym exclusions. The OpenAI catalogue expansion includes selected 2025 occurrences and controlled training cases. Other additions still require an editorial decision. Membership is determined by that decision, never by the visitor's active chronology mode.

## Implemented optional fields

`updatedDate` records a valid calendar date independently of event chronology. Approximate incident and event dates accept an optional valid calendar `sortDate` for ordering; other date variants reject this field. `reportedDateEvidence`, date-variant `evidenceNote` (except unknown), and source `evidenceNote` accept public plain-text evidence notes. Extra fields fail validation. The referenced reporting source requires `publishedDate`, matching `reportedDate`; this is a contract check, not independent verification of the earliest report. Keep private working notes outside these records.


## Execution context

Context is explicitly authored in every incident. A controlled evaluation that affects a live third-party service remains `evaluation`; impact on an external system does not establish external deployment. `mixed` is reserved for a report explicitly covering multiple contexts, such as simulated training and evaluation examples. `unknown` preserves gaps or unresolved alternatives rather than assigning a likely context.

The initial classification follows the reviewed record prose. Wiki activity remains `unknown` because training versus evaluation is unresolved, even though the grouped Australian events have attributed research/training descriptions. RubyGems and the May Hugging Face activity have unspecified originating contexts. The 53 image uploads also remain `unknown`: “research agents” alone does not establish training, evaluation or deployment. These fields do not change inclusion, chronology or provider attribution.
