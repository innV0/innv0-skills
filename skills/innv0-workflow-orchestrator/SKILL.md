---
name: innv0-workflow-orchestrator
version: "V_1-1-0"
last_updated: 2026-07-07
metadata:
  source_type: "original"
  compatibility: ">=1.0.0"
license: MIT
description: |
  Meta-skill for orchestrating multi-skill workflows in the iNNv0 ecosystem.
  Reads workflow definitions with iNNfo conventions and coordinates execution
  of child skills (innv0-trannsform, innv0-innfo, etc.) in sequential stages.
  Triggers: workflow, orchestrator, workflow orchestrator, ejecutar workflow, run workflow, coordinar skills
---

# iNNv0 Workflow Orchestrator

> **Meta-skill** — coordinates multi-skill execution sequences from declarative workflow definition files.

---

## Activation Protocol

### Triggers (exact matches)

This skill activates when the user says anything related to:

- `workflow`, `orchestrator`, `workflow orchestrator`
- `ejecutar workflow`, `run workflow`, `coordinar skills`, `run a workflow`
- `execute stages`, `multi-skill workflow`
- A question about chaining skills or running a sequence of transformations

### Activation Flow

1. **Acknowledge** the workflow request
2. **Ask** for the working directory (see §Location Selection Protocol)
3. After location is selected, list available workflows (see §Workflow Discovery)
4. **Ask** the user: "¿Querés usar un workflow existente o crear uno nuevo?"
   - If existing → go to §Existing Workflow Selection
   - If new → go to §Workflow Creation
5. **Proceed** based on the user's choice

---

## Location Selection Protocol

### Default Location

The canonical workflow workspace is `Documents\_NN\` in the user's home directory. This location MUST always be offered as an option.

### Location Options UI

Present options in this order:

```
[1] Indicar una ubicación nueva
[2] D:\Users\lucas\Documents\_NN          ← default, always shown
[3] <most-recent-location-1>               ← from persistence
[4] <most-recent-location-2>               ← from persistence
... (up to 10 recent locations)
```

### Persistence of Recent Locations

Store recent locations in `~/.config/opencode/skills/innv0-workflow-orchestrator/recent-locations.json`.

Format:
```json
{
  "recent_locations": [
    "D:\\Users\\lucas\\Documents\\_NN",
    "D:\\Users\\lucas\\Documents\\_NN\\proyecto-x"
  ]
}
```

- Read this file at the start of Location Selection
- After each workflow execution, update the file with the chosen location (deduplicated, most recent first, max 10 entries)
- If the file does not exist on first use, start with an empty list (only options [1] and [2] shown)

### Persistence of Recent Workflows

Store recently used workflows in `~/.config/opencode/skills/innv0-workflow-orchestrator/recent-workflows.json`.

Format:
```json
{
  "recent_workflows": [
    { "name": "prueba-transform", "path": "D:\\Users\\lucas\\Documents\\_NN\\workflows\\prueba-transform_V_1-0-0_workflow_NN.md", "last_used": "2026-07-07T20-00-00" }
  ]
}
```

- Read this file during Workflow Discovery to show recently used workflows
- After each workflow execution, update the file with the executed workflow (deduplicated by name, most recent first, max 10 entries)
- If the file does not exist on first use, start with an empty list

---

## Workflow Discovery

Runs after Location Selection (step 2 of Activation Flow). The workspace directory is already known.

### Step 1: Read Recent Workflows

Read recent workflows from `~/.config/opencode/skills/innv0-workflow-orchestrator/recent-workflows.json`.

Format:
```json
{
  "recent_workflows": [
    { "name": "prueba-transform", "path": "D:\\Users\\lucas\\Documents\\_NN\\prueba-transform\\prueba-transform_V_1-0-0_workflow_NN.md", "last_used": "2026-07-07T20-00-00" }
  ]
}
```

- If the file exists, extract workflow names and paths as a numbered list
- If the file does not exist, start with an empty recent list

### Step 2: Scan for Workflow Files

Scan the `workflows/` subfolder inside the workspace:
```
<workspace>/
  workflows/
    *_workflow_NN.md
```

Also scan for legacy patterns inside `workflows/`:
```
*_workflow_FORMAT.md
*_workflow_F.md
```

For each matching file:
1. Read the file content
2. Parse the YAML frontmatter
3. Verify `type: innv0-workflow`
4. Extract: `title`, `model_version`

### Step 3: Report Results

Present a combined list: **recent workflows first**, then workflows found in `workflows/` (deduplicated by name).

Format:
```
Workflows recientes:
  1. prueba-transform (V_1-0-0) — Workflow de prueba

Workflows en [workspace]\workflows\:
  2. otro-workflow (V_1-0-0) — Otra descripción
```

- **If workflows found:** present the combined numbered list with `title` and `model_version`
- **If no workflows found:** report "No se encontraron workflows en [workspace]\workflows\ ni en el historial reciente" and offer to create a new one (§Workflow Creation)

---

## Existing Workflow Selection

When the user picks an existing workflow from the list:

1. Load the selected workflow file by path
2. Parse the full content: frontmatter, stages, SkillRefs, ArtifactTypes
3. Report: "Workflow [title] cargado ([model_version]) con [n] stage(s)"
4. Proceed to §Execution Protocol

---

## Workflow Creation

Guide the user through an interactive creation flow.

### Fields to Collect

1. **Workflow name** — short identifier (e.g., `prueba-transform`)
2. **Workflow description** — one-line purpose
3. **Stage list** — ordered stages, one by one:
   - Stage ID / name
   - Description
   - Skill to execute (must be one of the supported skills in §Supported Skills Registry)
   - Template selection (see §Template Selection)
   - Input path selection (see §Path Selection)
   - Output path selection (see §Path Selection)
4. **Repeat** stage collection until the user says "done" or "no more stages"

### Template Selection

When asking about templates:

1. Scan `Documents\_NN\_templates\` for available template files (`*_template_NN.md`)
2. Present the list with descriptions
3. Recommend `info_FORMAT.md` by default (link: https://innfo.2Ns.com)
4. Optionally copy templates from external repos (e.g., `cogNNitive/specs/`)

Available templates are stored in `_templates/` (lowercase, underscore prefix) inside `Documents\_NN\`.

### Path Selection

Use numbered sub-options for input and output:

**Input path:**
- **[1a]** `raw/`
- **[1b]** Otra (especificar nombre de la subcarpeta)

**Output path:**
- **[2a]** `sources/`
- **[2b]** Otra (especificar nombre de la subcarpeta)

### Execution Directory Structure

Workflows live inside a `workflows/` subfolder under the workspace. Each workflow has its own subfolder. Each execution creates a timestamp subfolder:

```
<workspace>\
  _templates\                              ← shared templates
    workflow-NN_V_0-1-0_template_NN.md
    procedures_NN.md
    nn-source_V_0-1-0_template_NN.md
  workflows\                               ← all workflow definitions
    prueba-transform_V_1-0-0_workflow_NN.md
    prueba-transform\                      ← workflow execution folder
      2026-07-07T20-00-00\                 ← execution (ISO timestamp, no colons)
        raw\                               ← input: source documents
        sources\                           ← output stage 1: normalized Markdown
        output\                            ← output stage 2: transformed documents
      2026-07-08T10-00-00\                 ← another execution
        ...
```

If there is only one execution and no timestamp exists yet, files go directly under `workflows/<workflow-name>/`.

### Writing the Workflow File

1. Generate frontmatter following the iNNfo spec (V_0-2-0) with `_NN` markers
2. Write Stage elements in document order
3. Generate SkillRef entries for each unique skill used
4. Generate ArtifactType entries for each unique artifact type
5. Fill the Stage-Skill and Stage-Artifact matrices
6. Save as `workflows/<name>_V_<version>_workflow_NN.md` under the workspace
7. Report success: "Workflow [name] creado en [workspace]\workflows\"

### Workflow File Format

```yaml
---
spec_version: "V_0-2-0"
spec_url: "https://raw.githubusercontent.com/innV0/cogNNitive/v0.1.5/specs/iNNfo_V_0-2-0_NN.md"
level: 3
parent_spec:
  name: "workflow_V_1-0-0"
  url: ""
type: "innv0-workflow"
model_version: "V_1-0-0"
title: "<workflow-name>"
---

> [!NOTE]
> This is a **iNNfo document**...

# _NN index
* [[Workflow]]
* [[Stage]]
* [[SkillRef]]
* [[ArtifactType]]

# _NN Workflow
Workflow description.

# _NN Stage
* _NN Stage: <stage-id>
  ```yaml
  skill: "<skill-name>"
  template: "<template-name>"
  input: "<input-path>"
  output: "<output-path>"
  ```
  Stage description.

# _NN SkillRef
* _NN SkillRef: <skill-name>
  ```yaml
  source: "skills/<skill-name>/SKILL.md"
  version: "latest"
  ```

# _NN ArtifactType
* _NN ArtifactType: <artifact-type>
  ```yaml
  description: "<description>"
  ```

# _NN matrices: stage-skill matrix
| Stage \ Skill | <skill-name> |
| :--- | :---: |
| <stage-id> | X |

# _NN matrices: stage-artifact matrix
| Stage \ Artifact | <artifact-type> |
| :--- | :---: |
| <stage-id> | <output-status> |
```

---

## Execution Protocol

### Stage Iteration

```
For each stage in stages:
  1. Report: "Ejecutando stage [id] con skill [skill]..."
  2. Load skill via skill(name: "[skill-name]")
  3. Follow the loaded skill's instructions
  4. Verify stage output is generated
  5. Pass output as input to next stage
  6. If success → proceed to next stage
  7. If failure → stop and report error
```

### Step-by-step Detail

#### 1. Report Stage Start

Announce: "Ejecutando stage **[stage id]** con skill **[skill name]**..."

#### 2. Load the Skill

Call `skill(name: "[skill-name]")` to load the child skill's SKILL.md.

Communicate parameters **conversationally**:

> "The user wants to run [skill-name] with input=[input], output=[output], template=[template]. Follow your SKILL.md but skip the source-folder question — use [input] as the source and write output to [output]."

#### 3. Normalization (Mandatory for innv0-trannsform)

When executing an `innv0-trannsform` stage, raw files MUST be normalized before transformation:

1. Read each raw file from `input`
2. Wrap it with the **nn-source template** (`_templates/nn-source_V_0-1-0_template_NN.md`), which adds iNNfo-compliant frontmatter with:
   - `source_file`: original filename
   - `source_format`: original format (e.g., `md`, `pdf`, `docx`)
   - `source_workflow`: workflow name
   - `source_stage`: current stage ID
3. Write the normalized file to `output/` with `_source_NN.md` suffix
4. This is NOT optional — it provides traceability from source to final output

#### 4. Follow the Loaded Skill

Let the loaded skill execute its workflow. Do NOT modify the instruction flow.

#### 5. Verify Stage Output

After the loaded skill completes:
- Check that the `output` path exists
- If output is missing or the skill reported an error → stage failed
- If output is present → stage successful

#### 6. Pass Output to Next Stage

Take the `output` path from the completed stage and communicate it as the `input` for the next stage.

#### 7. Error → Stop / Success → Continue

- **Success:** Report "Stage [id] completado. Output: [output]" and proceed
- **Failure:** Report "Stage [id] falló: [reason]" and stop

### Output Passthrough Example

```
Stage "Ingestion":
  input: raw/
  output: sources/

Stage "FORMAT Model":
  input: sources/
  output: models/
```

The orchestrator:
1. Runs Stage 1: "input=raw/, output=sources/"
2. After completion: "sources/ is now available"
3. Runs Stage 2: "input=sources/, output=models/"

---

## Error Handling

### Skill Not Found

> "Error: Skill [name] no encontrado. Verificá que el skill esté instalado en skills/[name]/SKILL.md. Workflow abortado."

### Stage Without Output

> "Error: Stage [id] no generó output en [path]. Workflow abortado en stage [id]."

### Malformed Workflow File

> "Error: Archivo workflow inválido: [reason]. No se puede continuar."

Show the specific error (e.g., "missing frontmatter fields", "YAML parse error").

### Stage Failure During Execution

> "Stage [id] falló: [error details]. Workflow abortado en stage [id]."

After reporting:
1. Ask: "¿Querés reintentar el stage o abortar el workflow?"
2. If retry → restart the current stage
3. If abort → stop execution entirely

### Fail-Stop Behavior

The orchestrator follows **fail-stop** semantics:
- Never skip a failed stage
- Never resume after failure without explicit user consent
- Previous stage outputs are never modified on failure

---

## Workflow Parsing Reference

The orchestrator parses a workflow file with iNNfo `_NN` markers:

```yaml
# From frontmatter
title: "Workflow Name"
model_version: "V_1-0-0"

# From Stage elements (list, ordered by document position)
stages:
  - id: "stage-1"
    skill: "innv0-trannsform"
    template: null
    input: "raw/"
    output: "sources/"
  - id: "stage-2"
    skill: "innv0-innfo"
    template: "business"
    input: "sources/"
    output: "models/"
```

### Scanning Strategy

1. Read YAML frontmatter between `---` delimiters
2. Locate concept sections by `_NN` markers:
   - `# _NN Stage` → Stage list
   - `# _NN SkillRef` → Skill references
   - `# _NN ArtifactType` → Artifact types
3. Parse list items within each concept section:
   - `* _NN Stage: <label>` → stage element
   - Extract YAML fields from the fenced code block following each element
4. Locate matrix section under `# _NN matrices:`
5. Parse Markdown tables:
   - `stage-skill matrix` → Stage-Skill mapping
   - `stage-artifact matrix` → Stage-Artifact mapping

---

## Supported Skills Registry

| Skill | Entry Point | Input Expects | Output Produces | Template Available |
|-------|-------------|---------------|-----------------|-------------------|
| `innv0-trannsform` | `skills/innv0-trannsform/SKILL.md` | Path to raw files (PDF, DOCX, XLSX, MD, TXT) | Normalized Markdown in output directory | Optional: nn-source template for normalization |
| `innv0-innfo` | `skills/innv0-innfo/SKILL.md` | Path to normalized Markdown sources | iNNfo model file (`*_NN.md`) | Required: template name (e.g., `business`) |

### Adding Support for New Skills

1. Add the skill to `skills/<name>/SKILL.md`
2. Add a row to the table above documenting its interface
3. Update `.innv0/skill-registry.md` via `node scripts/build-registry.js`

---

## Workflow Location Convention

Workflows live in a `workflows/` subfolder under the chosen workspace. The orchestrator always asks the user for the workspace directory first (see §Location Selection Protocol), then scans `workflows/` for existing definitions.

---

## Completion Report

After success:

```
Workflow [title] completado exitosamente.

Resumen:
├── Stage 1: [id] ✅ — output: [path]
├── Stage 2: [id] ✅ — output: [path]
└── Stage 3: [id] ✅ — output: [path]

Output final disponible en: [last stage output]
```

After abort:

```
Workflow abortado en stage: [id]

Stages completados:
├── Stage 1: [id] ✅ — output: [path]
└── Stage 2: [id] ❌ — falló en [stage id]

Error: [error details]
```