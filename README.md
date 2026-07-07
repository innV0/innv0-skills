# iNNv0 Skills

**Modular AI Agent skills ecosystem for [OpenCode](https://opencode.ai).**

iNNv0 is a collection of self-contained, domain-specialized skills that teach your AI agent to solve specific types of tasks — from model evaluation and document transformation to web design and skills lifecycle management. Each skill is an autonomous module with its own triggers, instructions, and behavior rules.

[View site](https://skills.innv0.com) · [Documentation](https://skills.innv0.com/documentation/) · [Report issue](https://github.com/innV0/iNNv0_skills/issues)

---

## Skills

| Skill | Description |
|---|---|---|
| **[Model Router](./skills/innv0-opencode-model-router/)** | Evaluates whether the active AI model is cost-effective for the task at hand. Classifies requests across 4 tiers and recommends optimal model tiers. |
| **[Workflow Orchestrator](./skills/innv0-workflow-orchestrator/)** | Meta-skill that reads declarative workflow FORMAT files and coordinates multi-skill execution sequences (traNNsform, FORMAT, etc.) in sequential stages. |
| **[Skills Manager](./skills/innv0-skills-manager/)** | Meta-skill that scans, audits, and installs all skills in the repository. Supports NTFS junctions, symlinks, and copy install modes. |
| **[traNNsform](./skills/innv0-trannsform/)** | Document ingestion and transformation pipeline. Converts PDF, DOCX, XLSX, and more to unified Markdown using the agent's own LLM as the transformation engine. Ships with a Node.js CLI tool. |
| **[Web Design Guide](./skills/innv0-web-design-guide/)** | Complete light-mode design system with Morado Nazareno palette (#4D0E4E), systematic typography (Plus Jakarta Sans, Playfair Display, Geist Mono), and 8px spacing grid. |
| **[iNNfo](./skills/innv0-innfo/)** | Semantic modeling with iNNfo V_0-2-0 (`_NN` markers), template-based authoring, marker-based matrices, and spec-driven dashboard renderers. |

## Getting Started

```bash
# Clone the repository
git clone https://github.com/innV0/iNNv0_skills.git

# Start OpenCode in the directory
opencode .

# The Skills Manager activates automatically at session start.
# It scans skills/, detects available skills, and guides you
# through installation using Windows NTFS junctions.
```

### Requirements

- [OpenCode](https://opencode.ai) — conversational AI agent runtime
- **Windows** (recommended) — NTFS junctions for live-change reflection
- **Node.js 18+** — required by the traNNsform skill CLI tool

## How It Works

1. **Automatic scan** — At session start, the Skills Manager detects all available skills and reports their installation status.
2. **On-demand loading** — When a task matches a skill's triggers, the agent loads that skill's instructions and executes the specialized workflow.
3. **Modular by design** — Each skill is self-contained. Skills can be installed, updated, and removed independently without affecting others.

## Project Structure

```
iNNv0_skills/
├── skills/                        # Skill modules (one per directory)
│   ├── innv0-innfo/               #   iNNfo semantic modeling
│   ├── innv0-opencode-model-router/  #   Model adequacy evaluator
│   ├── innv0-workflow-orchestrator/  #   Multi-skill workflow orchestration
│   ├── innv0-skills-manager/      #   Skills lifecycle management
│   ├── innv0-trannsform/          #   Document ingestion pipeline
│   └── innv0-web-design-guide/    #   Design system & brand guidelines
├── docs/                          # Public site (Docsify + static HTML)
│   ├── index.html                 #   Landing page
│   ├── documentation/             #   Full skill documentation
│   └── ...                        #   Favicons, sitemap, analytics
├── scripts/                       # Repository-level automation scripts
├── AGENTS.md                      # Agent configuration & conventions
├── .gitignore
└── README.md                      # You are here
```

## Skill Versioning

All skills follow semantic versioning in their frontmatter:

```yaml
---
name: <skill-name>
version: "V_x-y-z"
last_updated: YYYY-MM-DD
metadata:
  source_type: "original" | "mirrored" | "integrated"
  source: "https://github.com/innV0/<repo>"
license: MIT
---
```

- **original** — authored here, this repo is the source of truth
- **mirrored** — copied from another repo via sync script
- **integrated** — bundled tool lives in the skill directory

## Contributing

1. Skills live in `skills/<skill-name>/` with a `SKILL.md` as the primary agent-facing instruction file.
2. All user-facing content must be in **English** per repo convention.
3. Every skill must include valid YAML frontmatter with name, version, last_updated, and metadata fields.
4. Scripts and tooling go under `scripts/` or within the skill's own directory.

## License

[MIT](./LICENSE) — all skills in this repository are open source under the MIT license.

---

Built with [iNNv0 Web Design Guide](https://skills.innv0.com/innv0-web-design-guide).
