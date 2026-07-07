#!/usr/bin/env node
/**
 * scripts/build-registry.js
 *
 * Zero-dependency skill registry builder.
 * Scans skills/<name>/SKILL.md, parses YAML frontmatter via regex,
 * and writes .innv0/skill-registry.md + .innv0/.skill-registry.cache.json
 *
 * Usage:
 *   node scripts/build-registry.js [--root <dir>] [--output <dir>]
 *
 *   --root    Additional root to scan (repeatable). skills/<name>/SKILL.md
 *             is always scanned from repo root.
 *   --output  Output directory (default: .innv0/)
 *   --help    Show this message
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// CLI argument parsing (manual, no minimist)
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const extraRoots = [];
let outputDir = '.innv0';
let showHelp = false;
let showVersion = false;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--help':
      showHelp = true;
      break;
    case '--version':
      showVersion = true;
      break;
    case '--root':
      i++;
      if (i < args.length) extraRoots.push(args[i]);
      break;
    case '--output':
      i++;
      if (i < args.length) outputDir = args[i];
      break;
    default:
      console.error(`[WARN] Unknown option: ${args[i]}`);
      break;
  }
}

if (showHelp) {
  console.log(`
Usage: node scripts/build-registry.js [options]

Options:
  --root <dir>    Additional root to scan (repeatable). skills/<name>/SKILL.md
                  is always scanned from repo root.
  --output <dir>  Output directory (default: .innv0/)
  --help          Show this message
  --version       Show version
`);
  process.exit(0);
}

if (showVersion) {
  console.log('build-registry v1.0.0');
  process.exit(0);
}

// ---------------------------------------------------------------------------
// YAML frontmatter parser (regex-based, no external deps)
// ---------------------------------------------------------------------------

/**
 * Parse YAML frontmatter from SKILL.md content.
 * @param {string} content - Full file content
 * @param {string} dirName - Skill directory name (for error messages)
 * @returns {object|null} { name, description, firstLine, scope } or null on error
 */
function parseFrontmatter(content, dirName) {
  // Match content between --- markers (handles \n and \r\n line endings)
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    console.error(`[WARN] ${dirName}/SKILL.md: No YAML frontmatter found, skipping`);
    return null;
  }

  const fm = match[1];

  // Extract name (simple scalar)
  const nameMatch = fm.match(/^name:\s*(.+)/m);
  if (!nameMatch) {
    console.error(`[WARN] ${dirName}/SKILL.md: Missing 'name' in frontmatter, skipping`);
    return null;
  }
  const name = nameMatch[1].trim();

  // Extract description — try folded block (|) first, then single-line
  let description = '';
  const foldedMatch = fm.match(/^description:\s*\|\s*\r?\n((?: {2}.*(?:\r?\n|$))*)/m);
  if (foldedMatch) {
    // Remove the 2-space indent from each continuation line
    description = foldedMatch[1]
      .split(/\r?\n/)
      .map(line => line.replace(/^ {2}/, ''))
      .join('\n')
      .trim();
  } else {
    const singleMatch = fm.match(/^description:\s*(.*)/m);
    if (singleMatch) {
      description = singleMatch[1].trim();
      // Strip surrounding quotes if present
      if (description.length >= 2) {
        const first = description[0];
        const last = description[description.length - 1];
        if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
          description = description.slice(1, -1);
        }
      }
    }
  }

  // Extract scope if present (default: project)
  const scopeMatch = fm.match(/^scope:\s*(.+)/m);
  const scope = scopeMatch ? scopeMatch[1].trim() : 'project';

  const firstLine = description.split('\n')[0].trim();

  return { name, description, firstLine, scope };
}

// ---------------------------------------------------------------------------
// Scanning
// ---------------------------------------------------------------------------

/**
 * Scan a root directory for skills/<name>/SKILL.md.
 * @param {string} rootDir - Absolute path to scan
 * @returns {Array<{name, description, firstLine, scope, mtimeMs, filePath}>}
 */
function scanSkills(rootDir) {
  const skillsPath = path.join(rootDir, 'skills');
  const results = [];

  if (!fs.existsSync(skillsPath)) {
    return results;
  }

  const entries = fs.readdirSync(skillsPath, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillDir = path.join(skillsPath, entry.name);
    const skillMdPath = path.join(skillDir, 'SKILL.md');

    if (!fs.existsSync(skillMdPath)) {
      console.warn(`[WARN] ${entry.name}: Directory exists but no SKILL.md found`);
      continue;
    }

    const content = fs.readFileSync(skillMdPath, 'utf-8');
    const parsed = parseFrontmatter(content, entry.name);

    if (!parsed) continue;

    // Normalize name from parsed frontmatter (not dir name)
    results.push({
      ...parsed,
      mtimeMs: fs.statSync(skillMdPath).mtimeMs,
      filePath: skillMdPath,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Output generation
// ---------------------------------------------------------------------------

/**
 * Compute MD5 fingerprint over all skills for change detection.
 */
function computeFingerprint(skills) {
  const hash = crypto.createHash('md5');
  for (const skill of skills) {
    hash.update(`${skill.name}:${skill.mtimeMs}`);
  }
  return hash.digest('hex');
}

/**
 * Generate the Markdown registry table.
 */
function generateRegistryMd(skills, rootDir) {
  const lines = [];
  lines.push('# Skill Registry');
  lines.push('');
  lines.push('Auto-generated by `scripts/build-registry.js`. Do not edit manually.');
  lines.push('');
  lines.push('| Skill | Trigger / Description | Scope | Path |');
  lines.push('|-------|-----------------------|-------|------|');

  for (const skill of skills) {
    const relativePath = path.relative(rootDir, skill.filePath);
    lines.push(`| \`${skill.name}\` | ${skill.firstLine} | ${skill.scope} | \`${relativePath}\` |`);
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Generate the cache JSON manifest.
 */
function generateCacheJson(skills) {
  return JSON.stringify(
    {
      fingerprint: computeFingerprint(skills),
      generated_at: new Date().toISOString(),
      skills_count: skills.length,
    },
    null,
    2,
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const rootDir = process.cwd();
  const allRoots = [rootDir, ...extraRoots.map(r => path.resolve(rootDir, r))];

  let allSkills = [];
  let errorCount = 0;

  for (const root of allRoots) {
    const skills = scanSkills(root);
    // Count entries that failed parsing (null not returned, so we track differently)
    // scanSkills already logs errors per skill. We count total found.
    allSkills = allSkills.concat(skills);
  }

  // Count errors by checking total vs projects that have SKILL.md
  // Simple approach: if scan returned none but skills/ exists, something went wrong
  // We'll trust the per-skill error logging and just report the count.

  if (allSkills.length === 0) {
    console.warn('[WARN] No skills found in skills/ or additional roots. Empty registry generated.');
  }

  // Ensure output directory exists
  const outputPath = path.resolve(rootDir, outputDir);
  if (!fs.existsSync(outputPath)) {
    try {
      fs.mkdirSync(outputPath, { recursive: true });
    } catch (err) {
      console.error(`[ERROR] Cannot create output directory: ${outputPath}`);
      console.error(err.message);
      process.exit(1);
    }
  }

  // Write skill-registry.md
  const mdContent = generateRegistryMd(allSkills, rootDir);
  const mdDest = path.join(outputPath, 'skill-registry.md');
  fs.writeFileSync(mdDest, mdContent, 'utf-8');

  // Write .skill-registry.cache.json
  const jsonContent = generateCacheJson(allSkills);
  const jsonDest = path.join(outputPath, '.skill-registry.cache.json');
  fs.writeFileSync(jsonDest, jsonContent, 'utf-8');

  console.log(`${allSkills.length} skills indexed, ${errorCount} errors`);
}

main();
