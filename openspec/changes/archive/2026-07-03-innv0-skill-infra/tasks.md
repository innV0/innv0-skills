# Tasks: innv0-skill-infra

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150 |
| 800-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
800-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All 6 deliverables | PR 1 | Single PR, ~150 lines, under 800 budget |

## Phase 1: Foundation — State Directory Migration

- [x] 1.1 Create `.innv0/`; move `.atl/skill-registry.md` and `.atl/.skill-registry.cache.json` into it with identical content
- [x] 1.2 Update `.gitignore`: `.atl/` → `.innv0/` reference
- [x] 1.3 Delete `.atl/` directory (filesystem + git tracking)

## Phase 2: Registry Builder Script

- [x] 2.1 Create `scripts/build-registry.js` with manual `process.argv` parsing (`--root`, `--output`, `--help`, `--version`)
- [x] 2.2 Implement: scan `skills/<name>/SKILL.md`, regex-parse YAML frontmatter (`---` blocks), extract `name`, `description`, `triggers`
- [x] 2.3 Error handling: stderr warning on missing/malformed frontmatter (skip skill, continue); exit code 1 on unwritable output dir
- [x] 2.4 Fingerprint: `crypto.createHash('md5')` over `<dirName>:<mtimeMs>` for all `skills/*/SKILL.md`
- [x] 2.5 Generate `.innv0/skill-registry.md` (Markdown table) and `.innv0/.skill-registry.cache.json` (fingerprint + timestamp)
- [x] 2.6 Verify: run script, confirm both output files exist with correct content

## Phase 3: Skill Refactors

- [x] 3.1 **innv0-format**: Remove `traNNsform` coordination line from frontmatter `description`
- [x] 3.2 **innv0-format**: Delete `## Source Ingestion Pipeline` section (lines 187–241); bump `version` to `V_0-1-2`
- [x] 3.3 **innv0-skills-manager**: Remove `[c] Copy` menu option, Copy-Item block (step 3), "Copy" from Type column header
- [x] 3.4 **innv0-skills-manager**: Update description to "via junction (recommended) or symlink"; bump `version` to `V_1-0-1`

## Phase 4: Documentation & Config

- [x] 4.1 **AGENTS.md**: Add section documenting `.innv0/` state directory purpose and contents
- [x] 4.2 **AGENTS.md**: Add usage instructions for `node scripts/build-registry.js`
- [x] 4.3 **openspec/config.yaml**: Line 34 — `.atl/` → `.innv0/` in archive rule

### Verification Checklist (manual)

| Deliverable | How to verify |
|-------------|---------------|
| `.atl/` → `.innv0/` | `.atl/` gone; `.innv0/` has registry files; `git status` clean |
| build-registry.js | Run script — both `.innv0/` files generated; re-run — no crash |
| innv0-format refactor | No `## Source Ingestion Pipeline` heading; no `traNNsform` in description |
| innv0-skills-manager refactor | No `[c] Copy` in menu; no `Copy-Item` block; description says "junction or symlink" |
| AGENTS.md | `.innv0/` section + build-registry instructions present |
| config.yaml | Line 34 references `.innv0/skill-registry.md` |
