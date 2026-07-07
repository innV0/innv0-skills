# innv0-trannsform — Manual Test Guide

Follow these steps in order on a new project with OpenCode. Each step verifies a part of the skill. Mark ✅ when it passes.

---

## Setup

```bash
# Create a clean folder for testing
mkdir ~/Documents/trannsform-test
cd ~/Documents/trannsform-test
```

Create some test files inside:

**`report.txt`**
```
The organization had 45 active members in 2023.
Coverage reached 78% of the target population.
```

**`data.csv`**
```
name,age,role
Ana,34,Coordinator
Luis,28,Technician
```

**`presentation.docx`** (optional — only if you want to test docx)

---

## Test 1: Skill installation

**Instruction for OpenCode:**

> Install the `innv0-trannsform` skill in my session. Look for it in `~/.agents/skills/innv0-trannsform/SKILL.md` or in the `iNNv0_skills/skills/innv0-trannsform/` repository.

**Expected result:** OpenCode loads the skill successfully.

---

## Test 2: Project bootstrap

**Instruction for OpenCode:**

> Using the innv0-trannsform skill, bootstrap a project with the files in the current folder as source. Project name: "test-docs".

**Expected result:**
- ✅ OpenCode creates the structure `test-docs/raw/`, `test-docs/md/`, `test-docs/traNNsformations/`, `test-docs/output/`
- ✅ Files are copied to `test-docs/raw/`
- ✅ OpenCode reports no errors

---

## Test 3: Scan and format detection

**Instruction for OpenCode:**

> Run the scan on the `test-docs` project using the skill's CLI.

**Expected result:**
- ✅ OpenCode executes `node scripts/index.js --scan --src test-docs`
- ✅ Summary appears: "Discovered: X, Processed: Y, Skipped: Z"
- ✅ `test-docs/index.md` is created
- ✅ `test-docs/md/report.md` is created with the txt content
- ✅ `test-docs/md/data.md` is created with the csv content
- ✅ `test-docs/md/_all.md` is created with both documents consolidated

---

## Test 4: Agent (LLM) transformation — Draft

**Instruction for OpenCode:**

> I want to generate a draft summary of the project documents. Use the skill to do a "summary" type transformation in draft format.

**Expected result:**
- ✅ OpenCode asks you what type of transformation you want
- ✅ You choose "Create new" (or "Summary" if offered)
- ✅ OpenCode asks if you want draft or final version
- ✅ You choose "Draft"
- ✅ OpenCode generates a file `output/[name]_draft.md`
- ✅ The draft includes the header `# DRAFT FOR REVIEW — NOT FINAL VERSION`
- ✅ The draft includes source citations (e.g., `— Source: informe.txt`)
- ✅ If unsure about any data, it includes markers like `[unconfirmed data — review]`

---

## Test 5: Transformation — Final version

**Instruction for OpenCode:**

> Now generate a clean final version of the same summary.

**Expected result:**
- ✅ OpenCode asks if you want to include source references
- ✅ You answer yes (or no)
- ✅ OpenCode generates `output/[name]_v_0-1-0.md`
- ✅ The file has NO draft markers or annotations
- ✅ (Optional) Includes source references if you said yes

---

## Test 6: Traceability verification (only if docx/pdf present)

If you have a docx or pdf file in the source folder, when running the scan:

- ❓ Does the format diagnostic panel appear?
- ❓ Does OpenCode ask if you want to process it with Node.js or skip it?
- ❓ If you choose Node.js, does it install the dependency automatically?

---

## Test 7: CLI transformer fallback

**Instruction for OpenCode:**

> Run the CLI fallback transformer with `node scripts/index.js --apply Generic_Normalizer --src test-docs`. Place the template in test-docs/traNNsformations/ first.

**Expected result:**
- ✅ OpenCode runs the command
- ✅ `output/Generic_Normalizer_[timestamp].md` is generated

---

## Results Summary

| Test | Description | Result |
|------|-------------|--------|
| 1 | Skill installation | — |
| 2 | Project bootstrap | — |
| 3 | Scan and detection | — |
| 4 | Draft transformation | — |
| 5 | Final transformation | — |
| 6 | Traceability (if applicable) | — |
| 7 | CLI fallback | — |
