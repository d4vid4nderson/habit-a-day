#!/usr/bin/env node

/**
 * Auto-increment version script
 * Increments the patch version (1.0.0 -> 1.0.1) on each git push
 */

const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, '..', 'src', 'lib', 'version.ts');

// Read the current version file
const content = fs.readFileSync(versionFilePath, 'utf8');

// Extract the current version
const versionMatch = content.match(/APP_VERSION = '(\d+)\.(\d+)\.(\d+)'/);

if (!versionMatch) {
  console.error('Could not find version in version.ts');
  process.exit(1);
}

const major = parseInt(versionMatch[1], 10);
const minor = parseInt(versionMatch[2], 10);
const patch = parseInt(versionMatch[3], 10);

// Increment patch version
const newPatch = patch + 1;
const newVersion = `${major}.${minor}.${newPatch}`;

// Update the version file
const newContent = `// Auto-incremented on each git push
// Do not edit manually - this file is updated by the pre-push hook
export const APP_VERSION = '${newVersion}';
`;

fs.writeFileSync(versionFilePath, newContent);

console.log(`Version incremented: ${major}.${minor}.${patch} -> ${newVersion}`);

// Also update package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`package.json updated to version ${newVersion}`);
