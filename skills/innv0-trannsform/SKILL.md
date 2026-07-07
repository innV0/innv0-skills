---
name: innv0-trannsform
description: "Bootstrap projects, scan raw documents, normalize them to Markdown, and apply template-based transformations. Includes a Node.js CLI tool for document ingestion, format conversion (txt, md, csv, json, docx, pdf, xlsx), and transformation orchestration. Uses the agent's own LLM for the actual content transformation. Triggers: trannsform, transform, normalize, scan documents, document ingestion, document transformation, document processing, markdown conversion, project bootstrap"
license: MIT
metadata:
  version: "1.1"
  source_type: "integrated"
  source: "https://github.com/innV0/iNNv0_skills/tree/main/skills/innv0-trannsform"
  installed_at: "2026-06-27"
---

# Skill: innv0-trannsform

This skill enables the agent to interactively guide the user through document ingestion, normalization, and transformation.

All file paths in this skill are relative to the skill's base directory (e.g., `~/.agents/skills/innv0-trannsform/`). The CLI tool lives at `scripts/index.js`. If dependencies are missing at first use, the agent detects the error and runs `npm install` in the skill directory automatically.

## Interaction Flow for Agent Execution

### 1. Project Initialization & Bootstrap

Ask the user:
1. **Source Folder**: Where are the raw files?
2. **Project Name & Destination**: Name for the project and where to save it (recommend `Documents/traNNsform/[project-name]`).

Then run:
```bash
node scripts/index.js --src "<source-folder>" --dest "<destination-parent-folder>" --name "<project-name>"
```

### 2. Capability Scan & Ingestion

> **Philosophy**: Each agent/model has different native capabilities. Some read PDFs directly, others don't. Instead of assuming, the skill presents a **diagnostic panel** with the available routes and their tradeoffs, and the user decides.

#### 2a. Detect formats in source folder

Supported formats: `txt`, `md`, `csv`, `json`, `docx`, `pdf`, `xlsx`

Read the `raw/` folder, group files by extension, and show the user:
```
Formats detected in source folder:
  - txt:  3 files
  - docx: 2 files
  - pdf:  1 file
```

#### 2b. Capability Assessment — Present the decision matrix

**IMPORTANT**: Before asking what to do, present this diagnostic table for each detected format. The goal is for the user to SEE the complete picture.

```
╔════════════╦══════════════════════╦══════════════════════════╗
║  Format    ║ Agent-native         ║ Node.js Library          ║
╠════════════╬══════════════════════╬══════════════════════════╣
║ txt        ║ ✅ Direct read       ║ —                        ║
║ md         ║ ✅ Direct read       ║ —                        ║
║ csv/json   ║ ✅ Direct read       ║ —                        ║
║ pdf        ║ ⚠️  Model-dependent  ║ pdf-parse (npm)          ║
║ docx       ║ ❌ Not available     ║ mammoth (npm)            ║
║ xlsx       ║ ❌ Not available     ║ xlsx (npm)               ║
╚════════════╩══════════════════════╩══════════════════════════╝
```

Then, for each detected format **that is NOT plain text**, present the user ONE unified question per format:

```
Format: PDF (1 file)
  [a] Agent-native — may or may not work depending on the model, variable token cost
  [b] Node.js (pdf-parse) — one-time install (~2MB), local processing, no extra token consumption
  [c] Skip this format

Which route do you prefer for PDF? (a/b/c)
```

**Rules for the agent when presenting this:**

1. **Clear visual indicator**: If the agent knows (from its own configuration or because it asked earlier) that it CAN read PDF natively, show `[a]` as `✅ RECOMMENDED` if it incurs no extra cost, or `⚠️ Native (token cost)` if the cost is significant.
2. **If the agent DOES NOT KNOW** if it can read the format natively, say so explicitly: _"I cannot guarantee that my model reads PDFs natively. The most reliable option is [b]."_
3. **Option `[a]` MUST ALWAYS clarify the token tradeoff** (or processing time) when applicable.

#### 2c. Verify Node.js availability

For option `[b]`, check availability before asking. If Node.js is not available, show the option as `❌ Not available`:

```bash
node --version
```

If the command fails or no shell is available, report: _"I cannot verify if Node.js is installed in this environment. If you know you have it, let me know and I'll try."_

#### 2d. Execute the chosen strategy

Depending on the user's decision for each format:

- **Option `[a]`**: Read the file directly using the agent's read capabilities (Read tool, native PDF, etc.). The agent transforms the content to Markdown manually.
- **Option `[b]`**: If the library is not installed, ask for confirmation and run `npm install <package>` in the skill folder (base directory). Then run the conversion script.
- **Option `[c]`**: Skip the format.

**Installation note**: If the user chooses to install a library and it fails (permissions, network, environment), report the exact error and offer to return to the options menu to choose another route.

#### 2e. Run the scan

```bash
node scripts/index.js --scan --src "<target-project-directory>"
```

Read the generated `index.md`. If there are files marked as `?` (docx, pdf) or `NO` (audio, images), inform the user.

### 3. Transformation — Using the Agent's LLM

The skill **does not depend on external APIs** (Gemini, OpenAI). The transformation is performed by the agent itself using its built-in language model. The CLI script `scripts/transformer.js` remains as an optional fallback.

**IMPORTANT**: Before transforming, read the content of `md/_all.md` and ask:

#### 3a. Check for local templates

Check if there are `*traNNsform.md` files in the project root. If there are, ask if they want to use a local one or explore other options.

#### 3b. Select or create a template

If there is no local template or the user prefers another option, ask: **"Do you want to apply an existing transformation or create a new one?"**

- **Apply existing**: Read templates in `traNNsformations/`, list them, let them choose.
- **Create new**: Guide step by step (name, purpose, instructions, structure, location).

#### 3c. Ask version type — BEFORE transforming

Before generating the document, ask:

**"Do you want to generate a draft with comments and source citations for review, or a clean final version?"**

- If they choose **draft**: Generated with all annotations, citations, and review markers (see point 4). File name: `[template-name]_draft.md`.
- If they choose **final version**: Generated clean, without annotations. Also ask: **"Do you want to include source references in the final version?"** File name: `[template-name]_v_0-1-0.md` (semver, starting at 0.1.0).

#### 3d. Perform the transformation (agent does it, not external API)

1. Read the template and `md/_all.md`.
2. Using your own LLM as agent, generate the transformed document following the template instructions and version rules (draft or final).
3. Write the file in `output/` with the corresponding name.
4. Present the result to the user.

If for any reason you cannot generate the content (context too large, etc.), inform the user and offer the CLI transformer.js as fallback:
```bash
node scripts/index.js --apply "<template-name>" --src "<target-project-directory>"
```

### 4. Draft content with source traceability

When the user chooses **draft**, the `_draft.md` file must include:

#### Mandatory header

The document must begin with:

```markdown
# DRAFT FOR REVIEW — NOT FINAL VERSION
```

#### Source citations per claim

Each fact, figure, or conclusion must include a reference to the source document from which it was extracted. Use the source file name (without path) as identifier:

```markdown
La organización tenía 45 miembros activos en 2023.
— Source: IF Narrative GV22BO-1, section IOE.1
```

```markdown
La cobertura alcanzó el 78% de la población objetivo.
— Source: Transcripts T11, interview Etelvina
```

#### Review annotations in Markdown format

Use GitHub Flavored Markdown note blocks:

```markdown
> [!NOTE] Revisar: este dato proviene de una fuente parcial. Contrastar con otras fuentes.
```

```markdown
> [!WARNING] No confirmado en otras fuentes. Verificar con la MML original.
```

```markdown
> [!TIP] Esta conclusión surge del cruce de tres fuentes independientes.
```

#### Uncertainty markers

When a fact is unclear or the source is ambiguous:

```markdown
[unconfirmed data — review]
```

```markdown
[own estimate — cross-check with official sources]
```

```markdown
[approximate date — verify]
```

### 5. Naming Convention Summary

| Type | Suffix | Example |
|------|--------|---------|
| Draft | `_draft.md` | `Summary_Bands_draft.md` |
| Final | `_v_0-1-0.md` | `Summary_Bands_v_0-1-0.md` |
| Final (next version) | `_v_0-2-0.md` | `Summary_Bands_v_0-2-0.md` |
