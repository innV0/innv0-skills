#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const prompts = require('prompts');

const { execSync } = require('child_process');

const config = require('./config');
const scanner = require('./scanner');
const transformer = require('./transformer');

async function main() {
  const argv = minimist(process.argv.slice(2));

  // Determine if command-line args are provided
  const hasArgs = argv.scan || argv.apply || argv.src || argv.dest || argv.name;

  if (hasArgs) {
    await handleCliMode(argv);
  } else {
    await handleInteractiveMode();
  }
}

/**
 * Handle CLI mode (e.g. for agents or scripted flows)
 */
async function handleCliMode(argv) {
  let projectDir = '';

  if (argv.dest && argv.name) {
    projectDir = path.join(argv.dest, argv.name);
  } else if (argv.src && !argv.dest) {
    // If src is specified and looks like a project dir, or we use default
    projectDir = argv.src;
  } else {
    // Determine active project directory
    projectDir = getActiveProjectDir();
  }

  // Bootstrap if src is provided and project doesn't exist or we want to import raw files
  if (argv.src && argv.dest && argv.name) {
    console.log(`Bootstrapping project "${argv.name}" at "${projectDir}"...`);
    bootstrapProject(argv.src, argv.dest, argv.name);
  }

  if (!fs.existsSync(projectDir)) {
    console.error(`Error: Project directory "${projectDir}" does not exist.`);
    console.error('Please specify valid --src, --dest and --name to bootstrap it first.');
    process.exit(1);
  }

  // Run scan
  if (argv.scan) {
    console.log(`Scanning and converting documents in "${projectDir}"...`);

    const scanOptions = { autoAcceptPrompt: true };

    // Support --formats "txt,docx,pdf" to filter by extension
    if (argv.formats) {
      const rawDir = path.join(projectDir, 'raw');
      if (fs.existsSync(rawDir)) {
        const selected = argv.formats.split(',').map(f => '.' + f.trim().replace(/^\./, ''));
        scanOptions.formats = selected;
      }
    }

    const result = await scanner.scanAndProcess(projectDir, scanOptions);
    console.log(`Scan completed! Discovered: ${result.totalDiscovered}, Processed: ${result.processedCount}, Skipped: ${result.skippedCount}`);
  }

  // Apply transformation
  if (argv.apply) {
    const templateName = argv.apply;
    console.log(`Applying transformation "${templateName}" in "${projectDir}"...`);
    try {
      const result = await transformer.applyTransformation(projectDir, templateName);
      console.log(`Transformation applied successfully!`);
      console.log(`Output saved to: ${result.outputPath}`);
    } catch (err) {
      console.error(`Error applying transformation: ${err.message}`);
      process.exit(1);
    }
  }
}

/**
 * Handle Interactive terminal mode (for human users)
 */
async function handleInteractiveMode() {
  console.log('=== Welcome to traNNsform CLI ===\n');

  // Check if current directory has a project structure, or if we should load the last one
  let projectDir = getActiveProjectDir();
  let projectExists = fs.existsSync(projectDir) && fs.existsSync(path.join(projectDir, 'raw'));

  const choices = [];
  if (projectExists) {
    choices.push({ title: `Use current project: ${path.basename(projectDir)} (${projectDir})`, value: 'current' });
  }
  choices.push({ title: 'Bootstrap/Create a new project', value: 'bootstrap' });
  choices.push({ title: 'Configure default paths', value: 'configure' });
  choices.push({ title: 'Exit', value: 'exit' });

  const response = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices
  });

  if (!response.action || response.action === 'exit') {
    console.log('Goodbye!');
    return;
  }

  if (response.action === 'configure') {
    await configureDefaults();
    return handleInteractiveMode();
  }

  if (response.action === 'bootstrap') {
    projectDir = await runBootstrapperFlow();
    if (!projectDir) return handleInteractiveMode();
    projectExists = true;
  }

  // Once we have a project directory, show the project menu
  await runProjectMenu(projectDir);
}

/**
 * Configure default paths
 */
async function configureDefaults() {
  const currentDefault = config.getDefaultPath();
  const response = await prompts({
    type: 'text',
    name: 'path',
    message: 'Enter new default parent target directory:',
    initial: currentDefault
  });

  if (response.path) {
    const cleanPath = response.path.replace(/^["']|["']$/g, '').trim();
    config.saveConfig({ defaultPath: path.resolve(cleanPath) });
    console.log(`Saved default path: ${config.getDefaultPath()}`);
  }
}

/**
 * Interactive project bootstrap flow
 */
async function runBootstrapperFlow() {
  const defaultDest = config.getDefaultPath();

  const questions = [
    {
      type: 'text',
      name: 'src',
      message: 'Enter the source directory containing raw files to import:',
      validate: value => {
        const clean = value.replace(/^["']|["']$/g, '').trim();
        return fs.existsSync(clean) ? true : 'Source directory does not exist';
      }
    },
    {
      type: 'confirm',
      name: 'useSrcAsDest',
      message: 'Use the source directory as the target parent directory?',
      initial: false
    },
    {
      type: (prev, values) => values.useSrcAsDest ? null : 'text',
      name: 'dest',
      message: 'Enter the target parent directory:',
      initial: defaultDest,
      validate: value => {
        const clean = value.replace(/^["']|["']$/g, '').trim();
        return clean.length > 0 ? true : 'Target parent directory cannot be empty';
      }
    },
    {
      type: 'text',
      name: 'name',
      message: 'Enter the project name:',
      initial: (prev, values) => values.useSrcAsDest ? 'traNNsform' : 'MyTransformProject',
      validate: value => value.trim().length > 0 ? true : 'Project name cannot be empty'
    },
  ];

  const answers = await prompts(questions);

  if (!answers.src || !answers.name || (answers.useSrcAsDest === undefined) || (!answers.useSrcAsDest && !answers.dest)) {
    console.log('Bootstrapping cancelled.');
    return null;
  }

  // Clean quotes from paths
  answers.src = answers.src.replace(/^["']|["']$/g, '').trim();
  const targetDest = answers.useSrcAsDest ? answers.src : answers.dest.replace(/^["']|["']$/g, '').trim();

  const projectDir = path.join(targetDest, answers.name);
  bootstrapProject(answers.src, targetDest, answers.name);
  
  // Persist project dir as last used
  config.saveConfig({ lastProjectPath: projectDir });

  console.log(`Project successfully bootstrapped at: ${projectDir}\n`);
  return projectDir;
}

/**
 * Perform actual bootstrapping directory creation & file copying
 */
function bootstrapProject(srcDir, destParentDir, projectName) {
  const projectDir = path.join(destParentDir, projectName);
  const rawDir = path.join(projectDir, 'raw');
  const mdDir = path.join(projectDir, 'md');
  const transDir = path.join(projectDir, 'traNNsformations');
  const outputDir = path.join(projectDir, 'output');

  // Create structure
  fs.mkdirSync(projectDir, { recursive: true });
  fs.mkdirSync(rawDir, { recursive: true });
  fs.mkdirSync(mdDir, { recursive: true });
  fs.mkdirSync(transDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  // Create README.md file if project name is traNNsform
  if (projectName.toLowerCase() === 'trannsform') {
    const readmePath = path.join(projectDir, 'README.md');
    const readmeContent = `# Transform

Transform (traNNsform) is a tool to structure and process unstructured documents:
1. Scan and ingest files of various formats (.txt, .docx, .pdf, etc.).
2. Normalize them to structured Markdown.
3. Apply template-based transformations.

Agent skill: https://github.com/innV0/iNNv0_skills/tree/main/skills/innv0-trannsform
`;
    fs.writeFileSync(readmePath, readmeContent, 'utf8');

    // Clean up Rhythmic file if it was created in a previous bootstrap
    const rhythmicPath = path.join(projectDir, 'Rhythmic');
    if (fs.existsSync(rhythmicPath)) {
      try {
        fs.unlinkSync(rhythmicPath);
      } catch (err) {
        // Ignore
      }
    }
  }

  // Copy raw files from src to raw folder
  const files = fs.readdirSync(srcDir);
  let copiedCount = 0;
  for (const file of files) {
    const srcFilePath = path.join(srcDir, file);
    const destFilePath = path.join(rawDir, file);
    try {
      if (fs.statSync(srcFilePath).isFile()) {
        fs.copyFileSync(srcFilePath, destFilePath);
        copiedCount++;
      }
    } catch (err) {
      console.warn(`Warning: Could not copy file "${file}". It might be a virtual Google Drive file, shortcut, or unreadable. Error: ${err.message}`);
    }
  }

  console.log(`Copied ${copiedCount} files to raw directory.`);


}

/**
 * Interactive loop inside a specific project
 */
async function runProjectMenu(projectDir) {
  console.log(`\nActive Project: ${path.basename(projectDir)}`);
  console.log(`Path: ${projectDir}\n`);

  const response = await prompts({
    type: 'select',
    name: 'action',
    message: 'Select an action:',
    choices: [
      { title: 'Scan and process raw files', value: 'scan' },
      { title: 'Apply template transformation', value: 'transform' },
      { title: 'Create new transformation template', value: 'create_template' },
      { title: 'Back to main menu', value: 'back' }
    ]
  });

  if (response.action === 'back' || !response.action) {
    return handleInteractiveMode();
  }

  if (response.action === 'create_template') {
    await runCreateTemplateFlow(projectDir);
    return runProjectMenu(projectDir);
  }

  if (response.action === 'scan') {
    const rawDir = path.join(projectDir, 'raw');
    if (!fs.existsSync(rawDir) || fs.readdirSync(rawDir).length === 0) {
      console.log('No raw files found to scan.');
      return runProjectMenu(projectDir);
    }

    // Detect formats and ask user to select
    const detected = scanner.detectFormats(rawDir);
    const extList = Object.keys(detected);

    console.log('\nFormatos detectados en la carpeta fuente:');
    for (const ext of extList) {
      const label = scanner.EXT_LABELS[ext] || ext;
      console.log(`  - ${label}: ${detected[ext]} archivos`);
    }

    // Offer supported format choices using prompts multiselect
    const formatChoices = extList.map(ext => ({
      title: `${scanner.EXT_LABELS[ext] || ext} (${detected[ext]} archivos)`,
      value: ext,
      selected: true
    }));

    if (formatChoices.length > 1) {
      const fmtResponse = await prompts({
        type: 'multiselect',
        name: 'formats',
        message: '¿Qué formatos querés procesar?',
        instructions: '(Space para seleccionar/deseleccionar, Enter para confirmar)',
        choices: formatChoices
      });

      if (!fmtResponse.formats || fmtResponse.formats.length === 0) {
        console.log('No se seleccionaron formatos. Omitiendo scan.');
        return runProjectMenu(projectDir);
      }

      // Check dependencies for selected formats
      const depPromptCallback = async (ext) => {
        const dep = scanner.EXT_DEPS[ext];
        if (!dep) return true;
        const confirm = await prompts({
          type: 'confirm',
          name: 'value',
          message: `El formato ${scanner.EXT_LABELS[ext]} requiere instalar \`${dep.pkg}\`. ¿Querés instalarlo ahora?`,
          initial: true
        });
        if (confirm.value) {
          console.log(`Instalando ${dep.pkg}...`);
          const skillDir = path.resolve(__dirname, '..');
          execSync(`npm install ${dep.pkg}`, { cwd: skillDir, stdio: 'inherit' });
          console.log(`${dep.pkg} instalado.`);
          return true;
        }
        return false;
      };

      // Custom promptCallback for interactive mode to approve .docx/.pdf/.xlsx processing
      const promptCallback = async (filename) => {
        const confirm = await prompts({
          type: 'confirm',
          name: 'value',
          message: `Do you want to extract text from prompt-review file: "${filename}"?`,
          initial: true
        });
        return !!confirm.value;
      };

      console.log('\nScanning raw directory...');
      const result = await scanner.scanAndProcess(projectDir, {
        formats: fmtResponse.formats,
        promptCallback,
        depPromptCallback
      });
      console.log('\n=== Ingestion Manifest Created ===');
      console.log(`Processed: ${result.processedCount} files successfully.`);
      console.log(`Skipped/Needs Review: ${result.skippedCount} files.`);
      console.log(`Review the manifest log at: ${path.join(projectDir, 'index.md')}\n`);

      return runProjectMenu(projectDir);
    }

    // Fallback to original single-format flow if only one format detected
    const promptCallback = async (filename) => {
      const confirm = await prompts({
        type: 'confirm',
        name: 'value',
        message: `Do you want to extract text from prompt-review file: "${filename}"?`,
        initial: true
      });
      return !!confirm.value;
    };

    console.log('\nScanning raw directory...');
    const result = await scanner.scanAndProcess(projectDir, { promptCallback });
    console.log('\n=== Ingestion Manifest Created ===');
    console.log(`Processed: ${result.processedCount} files successfully.`);
    console.log(`Skipped/Needs Review: ${result.skippedCount} files.`);
    console.log(`Review the manifest log at: ${path.join(projectDir, 'index.md')}\n`);

    return runProjectMenu(projectDir);
  }

  if (response.action === 'transform') {
    const templates = transformer.listTemplates(projectDir);
    if (templates.length === 0) {
      console.log('No transformation templates found in traNNsformations/ directory.');
      return runProjectMenu(projectDir);
    }

    const templateResponse = await prompts({
      type: 'select',
      name: 'templateName',
      message: 'Choose a transformation template to apply:',
      choices: templates.map(t => ({ title: t, value: t }))
    });

    if (!templateResponse.templateName) {
      return runProjectMenu(projectDir);
    }

    try {
      console.log('\nApplying transformation...');
      const result = await transformer.applyTransformation(projectDir, templateResponse.templateName);
      console.log(`\nTransformation successful!`);
      console.log(`Output saved to: ${result.outputPath}`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }

    return runProjectMenu(projectDir);
  }
}

/**
 * Interactive flow to create a new transformation template
 */
async function runCreateTemplateFlow(projectDir) {
  console.log('\n=== Create New Transformation Template ===\n');

  const answers = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'Enter template name (e.g., Resumen de Bandas):',
      validate: value => value.trim().length > 0 ? true : 'Template name cannot be empty'
    },
    {
      type: 'text',
      name: 'purpose',
      message: 'Enter the purpose of this transformation:',
      validate: value => value.trim().length > 0 ? true : 'Purpose cannot be empty'
    },
    {
      type: 'text',
      name: 'instructions',
      message: 'Enter transformation instructions/criteria:',
      validate: value => value.trim().length > 0 ? true : 'Instructions cannot be empty'
    },
    {
      type: 'text',
      name: 'structure',
      message: 'Enter template markdown structure (optional):',
      initial: '### [Title]\n**Field:** [Value]'
    }
  ]);

  if (!answers.name || !answers.purpose || !answers.instructions) {
    console.log('Template creation cancelled.');
    return;
  }

  const transDir = path.join(projectDir, 'traNNsformations');
  if (!fs.existsSync(transDir)) {
    fs.mkdirSync(transDir, { recursive: true });
  }

  let fileName = answers.name.trim();
  if (!fileName.endsWith('.md')) {
    fileName += '.md';
  }

  const templatePath = path.join(transDir, fileName);
  const content = `# Transformación: ${answers.name}

## Propósito
${answers.purpose}

## Instrucciones
${answers.instructions}

## Template
${answers.structure || ''}
`;

  fs.writeFileSync(templatePath, content, 'utf8');
  console.log(`\nTemplate successfully created at: ${templatePath}`);
}

/**
 * Determine active project directory by checking:
 * 1. Current directory contains raw/
 * 2. Last used project path saved in config
 * 3. Fallback to Sample project path if exists
 */
function getActiveProjectDir() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'raw'))) {
    return cwd;
  }

  const cfg = config.getConfig();
  if (cfg.lastProjectPath && fs.existsSync(cfg.lastProjectPath)) {
    return cfg.lastProjectPath;
  }

  // Check if Sample exists in workspace root
  const workspaceSamplePath = path.join(cwd, 'Sample');
  if (fs.existsSync(workspaceSamplePath)) {
    return workspaceSamplePath;
  }

  // Fallback to relative path from script location (legacy)
  const relativeSamplePath = path.join(__dirname, '..', 'Sample');
  if (fs.existsSync(relativeSamplePath)) {
    return relativeSamplePath;
  }

  // Fallback to relative path from skill parent directory
  const skillSamplePath = path.join(__dirname, '..', '..', '..', 'Sample');
  if (fs.existsSync(skillSamplePath)) {
    return skillSamplePath;
  }

  return cwd;
}

main().catch(err => {
  console.error('An unexpected error occurred:', err);
});
