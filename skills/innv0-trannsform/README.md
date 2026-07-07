# innv0-trannsform

Agent skill for document ingestion, normalization, and template-based transformation. The agent orchestrates the full workflow: bootstraps a project, scans raw documents of various formats, normalizes them to Markdown, then transforms the consolidated content using its own LLM guided by user-defined templates.

## How it works

The skill ships with a Node.js CLI tool (`scripts/index.js`) that handles file operations — scanning directories, converting binary formats (docx, pdf, xlsx) to Markdown, and maintaining an ingestion manifest. The actual content transformation (summarization, restructuring, drafting) is done by the agent's built-in LLM, not by an external API.

The workflow is:

1. **Bootstrap** — The agent creates a project directory with `raw/`, `md/`, `traNNsformations/`, and `output/` folders, then copies source files into `raw/`.
2. **Scan & normalize** — The CLI tool reads files from `raw/`, converts supported formats to Markdown in `md/`, and generates an ingestion manifest (`index.md`) plus a consolidated document (`md/_all.md`).
3. **Transform** — The agent reads the consolidated document and the user's chosen template, then generates a transformed output using its own LLM. The CLI tool serves as a fallback if the agent's context is insufficient.

## Installation

Copy this folder to your agent's skills directory:

```bash
# Any agent that scans ~/.agents/skills/
cp -r innv0-trannsform ~/.agents/skills/
```

Dependencies (`mammoth`, `minimist`, `prompts`) are installed automatically by the agent on first use — it detects the missing `node_modules/` directory and runs `npm install` inside the skill folder.

### Requirements

- **Node.js 18+** — Required for the CLI tool. The agent checks availability at runtime.
- **npm** — Bundled with Node.js, used for first-time dependency installation.

## File structure

```
innv0-trannsform/
  SKILL.md                  Agent instructions — the agent reads this to learn the workflow
  package.json              Declares npm dependencies (mammoth, minimist, prompts)
  README.md                 You are here
  scripts/
    index.js                CLI entry point — bootstrap, scan, apply transformations
    scanner.js              Format detection, file conversion (txt, md, csv, json, docx, pdf, xlsx)
    transformer.js          Template listing and fallback heuristic transformation
    config.js               Persistent config (last project path, default directories)
  examples/
    raw/                    Sample source files (BeachBoys.txt, Beatles.txt, RollingStones.txt)
    traNNsformations/       Sample transformation templates
```

## How dependencies are resolved

This skill follows the same pattern used by `anthropics/skills` (the most popular skill repository, 156k GitHub stars): scripts live inside the skill folder, and the agent resolves missing dependencies at runtime.

When the agent executes `node scripts/index.js` and encounters a `MODULE_NOT_FOUND` error, it runs `npm install` in the skill directory. The `package.json` exists to make this a single install command rather than installing each dependency individually. No `node_modules/` is committed to the repository — the `.gitignore` at the repo root excludes `skills/*/node_modules/`.

## Supported formats

| Format | Agent-native | CLI tool (Node.js) |
|--------|-------------|-------------------|
| txt    | ✅ Read directly | — |
| md     | ✅ Read directly | — |
| csv    | ✅ Read directly | — |
| json   | ✅ Read directly | — |
| pdf    | ⚠️ Model-dependent | pdf-parse |
| docx   | ❌ Not available | mammoth |
| xlsx   | ❌ Not available | xlsx |

The agent presents a decision matrix to the user for non-plain-text formats, letting them choose between agent-native reading (may cost extra tokens) or local Node.js conversion.

## Output types

The transformation step produces two kinds of output:

- **Draft** (`_draft.md`) — Includes source citations, revision notes, uncertainty markers, and GitHub-style alert blocks (`[!NOTE]`, `[!WARNING]`, `[!TIP]`). Intended for review.
- **Final** (`_v_0-1-0.md`) — Clean output with semantic versioning. Optionally includes source references.

## For maintainers

### Adding a new format

1. Add the extension to `EXT_OK`, `EXT_PROMPT`, or `EXT_NO` in `scripts/scanner.js`.
2. Add a label to `EXT_LABELS` and a dependency entry to `EXT_DEPS` if needed.
3. Implement the conversion logic in `scanner.js`'s `scanAndProcess` function.
4. Update the capability matrix in `SKILL.md`.

### Updating the SKILL.md

The `SKILL.md` is the primary interface between the skill and the agent. It must remain in English frontmatter (for the skill loader) but the interaction content is in Spanish to match the user's language. When making changes:

- Keep all file paths relative to the skill directory (e.g., `scripts/index.js`, not absolute paths).
- The skill description in frontmatter must include relevant triggers for agent auto-discovery.

## Origin

This skill is part of the [`iNNv0_skills`](https://github.com/innV0/iNNv0_skills) collection at [`skills/innv0-trannsform/`](https://github.com/innV0/iNNv0_skills/tree/main/skills/innv0-trannsform).
