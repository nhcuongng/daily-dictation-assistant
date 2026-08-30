const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
let hasErrors = false;
let hasWarnings = false;

function logInfo(msg) { console.log(`\x1b[34m[INFO]\x1b[0m ${msg}`); }
function logSuccess(msg) { console.log(`\x1b[32m[PASS]\x1b[0m ${msg}`); }
function logWarning(msg) { console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`); hasWarnings = true; }
function logError(msg) { console.log(`\x1b[31m[FAIL]\x1b[0m ${msg}`); hasErrors = true; }

console.log('=============================================');
console.log('🛡️  Chrome Web Store Policy Pre-check Scanner');
console.log('=============================================\n');

// 1. Check Manifest
const manifestPath = path.join(projectRoot, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  logError('manifest.json not found!');
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
} catch (e) {
  logError('manifest.json is not valid JSON!');
  process.exit(1);
}

// 1.1 Manifest Version
if (manifest.manifest_version !== 3) {
  logError(`Manifest version is ${manifest.manifest_version}. Must be 3 for new extensions.`);
} else {
  logSuccess('Manifest version is 3.');
}

// 1.2 Required fields
const requiredFields = ['name', 'version', 'description'];
requiredFields.forEach(field => {
  if (!manifest[field] || manifest[field].trim() === '') {
    logError(`Missing required field in manifest: "${field}"`);
  } else {
    logSuccess(`Field "${field}" is present.`);
  }
});

// 1.3 Permissions
const permissions = manifest.permissions || [];
const hostPermissions = manifest.host_permissions || [];

if (permissions.includes('tabs')) {
  logWarning('"tabs" permission requested. CWS requires strict justification. Consider "activeTab" instead if possible.');
}
if (permissions.includes('downloads')) {
  logWarning('"downloads" permission requested.');
}

const broadHosts = ['*://*/*', '<all_urls>'];
hostPermissions.forEach(hp => {
  if (broadHosts.includes(hp)) {
    logWarning(`Broad host permission "${hp}" requested. This will trigger a deep manual review by Google.`);
  } else {
    logSuccess(`Host permission "${hp}" looks scoped.`);
  }
});

// 1.4 Icons
if (!manifest.icons) {
  logWarning('No "icons" field defined in manifest.json.');
} else {
  const missingIcons = [];
  Object.values(manifest.icons).forEach(iconPath => {
    if (!fs.existsSync(path.join(projectRoot, iconPath))) {
      missingIcons.push(iconPath);
    }
  });
  if (missingIcons.length > 0) {
    logError(`Missing icon files: ${missingIcons.join(', ')}`);
  } else {
    logSuccess('All declared icons exist.');
  }
}

// 2. Scan JS files for dangerous functions
function scanDirectoryForJS(dir, jsFiles = []) {
  if (!fs.existsSync(dir)) return jsFiles;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDirectoryForJS(fullPath, jsFiles);
    } else if (file.endsWith('.js') && !file.includes('policy-check.js')) {
      jsFiles.push(fullPath);
    }
  }
  return jsFiles;
}

const scriptsDir = path.join(projectRoot, 'scripts');
const jsFiles = scanDirectoryForJS(scriptsDir);

const dangerousPatterns = [
  { regex: new RegExp('\\beval\\s*\\(', 'g'), name: 'eval()' },
  { regex: new RegExp('\\bnew\\s+Function\\s*\\(', 'g'), name: 'new Function()' },
  { regex: new RegExp('\\bdocument\\.write\\s*\\(', 'g'), name: 'document.write()' },
  { regex: /innerHTML\s*=/g, name: 'innerHTML assignment (Warning: ensure no raw user input is used)' }
];

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  const relPath = path.relative(projectRoot, file);
  dangerousPatterns.forEach(pattern => {
    const matches = content.match(pattern.regex);
    if (matches) {
      if (pattern.name.includes('Warning')) {
        logWarning(`Found ${pattern.name} in ${relPath} (${matches.length} occurrences). Check for XSS vulnerabilities.`);
      } else {
        logError(`Found dangerous function ${pattern.name} in ${relPath}. This is strictly forbidden in Manifest V3.`);
      }
    }
  });
});

console.log('\n=============================================');
if (hasErrors) {
  console.log('\x1b[31m❌ Scan completed with ERRORS. Please fix them before publishing.\x1b[0m');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\x1b[33m⚠️ Scan completed with WARNINGS. Review them before publishing.\x1b[0m');
  process.exit(0);
} else {
  console.log('\x1b[32m✅ Scan completed successfully. Your extension looks good for CWS!\x1b[0m');
  process.exit(0);
}
