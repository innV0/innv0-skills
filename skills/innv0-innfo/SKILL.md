---
name: innv0-innfo
version: "V_2-0-0"
last_updated: 2026-07-07
metadata:
  source_type: "original"
  mcp: "innfo-mcp"
license: MIT
description: |
  MANDATORY trigger: MUST activate this skill whenever the user is creating, editing, validating, or discussing any iNNfo model, template, specialization, sample, or specification file.
  This includes but is not limited to:
  - Creating or editing any file matching *_NN.md or *_FORMAT.md
  - Authoring or modifying business models, procedure models, or any model following an iNNfo template
  - Creating, editing, or modifying templates or specializations under docs/templates/
  - Discussing the iNNfo specification, concepts, markers, matrices, or naming conventions
  - Generating dashboard renderers for templates
  - Any conversation about how iNNfo works, how to use it, or how to structure iNNfo files
---

# iNNfo Skill

> **ACTIVATION = GREETING REQUIRED**: When this skill is loaded, the agent MUST introduce itself to the user before doing anything else. See Greeting Protocol below.

This skill guides LLMs and agents in authoring, editing, and validating **iNNfo-compliant files** (V_0-2-0+ with `_NN` structural markers).

**Resolution, validation, and mutation are delegated to the `innfo-mcp` server** — a deterministic engine wrapping `@innv0/innfo-core`. The agent does NOT hand-resolve spec chains or hand-validate models when the MCP is available. See §1 (MCP Operating Model) and §7 (Delegation Contract).

## Greeting Protocol (MANDATORY)

When this skill is activated, the agent's VERY FIRST response MUST begin by introducing itself — in the user's language — as the iNNfo skill, and stating the capabilities relevant to the current request (e.g. authoring a model, validating, resolving a template). Session-scoped: only once per conversation.

---

## Core Concepts

### Specification Stack (defiNNe)

| Level | Role | File Pattern | Example |
|-------|------|-------------|---------|
| 0 | Meta-specification | `*_NN.md` | `defiNNe_V_0-1-1_NN.md` |
| 1 | Concrete specification | `*_NN.md` | `iNNfo_V_0-2-0_NN.md` |
| 2 | Template | `*_NN.md` | `business_V_0-1-1_NN.md` |
| 3 | Model | `*_NN.md` | `Ghostbusters_V_0-1-2_business_NN.md` |

### Templates vs Specializations

- **Template** (level 2): Declares concepts, markers, matrices. Published under the spec repo at `specs/.../level2/<name>/`.
- **Specialization** (level 2): Self-contained template derived from an official one. Fully autonomous.

### Naming Convention (defiNNe §6)

| Type | Pattern | Example |
|------|---------|---------|
| Official template | `<Template>_V_x-y-z_NN.md` | `business_V_0-1-1_NN.md` |
| Level 3 model | `<Model>_V_x-y-z_<Template>_NN.md` | `Ghostbusters_V_0-1-2_business_NN.md` |
| Workflow | `<Name>_V_x-y-z_workflow_NN.md` | `example_V_1-0-0_workflow_NN.md` |
| Source | `<Name>_source_NN.md` | `transcript_source_NN.md` |

> **Note:** Historical documents use `_FORMAT.md` (V_0-1-0) or `_F.md` (V_0-1-5 transitional). Current iNNfo V_0-2-0+ uses `_NN.md`.

### Structural Markers

iNNfo V_0-2-0 uses `_NN` as the structural marker prefix. Two forms are valid:

| Form | On `#` heading | On `*` list item |
|------|----------------|-----------------|
| **Visible** | `# _NN ConceptName` | `* _NN ConceptName: Element Name` |
| **Hidden** | `# <!-- _NN --> ConceptName` | `* <!-- _NN ConceptName: --> Element Name` |

The hidden form wraps the marker in an HTML comment so it is invisible when rendered.

---

## 1. MCP Operating Model

The `innfo-mcp` server exposes six tools. It is **publisher-agnostic**: it never stores spec/template URLs or template names internally. A spec/template is resolved ONLY from a URL you supply, or from a loaded model's `parent_spec.url` (the model is the source of truth).

| Tool | Purpose | Key arguments |
|------|---------|---------------|
| `list_models` | Scan a directory for iNNfo models | `root?` |
| `read_model` | Parse a model into structured JSON | `id` |
| `get_spec` | Resolve the level-1 iNNfo spec | `url?` **or** `model_id?` |
| `get_template` | Resolve a level-2 template | `url?` **or** `model_id?` (optional `name`) |
| `validate_model` | Validate against the resolved template | `id?` / `content?` (+ optional `template_url`) |
| `apply_change` | Mutate a model and re-validate | `id`, `op`, `args` |

**Golden rule:** the URL always comes from the user or from the model. Never invent or hardcode a spec/template URL when calling the MCP.

### `apply_change` operations

`op` ∈ `add_concept | add_field | set_marker | add_element | remove_element`. Semantics: parse → mutate → serialize → **validate → reject-without-writing on failure**. Renaming is NOT an `apply_change` operation — use the Rename Safety procedure (§5) then `validate_model`.

---

## 2. Canonical Specification Index (stable URLs)

Use these **stable `latest` URLs** for human reference and authoring guidance. They always point to the current published version:

- **defiNNe** (level 0): `https://raw.githubusercontent.com/innV0/cogNNitive/main/specs/latest/level0/defiNNe_NN.md`
- **iNNfo** (level 1): `https://raw.githubusercontent.com/innV0/cogNNitive/main/specs/latest/level1/iNNfo_NN.md`
- **Business** (level 2): `https://raw.githubusercontent.com/innV0/cogNNitive/main/specs/latest/level2/business/business_NN.md`
- **Procedures** (level 2): `https://raw.githubusercontent.com/innV0/cogNNitive/main/specs/latest/level2/procedures/procedures_NN.md`
- **Catalog** (level 2): `https://raw.githubusercontent.com/innV0/cogNNitive/main/specs/latest/level2/catalog/catalog_NN.md`

> **Stable vs immutable:** `latest/` URLs are convenience aliases that move with each release — use them for authoring guidance. A level-3 model's own `parent_spec.url` MUST pin an **immutable** versioned URL (e.g. `.../specs/v0.1.0/level2/business/business_V_0-1-1_NN.md`) so validation is reproducible. The MCP resolves whatever URL the model declares.

---

## 3. Frontmatter by Level

**Level 0 (defiNNe):**
```yaml
---
specification_version: "V_0-1-1"
specification_url: "<immutable-url>"
level: 0
title: "..."
status: "Draft | Stable | Deprecated"
---
```

**Level 1 (iNNfo):**
```yaml
---
spec_version: "V_0-2-0"
spec_url: "<immutable-url>"
level: 1
parent_spec: { name: "defiNNe_V_0-1-1", url: "<immutable-url>" }
title: "..."
---
```

**Level 2 (Template):**
```yaml
---
spec_version: "V_0-2-0"
spec_url: "<immutable-url>"
level: 2
parent_spec: { name: "iNNfo_V_0-2-0", url: "<immutable-url>" }
title: "..."
concepts: [...]
markers: [...]
matrices: [...]
relationship_declarations: {...}
---
```

**Level 3 (Model — lightweight, NO template inline):**
```yaml
---
spec_version: "V_0-2-0"
spec_url: "<immutable-url>"
level: 3
parent_spec: { name: "<template>_V_x-y-z", url: "<immutable-url>" }
model_version: "V_x-y-z"
title: "..."
asset_mode: "centralized"    # optional, default "centralized"
---
```

### Body rules

- **Document Notice (Required)** — the first body content MUST be:
  ```markdown
  > [!NOTE]
  > This is a **iNNfo document** — a plain-text Markdown file that carries its own schema in the YAML frontmatter.
  ```
- **Index Block** — `# _NN index` followed by nested Markdown lists (WikiLinks `[[...]]`, Markdown links, or `_NN index:` syntax).
- **Concept Blocks** — `# _NN <ConceptName>` (visible) or `# <!-- _NN --> <ConceptName>` (hidden).
- **Element Lines** — `* _NN <ConceptName>: <Element Name>` with optional indented YAML fields.
- **Matrices** — `# _NN matrices: <matrix-name>` followed by a Markdown table.

### Concept Types

| Type | Syntax | Description |
|------|--------|-------------|
| `text` | Free-form Markdown | Single block of content |
| `weight` / `list` | Bullet list with `_NN` markers | Multi-instance with optional YAML |
| `category` | No content block | Taxonomy-only |
| `steps` / `sequence` | Ordered bullet list | Ordered sequence |

---

## 4. Operational Instructions (MCP-first)

### Generate a model
1. Obtain the template: `get_template({ url })` with the user-provided template URL (or `{ model_id }` if extending an existing model). If none is given, offer the templates from §2.
2. Parse the returned concepts/markers/matrices and author the model body with `_NN` markers.
3. Set the model's `parent_spec.url` to the **immutable** template URL.
4. Validate before finishing: `validate_model({ content })` (inline) or `validate_model({ id })` (on disk).

### Validate a model
- Call `validate_model({ id })` or `validate_model({ content })`. The template is resolved from the model's `parent_spec.url`.
- If the model has no resolvable `parent_spec.url`, either pass `template_url` explicitly or accept the structural-only result — which carries a `warning`: *"No template resolved; structural validation only."* Surface that warning to the user; do not present structural-only validation as full compliance.
- Report `valid`, `errors[]`, and `warnings[]` faithfully. Do NOT declare a model valid if `valid` is false.

### Edit a model
- For supported mutations use `apply_change({ id, op, args })`. It re-validates and refuses to write an invalid result.
- For renaming, follow §5 (Rename Safety), then `validate_model`.

### Inspect
- `list_models({ root })` to enumerate; `read_model({ id })` to get structured JSON (concepts, elements, matrices, taxonomy).

---

## 5. Rename Safety & Referential Integrity (MANDATORY)

Every concept and element name in an iNNfo document is a globally unique identifier. `apply_change` does not rename — do this manually, then validate.

**If renaming a CONCEPT** update: template `concepts[].name`; template `matrices[].source/target`; concept H1 `# _NN <Name>`; element lines `* _NN <Name>:`; matrix table headers/rows; index block `[[<Name>]]`; all narrative WikiLinks; matrix section names `# _NN matrices: <name>-...`.

**If renaming an ELEMENT** update: the element line label; matrix row/column headers; item-markers matrix first column; all WikiLinks `[[<Old Name>]]`.

**Procedure:** (1) search the ENTIRE document for the old name; (2) classify each occurrence (skip YAML keys, data values, generic prose); (3) update all references preserving `_NN` marker syntax; (4) run `validate_model` and confirm no `[[Old Name]]` remains and every `_NN` marker maps to an existing concept.

---

## 6. Dashboard Renderer (Template Companion Artifact)

A dashboard renderer is an HTML fragment companion to a template, versioned with it at `docs/templates/<templateName>/V_x-y-z/dashboard.html`.

### Syntax — Mustache
Logic-less [Mustache](https://github.com/janl/mustache.js): `{{model.title}}` (escaped interpolation), `{{#concepts}}...{{/concepts}}` (sections), `{{^matrices}}...{{/matrices}}` (inverted). **Prohibited**: triple-mustache `{{{`, partials `{{>`, delimiter change `{{=`.

### Data Exposed
```
model: { title, version, specificationVersion }
template: { name, version, title }
concepts: [{ name, instances: [{ label, fields }] }]
hierarchyConcepts: [{ name, parent? }]
taxonomyEdges: [{ source, target, label? }]
matrices: [{ name, headers[], rows[][] }]
```

### Security Constraints
HTML fragment only. No `<!DOCTYPE>`, `<html>`, `<head>`, `<body>`, `<script>`, `<iframe>`, `<object>`, `<embed>`, `<link>`, `<meta>`, no `on*` attributes, no `javascript:` URIs. All CSS inlined. Images via `data:` URIs only. Max 256 KB.

### Generation Prompt (INVARIANT)
> Genera un archivo HTML sin encabezados ni nada, solo código HTML que represente de la mejor forma posible a nivel visual el modelo cargado, usando los placeholders Mustache definidos en el skill de iNNfo.

---

## 7. Delegation Contract & Fallback

### When the MCP is available (default)
1. **Never hand-roll resolution.** Use `get_spec` / `get_template`.
2. **Never hand-validate.** Use `validate_model` and report its result verbatim.
3. **Prefer `apply_change`** for supported mutations (deterministic, reject-on-invalid).
4. Pass URLs from the user or the model — never a constant.

### When the MCP is unavailable (fallback only)
If the `innfo-mcp` tools are not registered in the runtime, degrade gracefully:
1. Fetch the relevant spec/template on demand from the URL declared in the model's `parent_spec.url`, or from the stable URLs in §2.
2. Resolve the parent chain manually up to level 0, caching under a local `specs/` directory.
3. Validate by hand against the resolved template: frontmatter by level, `_NN` markers, concept headers, element syntax, matrix headers, and the parent chain.
4. Tell the user you are in fallback mode and that validation is not engine-backed.

To enable the MCP, register it in the runtime (OpenCode `.opencode/opencode.json`):
```json
{ "mcp": { "innfo-mcp": { "type": "local", "command": ["node", "scripts/bin/innfo-mcp.bundle.js"], "enabled": true } } }
```

---

## Core Rules

1. **Spec Immutability**: Published specs are frozen. Never edit historical spec files. Change only via new versions.
2. **Spec over Tolerant Code**: Reject invalid models — never silently tolerate non-compliance.
3. **No Backward Compatibility**: Target the CURRENT spec version only.
4. **Template Inline Restriction**: Level 3 models MUST NOT inline `concepts`, `markers`, or `matrices`. They rely on `parent_spec.url` + the resolver.
5. **Language Domain Contract**: Generated artifacts default to English. Conversation follows the user's language.
6. **Referential Integrity on Rename**: Every concept/element name is a globally unique identifier. Update ALL references before renaming (§5).
7. **Engine over Prose**: When the MCP is available, delegate resolution/validation/mutation to it (§7).
