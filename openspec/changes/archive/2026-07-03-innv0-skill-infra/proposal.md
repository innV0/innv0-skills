# Proposal: innv0-skill-infra

## Intent

Make iNNv0_skills self-contained by removing dependency on Gentle-AI conventions. Consolidate state into `.innv0/`, add a custom Node.js registry builder, and strip cross-skill coordination logic + deprecated install options from two project skills.

## Scope

### In Scope
1. **`.atl/` → `.innv0/`**: Move state folder, update `.gitignore` + `openspec/config.yaml`, remove old dir
2. **`scripts/build-registry.js`**: Node.js CLI that scans `skills/`, reads YAML frontmatter, generates `.innv0/skill-registry.md` + `.innv0/.skill-registry.cache.json`
3. **Refactor `innv0-format`**: Remove Source Ingestion Pipeline section (~55 lines, lines 187–241); update frontmatter description
4. **Refactor `innv0-skills-manager`**: Remove Copy install option; keep only Junction/Symlink
5. **`AGENTS.md`**: Document `.innv0/` and build-registry usage
6. **`openspec/config.yaml`**: Fix line 34 — `.atl/` → `.innv0/`

### Out of Scope
- Pipeline orchestrator skill (future), innv0-format sync script fix, registry format changes, tests/CI

## Capabilities

### New Capabilities
None — infrastructure/refactor change with no new spec-level behavior.

### Modified Capabilities
None — no requirements change; only tooling and conventions.

## Approach

**Phase 1** — Migrate `.atl/` to `.innv0/`, update `.gitignore` + config, delete old dir.
**Phase 2** — Create `scripts/build-registry.js` (minimist + fs/path + regex YAML — same pattern as `innv0-trannsform/scripts/index.js`). Scans `skills/<name>/SKILL.md` frontmatter, writes `.md` + `.json` to `.innv0/`.
**Phase 3** — Fix `openspec/config.yaml` line 34 path.
**Phase 4** — Add `.innv0/` and build-registry rules to `AGENTS.md`.
**Phase 5** — Refactor both skills in parallel: strip coordination section from innv0-format; strip Copy option from innv0-skills-manager.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `.atl/` | Removed | Entire dir → `.innv0/` |
| `.innv0/` | New | State dir with registry + cache |
| `scripts/build-registry.js` | New | Custom registry builder |
| `.gitignore` | Modified | `.atl/` → `.innv0/` references |
| `openspec/config.yaml:34` | Modified | Path update |
| `AGENTS.md` | Modified | New rules |
| `skills/innv0-format/SKILL.md` | Modified | Remove ~55 lines |
| `skills/innv0-skills-manager/SKILL.md` | Modified | Remove Copy option |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| innv0-format mirrored from FORMAT — local refactor diverges source | High | Document in AGENTS.md; defer sync script fix |
| build-registry YAML regex misses edge cases | Low | Validate against all 5 project skills |

## Rollback Plan

`git revert` restores atomically. Manual fallback: move `.innv0/` back to `.atl/`, revert config + gitignore, `git checkout` both refactored SKILL.md files.

## Dependencies

- Node.js v22+, `minimist` npm package (both existing from innv0-trannsform)

## Success Criteria

- [ ] `scripts/build-registry.js` runs clean and produces valid `.md` + `.json` in `.innv0/`
- [ ] `.atl/` no longer exists in repo
- [ ] `.gitignore` + `openspec/config.yaml:34` reference `.innv0/`
- [ ] `AGENTS.md` documents `.innv0/` and build-registry workflow
- [ ] `innv0-format/SKILL.md` has no Source Ingestion Pipeline section
- [ ] `innv0-skills-manager/SKILL.md` offers only Junction/Symlink
- [ ] Total changed lines ≤ 270 (under 800 budget)
