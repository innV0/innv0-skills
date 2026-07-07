---
specification_version: "V_0-1-0"
title: "Video a Comercial"
model_version: "V_1-0-0"
documentation_location: "docs/templates/workflow/V_0-1-0/"
type: "innv0-workflow"
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

# _F concepts: Workflow

> [!NOTE]
> Workflow que transforma un video raw en un comercial completo: normaliza el contenido fuente, genera un modelo de negocio FORMAT, y produce un script de AnyDeo.
> **Version:** V_1-0-0 | **Template:** workflow V_0-1-0

* _F Workflow: Video a Comercial Workflow
  ```yaml
  name: "Video a Comercial"
  description: "Transforma un video raw en un comercial completo mediante 3 stages: normalización, modelado FORMAT, y generación de script AnyDeo"
  version: "V_1-0-0"
  ```

---

# _F concepts: Stage

* _F Stage: Raw Ingestion
  ```yaml
  id: "raw-ingestion"
  description: "Ingiere el video raw y lo normaliza a Markdown estructurado usando traNNsform en modo normalize-only"
  skill: "innv0-trannsform"
  template: null
  input: "raw/"
  output: "sources/"
  ```

* _F Stage: FORMAT Model
  ```yaml
  id: "format-model"
  description: "Procesa los sources normalizados y genera un modelo de negocio FORMAT usando el template business"
  skill: "innv0-innfo"
  template: "business"
  input: "sources/"
  output: "models/"
  ```

* _F Stage: AnyDeo Script
  ```yaml
  id: "anydeo-script"
  description: "Toma el modelo FORMAT y genera un script de AnyDeo para el comercial final"
  skill: "innv0-trannsform"
  template: "anydeo"
  input: "models/"
  output: "scripts/"
  ```

---

# _F concepts: SkillRef

* _F SkillRef: traNNsform Normalization
  ```yaml
  name: "innv0-trannsform"
  trigger: "trannsform, transform, normalize, scan documents"
  path: "skills/innv0-trannsform/SKILL.md"
  ```

* _F SkillRef: iNNfo Model Authoring
  ```yaml
  name: "innv0-innfo"
  trigger: "innfo, model, iNNfo"
  path: "skills/innv0-innfo/SKILL.md"
  ```

---

# _F concepts: ArtifactType

* _F ArtifactType: Raw Video
  ```yaml
  type: "raw"
  description: "Video fuente sin procesar (MP4, MOV, etc.)"
  ```

* _F ArtifactType: Normalized Markdown
  ```yaml
  type: "markdown"
  description: "Contenido normalizado a Markdown estructurado"
  ```

* _F ArtifactType: FORMAT Business Model
  ```yaml
  type: "format-model"
  description: "Modelo de negocio FORMAT con template business"
  ```

* _F ArtifactType: AnyDeo Script
  ```yaml
  type: "script"
  description: "Script de AnyDeo listo para producción del comercial"
  ```

---

# _F concepts: Transformation

* _F Transformation: Raw to Markdown
  ```yaml
  from_type: "raw"
  to_type: "markdown"
  method: "normalize-only — ingesta y normalización sin aplicación de template"
  ```

* _F Transformation: Markdown to FORMAT Model
  ```yaml
  from_type: "markdown"
  to_type: "format-model"
  method: "autoría de modelo FORMAT con template business a partir de sources normalizados"
  ```

* _F Transformation: FORMAT Model to AnyDeo Script
  ```yaml
  from_type: "format-model"
  to_type: "script"
  method: "aplicación de template anydeo sobre el modelo FORMAT para generar script de comercial"
  ```

---

# _F markers: matrices

## Stage-Skill Matrix

| Stage \ SkillRef | innv0-trannsform | innv0-innfo |
| :--- | :---: | :---: |
| **Raw Ingestion** | innv0-trannsform | |
| **FORMAT Model** | | innv0-innfo |
| **AnyDeo Script** | innv0-trannsform | |

## Stage-Artifact Matrix

| Stage \ ArtifactType | raw | markdown | format-model | script |
| :--- | :---: | :---: | :---: | :---: |
| **Raw Ingestion** | Yes | | | |
| **FORMAT Model** | | | Yes | |
| **AnyDeo Script** | | | | Yes |

---

# _F markers: flow

## Workflow Data Flow

```
raw/  ──[Raw Ingestion]──▶  sources/  ──[FORMAT Model]──▶  models/  ──[AnyDeo Script]──▶  scripts/
 Daily                         │                             │                             │
 │  tipo: raw                │  tipo: markdown             │  tipo: format-model        │  tipo: script
 │  skill: innv0-trannsform  │  skill: innv0-innfo          │  skill: innv0-trannsform   │
 │  modo: normalize-only     │  template: business         │  template: anydeo          │
```

## Directory Layout

```
project/
├── raw/                        ← Colocar acá los videos fuente
│   └── video-fuente.mp4
├── sources/                    ← Generado por Stage 1
│   └── video-fuente.md
├── models/                     ← Generado por Stage 2
│   └── VideoComercial_V_1-0-0_business_FORMAT.md
├── scripts/                    ← Generado por Stage 3
│   └── comercial_anydeo.any
└── example_V_1-0-0_workflow_FORMAT.md
```
