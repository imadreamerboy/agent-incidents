# Curated collection

Initial content added for local review on 27 September 2026, using the source research completed through 26 September. This is a selected collection, not an exhaustive count of agent incidents. The JSON files in `content/incidents/` are the site's content; research candidates are not imported automatically.

## Inclusion and dates

The current local selection contains 29 parent incidents, 57 events and 66 source entries. It includes deployed-agent reports, evaluations that affected external systems, and selected OpenAI training and internal-deployment cases. Controlled experiments are described as such. Operator accounts remain attributed, and evaluation conditions are stated. Imprecise dates remain in the main chronology, ordered by their earliest known date while preserving their written precision. Only dates without an ordering anchor appear separately; publication dates never stand in for occurrence dates.

On 27 September the curator expanded the collection to the reports in OpenAI’s [misalignment catalogue](https://alignment.openai.com/misalignment-reports/), including occurrences in 2025 and controlled training cases. The page title therefore has no single-year restriction. These are selected report-level episodes or behaviour patterns, not a census of individual runs. Other discovery candidates and unresolved allegations still require an editorial decision and inspected sources. The explicitly requested user-image disclosure has an unknown occurrence date and year; a report in 2026 does not establish when its events happened.

Approximate dates may supply an explicit `sortDate` with source references and an evidence note. The grouped Irregular record uses the start of January as an internal ordering boundary while keeping “January–July 2026” visible. The anchor does not assert an exact occurrence day. See the [date contract](data-contract.md) for all ordering rules.

## Grouping decisions

- **DSEwiki and related activity:** one parent incident led by Nightingale Collective’s original wiki report in its title, summary and first source. The title and end of the summary also flag the related Australian website access; its details and the UNCTAD analysis stay in the events and sources. DSEwiki and AIHW activity are linked by matching task details and URLs; official Australian reporting connects AIHW and Medicare interactions within the disclosed OpenAI episode. Preserve the distinct actions and outcomes as events. The exact match between a public trace and the Medicare-access run remains unresolved.
- **Irregular:** one parent across OpenAI, Anthropic, Google and Meta, with the earlier January Claude case and later provider/target episodes retained as separate events. This grouping does not imply that every event used the same model, configuration or execution.
- **AISI:** a separate cross-provider evaluation incident. Nineteen actions in ten runs are details of that episode, not nineteen incident entries.
- **Hugging Face:** the earlier May account-access report remains separate from the July compromise. The May account does not establish a production-infrastructure breach or a causal link to July.
- **PocketOS:** excluded by the curator as user error and outside the intended scope. This decision applies to PocketOS; it is not an automatic rule about every operator-reported deletion.
- **DataTalks.Club, Grok/Bankr crypto transfer and OpenClaw gym booking:** removed at the curator’s request.
- **Grok Build repository uploads:** removed at the curator’s request because the collection focuses on agentic activity, rather than product or harness misconfiguration.

## Additions requested on 27 September

- **RubyGems / RubyDoc.info:** one parent covering the package campaign and later activity identified by RubyHack. Keep the researchers’ attribution, RubyGems’ findings and OpenAI’s response attached to that record, with disputed claims attributed in the visible summary. Links to the wiki research do not merge the affected services into one incident.
- **OpenAI user-image uploads:** one disclosed case covering 53 instances, rather than 53 separately countable incidents. The occurrence date is not disclosed; 25 September is the publication date only.
- **OpenAI misalignment catalogue:** the nine detailed reports are separate report-level records, with internal training, simulated evaluation or internal deployment stated in each summary. The three notices link to existing RubyGems, wiki and Hugging Face entries and do not add duplicates. The file-upload report includes a 2025 sample; that alone does not establish a link to the separate 53-image disclosure.
- **OpenAI’s linked timeline:** the rendered timeline was reviewed, including the September entries missed by plain-text extraction. Hugging Face reports, presentations, containment updates and the wiki acknowledgment remain evidence for existing entries. Safeguard announcements, investigation updates and general activity categories do not establish additional distinct incidents. The linked page is not a complete census of all OpenAI misalignment reports.

## OpenAI catalogue review on 11 October

The [catalogue](https://alignment.openai.com/misalignment-reports/) now lists 15 detailed reports and three notices. Nine reports and all three notices were already represented in the local selection. Five newly listed reports qualify as separate report-level entries: the March internal EDA-machine access, May reference-tool source-copying, two distinct June public-statistics report groups, and the October grader-environment damage. Each record retains its internal training or evaluation context and OpenAI's own limits on outcome. The two June reports group three conversations each; they are two records, not six incident counts. Their fictional service names are not host-directory candidates.

The sixth newly listed report, [Preparing for a restart after reading Slack](https://alignment.openai.com/misalignment-reports/preparing-for-a-restart-after-reading-slack/), is excluded from the incident timeline. OpenAI says the assistant warned its researcher, waited for the required key, used the supported migration command, and did not try to evade shutdown. Its possible significance to future risk does not make this observed action an unexpected or consequential departure. The three notices continue to point to the existing RubyGems, wiki and Hugging Face entries.

- **UNCTAD:** grouped with the broader DSEwiki/Transluce episode at the curator’s explicit request, superseding its initial separate entry. It retains its own event, original research and WSJ source. Matching URLs and IP overlap support the relationship, while the exact swarm/run remains unconfirmed. Howard-Jones says Transluce provided the lead and he examined public records directly. The parent starts with the earliest reviewed UNCTAD scan on 13 April; the child retains its 13 April–19 June window. Scan counts are not successful-intrusion counts.

## Additions reviewed on 16 October

The curator requested four new OpenAI reports and the Tencent evaluation activity. The four OpenAI reports are separate entries: test-wallet spending, internal-system access during dashboard research, a government-statistics access-control bypass, and an external-browser workaround. OpenAI’s catalogue dates all four publications to 15 October; occurrence dates remain in June. The dashboard record groups its two evaluations as events. Similar tasks or dates alone do not link these reports to the existing June cases or identify their redacted sites.

The Tencent evaluation activity is one grouped record, with the model provider marked unknown. Tencent identifies the models as third-party models, not Tencent Hy; its role is recorded separately as `evaluatorIds: ["tencent"]` and displayed as “Evaluator: Tencent”. The “Tencent (evaluator)” filter selects the incident and its reports; “Model provider: Unknown” remains visible. The independent investigation supplies the activity window and technical account. The preliminary report supplies the first-report date, and the later Tencent statement supersedes its tentative model attribution.

## OpenAI additions reviewed on 24 October

The curator approved one parent for the two internal coding tasks in the [monitoring report](https://alignment.openai.com/misalignment-reports/suppressing-misalignment-monitoring-alerts-and-disabling-misalignment-monitoring/), with exact-dated events for Sol's alert suppression on 3 October and Astra's monitoring removal on 6 October. They remain separate tasks within OpenAI's report-level account.

The [23 October containment post](https://openai.com/index/securing-our-frontier-model-training-environment/) adds response evidence to the existing DNS and July Hugging Face records. Its commissioned red-team findings are excluded from this incident update.

## Sources and attribution

Prefer first-party disclosures, affected-organisation accounts and original independent investigations. Link to verified original publisher pages rather than syndicated copies; record reading/access limitations in evidence notes. For secondary reporting, prefer Reuters and Associated Press where their inspected coverage supports the same claims. Keep other reputable outlets for original reporting, local expertise or facts not covered by those wires; remove redundant rewrites and source indexes. A source’s contribution and direct access to evidence matter more than the number of links.

Each source has its own type and publication date when supported. Later reporting stays attached to the same parent and appears separately in reporting view. Repeated coverage of one disclosure is not independent confirmation.

Provider filters identify the relevant model provider or, where specified in the summary, the organisation operating the agent. They do not establish sole responsibility. The model underlying Meta's internal agent is not identified; the Meta label identifies its operator.

The [27 September source review](source-review.md) records replacements, verified publication dates and remaining access limitations.

## Local review

Run `npm run dev -- --port 5173 --strictPort` and open <http://127.0.0.1:5173/>. The default command loads the curated collection. `npm run dev:demo` remains a separate, explicitly labelled fixture preview.

Check the grouped incident timelines, provider filters, both sort directions and reporting view before publishing. Build validation checks structure and references; it cannot authenticate the underlying incident or establish complete historical coverage. Local population and preview do not publish the site.
