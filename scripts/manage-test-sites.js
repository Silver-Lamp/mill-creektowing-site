#!/usr/bin/env node

import { execSync } from 'child_process';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PARENT_DIR = path.resolve(ROOT_DIR, '..');

async function main() {
  try {
    // Get list of repositories from GitHub
    console.log('Fetching repositories from GitHub...');
    const repos = execSync('gh repo list Silver-Lamp --json name', { encoding: 'utf8' });
    const parsedRepos = JSON.parse(repos)
      .filter(repo => repo.name.includes('towing-site'))
      .map(repo => repo.name);

    if (parsedRepos.length === 0) {
      console.log('No towing-site repositories found.');
      return;
    }

    // Get list of local directories
    const localDirs = fs.readdirSync(PARENT_DIR)
      .filter(dir => dir.endsWith('towing-site'))
      .map(dir => ({
        name: dir,
        path: path.resolve(PARENT_DIR, dir)
      }));

    // Prompt for action
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'List repositories', value: 'list' },
          { name: 'Delete repositories', value: 'delete' },
          { name: 'Delete local directories', value: 'delete-local' },
          { name: 'Delete both repositories and local directories', value: 'delete-all' }
        ]
      }
    ]);

    if (action === 'list') {
      console.log('\nGitHub Repositories:');
      parsedRepos.sort().forEach(repo => console.log(`- ${repo}`));
      
      console.log('\nLocal Directories:');
      localDirs.sort((a, b) => a.name.localeCompare(b.name)).forEach(dir => console.log(`- ${dir.name}`));
      return;
    }

    // Handle deletion
    if (action === 'delete' || action === 'delete-all') {
      const { reposToDelete } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'reposToDelete',
          message: 'Select repositories to delete:',
          choices: parsedRepos.map(repo => ({
            name: repo,
            value: repo,
            checked: false
          }))
        }
      ]);

      if (reposToDelete.length > 0) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to delete ${reposToDelete.length} repository(ies)?`,
            default: false
          }
        ]);

        if (confirm) {
          for (const repo of reposToDelete) {
            try {
              console.log(`Deleting repository: ${repo}...`);
              execSync(`gh repo delete Silver-Lamp/${repo} --yes`, { stdio: 'inherit' });
              console.log(`✅ Deleted repository: ${repo}`);
            } catch (err) {
              console.error(`❌ Failed to delete repository ${repo}:`, err.message);
            }
          }
        }
      }
    }

    // Handle local directory deletion
    if (action === 'delete-local' || action === 'delete-all') {
      const { dirsToDelete } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'dirsToDelete',
          message: 'Select local directories to delete:',
          choices: localDirs.map(dir => ({
            name: dir.name,
            value: dir,
            checked: false
          }))
        }
      ]);

      if (dirsToDelete.length > 0) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to delete ${dirsToDelete.length} local directory(ies)?`,
            default: false
          }
        ]);

        if (confirm) {
          for (const dir of dirsToDelete) {
            try {
              console.log(`Deleting directory: ${dir.name}...`);
              // First try to remove read-only attributes
              execSync(`chmod -R u+w "${dir.path}"`, { stdio: 'ignore' });
              // Then remove the directory
              execSync(`rm -rf "${dir.path}"`, { stdio: 'ignore' });
              console.log(`✅ Deleted directory: ${dir.name}`);
            } catch (err) {
              console.error(`❌ Failed to delete directory ${dir.name}:`, err.message);
            }
          }
        }
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main(); 