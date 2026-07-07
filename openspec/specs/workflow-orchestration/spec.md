# Workflow Orchestration Specification

## Purpose

Define the behavior of the `innv0-workflow-orchestrator` meta-skill. The orchestrator discovers workflow files, lets users select or create workflows, and executes stages sequentially by loading and invoking child skills.

## Requirements

### Requirement: Workflow Discovery

The orchestrator MUST scan user-specified locations for workflow FORMAT files.

#### Scenario: Location with one workflow file

- GIVEN the user provides a filesystem path
- WHEN the orchestrator scans that path
- THEN it MUST find all files matching the pattern `*_workflow_FORMAT.md`
- AND return their parsed names and versions to the user

#### Scenario: Location with no workflow files

- GIVEN the user provides a path with no `*_workflow_FORMAT.md` files
- WHEN the orchestrator scans that path
- THEN it SHOULD report "No workflow files found in [path]"
- AND offer the user the option to create a new workflow

### Requirement: User Interaction — Choose or Create

The orchestrator MUST ask the user whether to use an existing workflow or create a new one before any scanning or execution.

#### Scenario: User chooses existing workflow

- GIVEN the user selects "use existing"
- WHEN the orchestrator completes discovery
- THEN it MUST present a numbered list of found workflows with name and version
- AND let the user pick one by number

#### Scenario: User chooses new workflow

- GIVEN the user selects "create new"
- WHEN the orchestrator starts the creation flow
- THEN it MUST guide the user through: workflow name, stage list (ordered), skill assignment per stage, and artifact type per stage
- AND write the resulting workflow file to the user's chosen location

### Requirement: Workflow Parsing

The orchestrator MUST parse the selected workflow FORMAT file and extract stages, skills, and artifact mappings.

#### Scenario: Valid workflow parsed

- GIVEN a valid `workflow_FORMAT.md` file
- WHEN the orchestrator parses it
- THEN it MUST extract the ordered list of Stage elements
- AND for each stage, extract the assigned Skill (from the Stage-Skill matrix)
- AND for each stage, extract the output Artifact type (from the Stage-Artifact matrix)

#### Scenario: Malformed workflow file

- GIVEN a workflow file with missing or invalid frontmatter
- WHEN the orchestrator attempts to parse it
- THEN it MUST report "Invalid workflow file: [reason]"
- AND abort execution without loading any child skills

### Requirement: Sequential Stage Execution

The orchestrator MUST execute workflow stages in the order defined by the document.

#### Scenario: Three-stage workflow executes in order

- GIVEN a workflow with stages `[Normalize → Format → Transform]`
- WHEN the orchestrator executes
- THEN stage Normalize runs first, stage Format runs second, stage Transform runs third
- AND no stage starts before its predecessor completes

### Requirement: Child Skill Loading

Before executing a stage, the orchestrator MUST load the corresponding skill and verify it is available.

#### Scenario: Skill loads successfully

- GIVEN a stage assigned to skill `innv0-trannsform`
- WHEN the orchestrator reaches that stage
- THEN it MUST load `skills/innv0-trannsform/SKILL.md`
- AND confirm the skill is available before proceeding

#### Scenario: Skill not found

- GIVEN a stage assigned to a skill path that does not exist
- WHEN the orchestrator attempts to load it
- THEN it MUST report "Skill [name] not found at [path]"
- AND stop workflow execution

### Requirement: Output Passthrough

The orchestrator MUST pass each stage's output artifact as the input to the next stage.

#### Scenario: Stage output feeds next stage input

- GIVEN a two-stage workflow where Stage A produces `markdown` and Stage B consumes `markdown`
- WHEN Stage A completes
- THEN the orchestrator MUST provide Stage A's output path to Stage B as its input
- AND Stage B MUST receive valid input to begin

#### Scenario: First stage reads from raw/ folder

- GIVEN the first stage of a workflow
- WHEN the orchestrator begins execution
- THEN it MUST pass the workflow's configured source directory (e.g., `raw/`) as the first stage's input

### Requirement: Error Handling

If any stage fails, the orchestrator MUST report the error and stop.

#### Scenario: Stage fails during execution

- GIVEN a workflow where Stage 2 fails with an error
- WHEN the orchestrator detects the failure
- THEN it MUST report "Stage [name] failed: [error details]"
- AND MUST NOT execute Stage 3
- AND SHOULD report "Workflow aborted at stage [name]"

#### Scenario: Skill loading fails mid-workflow

- GIVEN a workflow where Stage 3 references a missing skill
- WHEN the orchestrator attempts to load it
- THEN it MUST report the failure with the skill name and path
- AND stop execution without modifying previously completed stage outputs

### Requirement: Registry Registration

The orchestrator SKILL.md MUST include a `triggers` metadata entry and the `.innv0/skill-registry.md` MUST be updated to include the orchestrator entry.

#### Scenario: Registry entry present

- GIVEN `.innv0/skill-registry.md` exists
- WHEN the change is applied
- THEN the registry MUST contain a table row for `innv0-workflow-orchestrator`
- AND the row MUST include path `skills/innv0-workflow-orchestrator/SKILL.md`
- AND triggers MUST include `workflow`, `orchestrate`, `run workflow`
