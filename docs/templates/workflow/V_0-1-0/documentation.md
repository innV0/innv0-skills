# Workflow Template Documentation

**Template:** workflow V_0-1-0
**Location:** `docs/templates/workflow/V_0-1-0/workflow_V_0-1-0_FORMAT.md`

---

## Description

The **Workflow Template** is a FORMAT specialization for modeling declarative multi-skill processing workflows. It defines a sequence of stages, each executed by an agent skill, with typed artifacts flowing between stages.

Use this template when you need to:
- Chain multiple agent skills in a defined sequence
- Document a multi-step transformation workflow
- Create reusable processing workflows for content ingestion, model authoring, or script generation
- Coordinate skills like `innv0-trannsform`, `innv0-innfo`, and others in a single declarative file

## Concepts

| Concept | Type | Description |
|---------|------|-------------|
| **Workflow** | `text` | Root entity: name, version, description |
| **Stage** | `sequence` | Ordered processing steps. Document order = execution order |
| **SkillRef** | `list` | References to agent skills (maps to SKILL.md files) |
| **ArtifactType** | `list` | Artifact types: raw, markdown, format-model, script, any |
| **Transformation** | `list` | Rules mapping input artifacts to output artifacts per stage |

## Matrices

### Stage-Skill Matrix

Binds each Stage to the Skill that executes it. Each stage maps to exactly one skill.

| Stage \ SkillRef | skill-a | skill-b | skill-c |
| :--- | :---: | :---: | :---: |
| **Stage 1** | Max | | |
| **Stage 2** | | Max | |
| **Stage 3** | | | Max |

The row header is the Stage element ID. The column headers are SkillRef element names. Fill the matching cell with the skill name or `Max`.

### Stage-Artifact Matrix

Binds each Stage to the ArtifactType it produces.

| Stage \ ArtifactType | raw | markdown | format-model | script | any |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Stage 1** | Yes | | | | |
| **Stage 2** | | Yes | | | |
| **Stage 3** | | | | Yes | |

The row header is the Stage element ID. The column headers are ArtifactType values. Mark the matching column with `Yes`.

## _F Structural Markers

This template uses `_F` structural markers (FORMAT V_0-1-5+ convention). Two forms are valid:

| Form | Heading Syntax | Element Syntax |
|------|----------------|----------------|
| **Visible** | `# _F concepts: ConceptName` | `* _F ConceptName: Element Label` |
| **Hidden** | `# <!-- _F concepts: --> ConceptName` | `* <!-- _F ConceptName: --> Element Label` |

The hidden form wraps the marker in an HTML comment so it is invisible when rendered. Both forms are semantically identical.

## File Naming Convention

Workflow instance files follow:

```
<Name>_V_<major>-<minor>-<patch>_workflow_FORMAT.md
```

Examples:
- `example_V_1-0-0_workflow_FORMAT.md`
- `video-processing_V_2-0-0_workflow_FORMAT.md`

## Frontmatter Reference

Every workflow instance must include this frontmatter:

```yaml
---
specification_version: "V_0-1-0"
title: "<Workflow Name>"
model_version: "V_<major>-<minor>-<patch>"
documentation_location: "docs/templates/workflow/V_0-1-0/"
template:
  name: "workflow"
  version: "V_0-1-0"
  title: "Workflow Template"
  concepts:
    - name: "Workflow"
      type: "text"
    - name: "Stage"
      type: "sequence"
    - name: "SkillRef"
      type: "list"
    - name: "ArtifactType"
      type: "list"
    - name: "Transformation"
      type: "list"
  markers:
    - name: "_F"
      type: "structural"
  matrices:
    - name: "Stage-Skill"
      source: "Stage"
      target: "SkillRef"
    - name: "Stage-Artifact"
      source: "Stage"
      target: "ArtifactType"
---
```

## Guidelines

### Writing a Workflow Instance

1. Copy the template frontmatter and fill in your workflow name and version
2. Define the Workflow concept with a description of what the workflow does
3. List Stages in execution order — each with `id`, `description`, `skill`, `template`, `input`, `output`
4. Declare SkillRef entries for each unique skill referenced by stages
5. List ArtifactType entries that the workflow produces
6. Fill the Stage-Skill matrix binding each stage to its skill
7. Fill the Stage-Artifact matrix showing what each stage produces

### Output Passthrough Convention

The `output` of Stage N becomes the `input` of Stage N+1. Explicit path values are used:

```
Stage 1: input="raw/" output="sources/"
Stage 2: input="sources/" output="models/"
Stage 3: input="models/" output="scripts/"
```

The orchestrator reads these values literally and passes them to the loaded skill.

## Sample

See [`samples/example_V_1-0-0_workflow_FORMAT.md`](./samples/example_V_1-0-0_workflow_FORMAT.md) for a complete three-stage workflow example (Raw Ingestion → FORMAT Model → AnyDeo Script).

## Template Location

```
docs/templates/workflow/
└── V_0-1-0/
    ├── workflow_V_0-1-0_FORMAT.md     # This template
    ├── documentation.md                 # This documentation
    └── samples/
        └── example_V_1-0-0_workflow_FORMAT.md
```
