---
specification_version: "V_0-1-0"
specification_url: "https://raw.githubusercontent.com/innV0/FORMAT/main/docs/spec/V_0-1-0/_format.md"
title: "Workflow Template"
model_version: "V_0-1-0"
documentation_location: "docs/templates/workflow/V_0-1-0/"
template:
  name: "workflow"
  version: "V_0-1-0"
  title: "Workflow Template"
  concepts:
    - name: "Workflow"
      type: "text"
      description: "Workflow name, version, and description. Root entity identifying the workflow."
    - name: "Stage"
      type: "sequence"
      description: "Ordered steps in the workflow. Document order defines execution order. Each stage references a skill, template, input, and output."
    - name: "SkillRef"
      type: "list"
      description: "Skills available for stage execution. Each skill reference maps to a loaded agent skill (SKILL.md)."
    - name: "ArtifactType"
      type: "list"
      description: "Artifact types flowing through the workflow: raw, markdown, format-model, script, or any."
    - name: "Transformation"
      type: "list"
      description: "Transformation rules mapping input to output for each stage. Defines how artifacts are processed."
  markers:
    - name: "_F"
      type: "structural"
      description: "Structural marker prefix for concept blocks and element lines. Used in both visible form (`_F concepts:`) and hidden form (`<!-- _F concepts: -->`)."
  matrices:
    - name: "Stage-Skill"
      source: "Stage"
      target: "SkillRef"
      description: "Maps each stage to the skill that executes it. Each stage maps to exactly one skill."
    - name: "Stage-Artifact"
      source: "Stage"
      target: "ArtifactType"
      description: "Maps each stage to the artifact type it produces as output."
---

# _F concepts: Workflow

> [!NOTE]
> Workflow template for the iNNv0 ecosystem. Defines multi-skill processing workflows as declarative FORMAT documents.
> **Version:** V_0-1-0 | **Template:** workflow

The Workflow concept defines the root entity of a processing workflow. It captures the identity and purpose of the workflow.

* _F Workflow: Workflow Definition
  ```yaml
  name: ""
  description: ""
  version: "V_0-1-0"
  ```

---

# _F concepts: Stage

Stages are the ordered processing steps in a workflow. The document order defines execution order: Stage 1 runs first, its output feeds Stage 2, and so on.

* _F Stage: Stage Definition
  ```yaml
  id: ""
  description: ""
  skill: ""
  template: ""
  input: ""
  output: ""
  ```

Each Stage element includes:
- **id**: Unique identifier for the stage within the workflow
- **description**: What this stage does
- **skill**: The name of the skill that executes this stage (maps to SkillRef)
- **template**: Optional template name for skill execution
- **input**: Source path or artifact name consumed by this stage
- **output**: Destination path or artifact name produced by this stage

---

# _F concepts: SkillRef

SkillRef declares which agent skills are available for stage execution. Each skill reference maps to a SKILL.md file in the `skills/` directory.

* _F SkillRef: Skill Reference
  ```yaml
  name: ""
  trigger: ""
  path: "skills/name/SKILL.md"
  ```

---

# _F concepts: ArtifactType

ArtifactType classifies the data flowing through workflow stages. Each stage produces one artifact type consumed by the next stage.

* _F ArtifactType: Artifact Type
  ```yaml
  type: ""
  description: ""
  ```

Valid types include:
- **raw**: Unprocessed source files (PDF, DOCX, video, etc.)
- **markdown**: Normalized Markdown files
- **format-model**: A FORMAT model file (`*_FORMAT.md`)
- **script**: Generated script or output file
- **any**: Unspecified or generic artifact

---

# _F concepts: Transformation

Transformation defines the processing rules applied by each stage to convert input artifacts into output artifacts.

* _F Transformation: Transformation Rule
  ```yaml
  from_type: ""
  to_type: ""
  method: ""
  ```

---

# _F markers: matrices

## Stage-Skill Matrix

| Stage \ SkillRef | innv0-trannsform | innv0-innfo | innv0-workflow-orchestrator |
| :--- | :---: | :---: | :---: |
| **Stage 1** | | | |
| **Stage 2** | | | |
| **Stage 3** | | | |

Each stage maps to exactly one skill. Fill the cell with the matching skill name.

## Stage-Artifact Matrix

| Stage \ ArtifactType | raw | markdown | format-model | script | any |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Stage 1** | | | | | |
| **Stage 2** | | | | | |
| **Stage 3** | | | | | |

Each stage produces exactly one artifact type. Mark with `Yes` in the matching column.

---

# _F markers: naming

## File Naming Convention

Workflow instance files MUST follow this naming pattern:

```
<Name>_V_<major>-<minor>-<patch>_workflow_FORMAT.md
```

Examples:
- `example_V_1-0-0_workflow_FORMAT.md`
- `video-processing_V_2-0-0_workflow_FORMAT.md`

## Frontmatter Requirements

Every workflow instance MUST include:

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
