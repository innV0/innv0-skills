const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TRANNNSFORM_VERSION = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version || '1.0.0';
  } catch {
    return '1.0.0';
  }
})();

// Supported extensions by category
const EXT_OK = ['.txt', '.md', '.csv', '.json'];
const EXT_PROMPT = ['.docx', '.pdf', '.xlsx'];
const EXT_NO = ['.mp3', '.wav', '.png', '.jpg', '.jpeg', '.gif'];

const EXT_LABELS = {
  '.txt': 'txt', '.md': 'md', '.csv': 'csv', '.json': 'json',
  '.docx': 'docx', '.pdf': 'pdf', '.xlsx': 'xlsx'
};

const EXT_DEPS = {
  '.docx': { pkg: 'mammoth', label: 'mammoth' },
  '.pdf':  { pkg: 'pdf-parse', label: 'pdf-parse' },
  '.xlsx': { pkg: 'xlsx', label: 'xlsx' }
};

/**
 * Compute SHA-256 hash of a file
 */
function computeFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generate YAML frontmatter with source traceability
 */
function generateSourceFrontmatter(originalFilePath, relativeSourcePath) {
  const hash = computeFileHash(originalFilePath);
  const timestamp = new Date().toISOString();
  const stat = fs.statSync(originalFilePath);

  return `---
source:
  file: "${relativeSourcePath}"
  hash: "sha256:${hash}"
  size: ${stat.size}
  normalized_at: "${timestamp}"
  normalized_by: "traNNsform v${TRANNNSFORM_VERSION}"
---

`;
}

/**
 * Detect available formats in a raw directory
 */
function detectFormats(rawDir) {
  const counts = {};
  if (!fs.existsSync(rawDir)) return counts;

  const files = fs.readdirSync(rawDir);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (ext in EXT_LABELS) {
      counts[ext] = (counts[ext] || 0) + 1;
    }
  }
  return counts;
}

/**
 * Check if a dependency is installed. Uses a simple require check.
 */
function isDepInstalled(pkgName) {
  try {
    require.resolve(pkgName, { paths: [__dirname] });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a human-readable list of supported format labels
 */
function getSupportedFormats() {
  return Object.values(EXT_LABELS).map(l => `\`${l}\``).join(', ');
}

/**
 * Scan raw directory, process files, update index.md, and consolidate to md/_all.md
 * @param {string} projectDir
 * @param {object} options
 * @param {string[]} [options.formats] – array of extensions to include (e.g. ['.txt', '.docx']).
 *        If omitted, all detected formats are processed.
 * @param {boolean} [options.autoAcceptPrompt] – auto-accept docx/pdf/xlsx conversion.
 * @param {function} [options.promptCallback] – callback for user approval.
 * @param {function} [options.depPromptCallback] – async (ext) => boolean, called when a
 *        dependency is missing. Return true to install, false to skip.
 */
async function scanAndProcess(projectDir, options = {}) {
  const rawDir = path.join(projectDir, 'raw');
  const mdDir = path.join(projectDir, 'md');
  const indexFile = path.join(projectDir, 'index.md');

  if (!fs.existsSync(rawDir)) {
    fs.mkdirSync(rawDir, { recursive: true });
  }
  if (!fs.existsSync(mdDir)) {
    fs.mkdirSync(mdDir, { recursive: true });
  }

  const logs = [];
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  logs.push(`*   **${timestamp}:** Scan initiated in \`${rawDir}\`.`);

  const files = fs.readdirSync(rawDir);
  let registry = [];
  let totalDiscovered = 0;
  let processedCount = 0;
  let skippedCount = 0;

  files.sort();

  for (const file of files) {
    if (file.toLowerCase() === 'desktop.ini' || file.startsWith('.') || file.startsWith('~$')) {
      continue;
    }
    const filePath = path.join(rawDir, file);
    const stat = fs.statSync(filePath);
    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);
    let status = 'Pending';
    let action = 'No action taken';
    let format = 'Unknown';

    // Determine if this format is selected
    const isSelected = !options.formats || options.formats.includes(ext);

    if (EXT_OK.includes(ext)) {
      format = ext === '.txt' ? 'Plain Text' : ext.substring(1).toUpperCase();
      totalDiscovered++;

      if (!isSelected) {
        status = '⚠️ Skipped';
        action = `Format ${EXT_LABELS[ext]} excluded by user selection.`;
        skippedCount++;
      } else {
        try {
          let content = fs.readFileSync(filePath, 'utf8');
          // Strip existing frontmatter if present (to avoid double frontmatter)
          let strippedContent = content;
          if (content.startsWith('---\n') || content.startsWith('---\r\n')) {
            const endIdx = content.indexOf('\n---', 3);
            if (endIdx !== -1) {
              strippedContent = content.slice(endIdx + 5);
            }
          }
          let mdContent = '';
          if (ext === '.md') {
            mdContent = strippedContent;
          } else if (ext === '.txt') {
            mdContent = content;
          } else if (ext === '.json') {
            mdContent = `# ${baseName}\n\n\`\`\`json\n${content}\n\`\`\``;
          } else if (ext === '.csv') {
            mdContent = `# ${baseName}\n\n\`\`\`csv\n${content}\n\`\`\``;
          }

          const destPath = path.join(mdDir, `${baseName}.md`);
          const frontmatter = generateSourceFrontmatter(filePath, `raw/${file}`);
          fs.writeFileSync(destPath, frontmatter + mdContent, 'utf8');
          status = '✅ Processed';
          action = `Converted to markdown at \`md/${baseName}.md\``;
          processedCount++;
        } catch (err) {
          status = '❌ Error';
          action = `Failed to process: ${err.message}`;
          skippedCount++;
        }
      }
    } else if (EXT_PROMPT.includes(ext)) {
      format = ext.substring(1).toUpperCase();
      totalDiscovered++;

      if (!isSelected) {
        status = '⚠️ Skipped';
        action = `Format ${EXT_LABELS[ext]} excluded by user selection.`;
        skippedCount++;
      } else {
        // Check dependency
        const dep = EXT_DEPS[ext];
        if (dep && !isDepInstalled(dep.pkg)) {
          let install = false;
          if (options.depPromptCallback) {
            install = await options.depPromptCallback(ext);
          } else if (options.autoAcceptPrompt) {
            install = true;
          }

          if (install) {
            try {
              const execSync = require('child_process').execSync;
              const skillDir = path.resolve(__dirname, '..');
              console.log(`Installing ${dep.pkg}...`);
              execSync(`npm install ${dep.pkg}`, { cwd: skillDir, stdio: 'inherit' });
              console.log(`${dep.pkg} installed.`);
            } catch (err) {
              status = '❌ Error';
              action = `Failed to install ${dep.pkg}: ${err.message}`;
              skippedCount++;
              registry.push({ name: `raw/${file}`, format, size: stat.size, status, action });
              continue;
            }
          } else {
            status = '⚠️ Skipped';
            action = `Dependency ${dep.pkg} not installed. Skipped.`;
            skippedCount++;
            registry.push({ name: `raw/${file}`, format, size: stat.size, status, action });
            continue;
          }
        }

        const destPath = path.join(mdDir, `${baseName}.md`);
        if (fs.existsSync(destPath)) {
          status = '✅ Processed';
          action = `Already converted to markdown at \`md/${baseName}.md\``;
          processedCount++;
        } else {
          let approve = options.autoAcceptPrompt;
          if (!approve && options.promptCallback) {
            approve = await options.promptCallback(file);
          }

          if (approve) {
            try {
              if (ext === '.docx') {
                const mammoth = require('mammoth');
                const result = await mammoth.convertToMarkdown({ path: filePath });
                const docxFm = generateSourceFrontmatter(filePath, `raw/${file}`);
                fs.writeFileSync(destPath, docxFm + result.value, 'utf8');
                status = '✅ Processed';
                action = `Converted DOCX to markdown at \`md/${baseName}.md\``;
                processedCount++;
              } else if (ext === '.pdf') {
                try {
                  const pdfParse = require('pdf-parse');
                  const dataBuffer = fs.readFileSync(filePath);
                  const data = await pdfParse(dataBuffer);
                  const mdContent = `# ${baseName}\n\n${data.text}`;
                  const pdfFm = generateSourceFrontmatter(filePath, `raw/${file}`);
                  fs.writeFileSync(destPath, pdfFm + mdContent, 'utf8');
                  status = '✅ Processed';
                  action = `Converted PDF to markdown at \`md/${baseName}.md\``;
                  processedCount++;
                } catch (pdfErr) {
                  const mockContent = `# ${baseName}\n\n*PDF Content Ingested (Placeholder)*\n\n[PDF: ${file} needs manual verification or a PDF parser package to extract text fully.]`;
                  const pdfMockFm = generateSourceFrontmatter(filePath, `raw/${file}`);
                  fs.writeFileSync(destPath, pdfMockFm + mockContent, 'utf8');
                  status = '✅ Processed (Partial)';
                  action = `Created placeholder markdown at \`md/${baseName}.md\`. PDF parsing failed: ${pdfErr.message}`;
                  processedCount++;
                }
              } else if (ext === '.xlsx') {
                const XLSX = require('xlsx');
                const workbook = XLSX.readFile(filePath);
                let mdContent = `# ${baseName}\n\n`;
                workbook.SheetNames.forEach((sheetName, idx) => {
                  const sheet = workbook.Sheets[sheetName];
                  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                  mdContent += `## Sheet: ${sheetName}\n\n`;
                  if (json.length > 0) {
                    const headers = Object.keys(json[0]);
                    mdContent += `| ${headers.join(' | ')} |\n`;
                    mdContent += `| ${headers.map(() => '---').join(' | ')} |\n`;
                    json.forEach(row => {
                      mdContent += `| ${headers.map(h => String(row[h] ?? '')).join(' | ')} |\n`;
                    });
                  } else {
                    // Convert to CSV-ish text
                    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
                    for (let r = range.s.r; r <= range.e.r; r++) {
                      const row = [];
                      for (let c = range.s.c; c <= range.e.c; c++) {
                        const addr = XLSX.utils.encode_cell({ r, c });
                        row.push(String(sheet[addr]?.v ?? ''));
                      }
                      mdContent += `| ${row.join(' | ')} |\n`;
                    }
                  }
                  mdContent += '\n';
                });
                const xlsxFm = generateSourceFrontmatter(filePath, `raw/${file}`);
                fs.writeFileSync(destPath, xlsxFm + mdContent, 'utf8');
                status = '✅ Processed';
                action = `Converted XLSX to markdown at \`md/${baseName}.md\``;
                processedCount++;
              }
            } catch (err) {
              status = '❌ Error';
              action = `Failed to convert: ${err.message}`;
              skippedCount++;
            }
          } else {
            status = '⚠️ Skipped';
            action = `Extraction declined or skipped.`;
            skippedCount++;
          }
        }
      }
    } else if (EXT_NO.includes(ext)) {
      format = ext.substring(1).toUpperCase();
      totalDiscovered++;
      status = '🚫 Blocked';
      action = 'Unsupported format (needs manual action)';
      skippedCount++;
    } else {
      totalDiscovered++;
      status = '⚠️ Skipped';
      action = 'Unknown extension';
      skippedCount++;
    }

    registry.push({
      name: `raw/${file}`,
      format,
      size: stat.size,
      status,
      action
    });
  }

  logs.push(`*   **${timestamp}:** Discovered ${totalDiscovered} files.`);

  // Consolidate files in alphabetical order into md/_all.md
  const consolidationTimestamp = new Date().toISOString();
  let consolidatedContent = `---
title: "Converted Documents Consolidation"
generated_at: "${consolidationTimestamp}"
generated_by: "traNNsform v${TRANNNSFORM_VERSION}"
source_count: ${processedCount}
---

# Converted Documents Consolidation

`;
  const mdFiles = fs.readdirSync(mdDir)
    .filter(f => f.endsWith('.md') && f !== '_all.md')
    .sort();

  for (let i = 0; i < mdFiles.length; i++) {
    const mdFile = mdFiles[i];
    const mdPath = path.join(mdDir, mdFile);
    const content = fs.readFileSync(mdPath, 'utf8').trim();
    consolidatedContent += '---\n\n' + content + '\n\n';
  }

  fs.writeFileSync(path.join(mdDir, '_all.md'), consolidatedContent, 'utf8');
  logs.push(`*   **${timestamp}:** Converted ${processedCount} files to Markdown in \`md/\`.`);
  logs.push(`*   **${timestamp}:** Consolidated documents in alphabetical order into \`md/_all.md\`.`);

  // Build index.md
  let indexContent = `# traNNsform Ingestion Manifest & Processing Log\n\n`;
  indexContent += `## Ingestion Status\n`;
  indexContent += `*   **Total Files Discovered:** ${totalDiscovered}\n`;
  indexContent += `*   **Processed successfully:** ${processedCount}\n`;
  indexContent += `*   **Skipped/Pending review:** ${skippedCount}\n\n`;

  indexContent += `## Documents Registry\n`;
  indexContent += `| File Name | Format | Size (bytes) | Status | Actions Taken |\n`;
  indexContent += `| :--- | :--- | :--- | :--- | :--- |\n`;
  for (const reg of registry) {
    indexContent += `| \`${reg.name}\` | ${reg.format} | ${reg.size} B | ${reg.status} | ${reg.action} |\n`;
  }
  indexContent += `\n---\n\n## Action History Log\n`;
  for (const log of logs) {
    indexContent += `${log}\n`;
  }

  fs.writeFileSync(indexFile, indexContent, 'utf8');

  return {
    totalDiscovered,
    processedCount,
    skippedCount,
    registry
  };
}

module.exports = {
  scanAndProcess,
  detectFormats,
  isDepInstalled,
  getSupportedFormats,
  computeFileHash,
  generateSourceFrontmatter,
  EXT_LABELS,
  EXT_DEPS
};