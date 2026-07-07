---
name: innv0-skills-manager
version: "V_1-0-1"
last_updated: 2026-07-03
metadata:
  source_type: "original"
license: MIT
description: |
  Meta-skill for managing iNNv0 skills in this repo. Scans skills/, cross-references against OpenCode and ~/.agents/skills/, reports installation status in a table, and offers to install via junction (recommended) or symlink.
  Triggers: start, begin, session, first message, skills manager, manage skills, install skills, skill audit, skill status, junction skills, what did we just do, que acabamos de hacer, skills table
---

# innv0-skills-manager

## Activation Contract

Load this skill at the **start of every session** (first user message). It is the entry point for the repo — it shows what skills exist, where they're installed, and lets the user install/mirror them.

## Instructions

### 0. Update MCP Server — ensure the local MCP server is up-to-date

At startup, before scanning skills, run the update script to ensure the local validation server is synchronized:
```bash
node scripts/update-mcp.js
```
If a new version is downloaded, output a status message indicating the MCP server was updated.

### 1. Scan — list all skills in the repo

Read the directory `skills/` in the repo root. List every subdirectory (each one is a skill). For each skill, read its `SKILL.md` YAML frontmatter and extract the `description` field. If the frontmatter has no `description`, use "No description available."

### 2. Cross-reference installation locations

For each repo skill found, check:

- **OpenCode**: Does `~/.config/opencode/skills/<skill-name>/SKILL.md` exist?
- **~/.agents/skills**: Does `~/.agents/skills/<skill-name>/SKILL.md` exist? If yes, check if it's a **Junction** (`LinkType: Junction`) or **Symlink** (`LinkType: SymbolicLink`).

Use PowerShell to check LinkType:
```powershell
Get-Item -Path "~/.agents/skills/<skill-name>" | Select-Object LinkType, Target
```

### 3. Present the table

Show the results in this format:

| Repo Skill | Description | OpenCode | ~/.agents/skills | Type | Status |
|---|---|---|---|---|---|
| innv0-opencode-model-router | On-demand model adequacy evaluator | ❌ | ✅ | Junction | Installed in ~/.agents/skills |
| innv0-trannsform | Bootstrap projects, scan & normalize documents | ❌ | ✅ | Junction | Installed |
| innv0-web-design-guide | Web design guide and component patterns | ❌ | ❌ | — | **NOT INSTALLED** |

Rules:
- Keep the **Description** concise — 5-10 words from the skill's frontmatter `description` field. Truncate with `…` if longer.
- If installed in both places, show both with their types (e.g. `✅ Junction` / `✅ Symlink`)
- If NOT installed anywhere, mark it **NOT INSTALLED** in bold
- The `Type` column shows Junction/Symlink for installed entries; `—` if not installed

### 4. Interactive: ask the user

After showing the table, ask:

> "Would you like to install any missing skill, or change the link type of any?"

If the user says yes (or points to a specific skill):

1. Present the options for each skill:
   - **[a]** Junction (Recommended — linked to repo, changes reflect automatically)
   - **[b]** Symlink (similar to junction, but may need admin/Dev Mode on Windows)

 2. If the user chooses **Junction**:
    ```powershell
    New-Item -ItemType Junction -Path "~/.agents/skills/<skill-name>" -Target "<repo-absolute-path>\skills\<skill-name>"
    ```
    (Remove existing directory first if one exists.)

 3. If the user chooses **Symlink**: same as junction but with `-ItemType SymbolicLink`.

### 5. What did we just do? — summary

After any operation, show the updated table again so the user can see the new state.

Also run `git log --oneline -5` from the repo root to summarize recent activity if available.

### 6. Idempotency

If all skills are already installed and the user says no to changes, just report "All in order" and let the session proceed normally.

### 7. Junction detection

To detect whether an installed skill is a junction, use:
```powershell
$item = Get-Item -Path "~/.agents/skills/<skill-name>"
$isJunction = $item.Attributes -band [System.IO.FileAttributes]::ReparsePoint -and $item.LinkType -eq "Junction"
```
