# M²E² Data Insight Center

M²E² Data Insight Center is the public, GitHub Pages-first intelligence site for M²E² recurring insight publications. It organizes daily, weekly, and monthly material into one source-driven hub instead of publishing isolated report pages.

Production URL:

```text
https://superqyl.github.io/mee-insight-hub/
```

## Positioning

The site covers five shared tracks:

- MEE self-evolution
- Personal cognition and insight
- Product and business opportunities
- News and market hotspots
- Reference source index

All source groups feed the same evidence system. News, research, GitHub, Product Hunt, private collection signals, quantitative research, official policy sources, and community discussions can serve any track when the evidence supports it.

## Default Publishing Strategy

GitHub Pages is the default publication path.

Vercel and Feishu remain available only as explicit opt-in backends:

```bash
./scripts/publish-site.sh                 # GitHub Pages only
./scripts/publish-site.sh --with-vercel   # GitHub Pages + Vercel fallback
./scripts/publish-site.sh --with-feishu   # GitHub Pages + Feishu export hook
```

The default path must not create Feishu documents or Vercel deployments.

## MEE Generation Commands

From the MEE repository:

```bash
node tools/mee radar site --cadence daily --from 2026-05-30 --to 2026-05-30 --out /Users/michael/ai/projects/mee-insight-hub
node tools/mee radar site --cadence weekly --week 2026-W22 --out /Users/michael/ai/projects/mee-insight-hub
node tools/mee radar site --cadence monthly --month 2026-05 --out /Users/michael/ai/projects/mee-insight-hub
```

Optional backends require explicit flags:

```bash
node tools/mee radar site --cadence daily --from 2026-05-30 --to 2026-05-30 --out /Users/michael/ai/projects/mee-insight-hub --with-vercel
node tools/mee radar site --cadence daily --from 2026-05-30 --to 2026-05-30 --out /Users/michael/ai/projects/mee-insight-hub --with-feishu
```

## Content Model

The canonical site payload is:

```text
public/data/site-content.json
```

It contains:

- `signals`: daily deltas and unresolved questions
- `theme_clusters`: weekly clusters across repeated signals
- `theses`: monthly stable judgments and strategy suggestions
- `tracks`: the five topic channels
- `evidence_clusters`: cross-period evidence groups
- `publications`: generated daily/weekly/monthly artifacts
- `source_groups`: unified data-source groups and trust boundaries

## Period Organization

Daily, weekly, and monthly content are not duplicated blindly.

- Daily: new signals, first-pass judgments, and open questions.
- Weekly: repeated signals are rolled up into clusters and priorities.
- Monthly: cross-week clusters become stable theses and strategy suggestions.

Each item should keep a stable `insight_id` or `evidence_cluster_id` so later periods can reference it instead of copying the full earlier text.

## Privacy Boundary

The public site must not include:

- Feishu private document tokens or private chat links
- Feishu internal media URLs
- local absolute paths
- private message bodies
- private source-index documents

It may include public titles, public URLs, short summaries, statistics, trust boundaries, and safe source-group labels.

## Local Preview

```bash
python3 -m http.server 4173
open http://127.0.0.1:4173/
```

## GitHub Pages Settings

Use:

```text
Repository: superqyl/mee-insight-hub
Branch: main
Source: root
```
