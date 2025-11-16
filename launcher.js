#!/usr/bin/env node

/**
 * Realm of Valor - Application Launcher
 *
 * One-click launcher for the entire app ecosystem
 * Handles dependency installation, environment setup, and server launching
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Track running processes
const runningProcesses = [];

// Cleanup handler
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Shutting down all servers...${colors.reset}`);
  runningProcesses.forEach(proc => {
    try {
      proc.kill('SIGINT');
    } catch (err) {
      // Process already dead
    }
  });
  process.exit(0);
});

/**
 * Print banner
 */
function printBanner() {
  console.clear();
  console.log(`
${colors.cyan}╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     ${colors.bright}🗡️  REALM OF VALOR - LAUNCHER 🛡️${colors.reset}${colors.cyan}              ║
║                                                          ║
║          GPS-Enabled Fitness RPG Companion App           ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝${colors.reset}
`);
}

/**
 * Check if a command exists
 */
function commandExists(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check prerequisites
 */
function checkPrerequisites() {
  console.log(`${colors.blue}🔍 Checking prerequisites...${colors.reset}\n`);

  const checks = [
    { name: 'Node.js', command: 'node', required: true },
    { name: 'pnpm', command: 'pnpm', required: true },
    { name: 'Git', command: 'git', required: false }
  ];

  let allPassed = true;

  checks.forEach(check => {
    const exists = commandExists(check.command);
    const status = exists
      ? `${colors.green}✓ Installed${colors.reset}`
      : `${colors.red}✗ Missing${colors.reset}`;

    console.log(`  ${check.name.padEnd(15)} ${status}`);

    if (!exists && check.required) {
      allPassed = false;
    }
  });

  console.log();

  if (!allPassed) {
    console.log(`${colors.red}❌ Missing required dependencies!${colors.reset}\n`);
    console.log(`Please install:`);
    console.log(`  • Node.js: https://nodejs.org/`);
    console.log(`  • pnpm: npm install -g pnpm`);
    console.log();
    process.exit(1);
  }

  console.log(`${colors.green}✅ All prerequisites met!${colors.reset}\n`);
}

/**
 * Check if dependencies are installed
 */
function checkDependencies() {
  const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));
  const mobileNodeModules = fs.existsSync(path.join(__dirname, 'apps/mobile/node_modules'));

  return nodeModulesExists && mobileNodeModules;
}

/**
 * Install dependencies
 */
async function installDependencies() {
  console.log(`${colors.yellow}📦 Installing dependencies...${colors.reset}\n`);
  console.log(`This may take a few minutes on first run...\n`);

  return new Promise((resolve, reject) => {
    const install = spawn('pnpm', ['install'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });

    install.on('close', (code) => {
      if (code === 0) {
        console.log(`\n${colors.green}✅ Dependencies installed successfully!${colors.reset}\n`);
        resolve();
      } else {
        console.log(`\n${colors.red}❌ Failed to install dependencies${colors.reset}\n`);
        reject(new Error('Installation failed'));
      }
    });
  });
}

/**
 * Check environment files
 */
function checkEnvironment() {
  console.log(`${colors.blue}🔧 Checking environment configuration...${colors.reset}\n`);

  const envFile = path.join(__dirname, 'apps/mobile/.env');
  const envExampleFile = path.join(__dirname, 'apps/mobile/.env.example');

  if (!fs.existsSync(envFile)) {
    if (fs.existsSync(envExampleFile)) {
      console.log(`${colors.yellow}⚠️  .env file not found. Creating from .env.example...${colors.reset}\n`);
      fs.copyFileSync(envExampleFile, envFile);
      console.log(`${colors.green}✅ .env file created!${colors.reset}`);
      console.log(`${colors.yellow}⚠️  Please edit apps/mobile/.env with your API keys${colors.reset}\n`);
    } else {
      console.log(`${colors.yellow}⚠️  No .env file found. You may need to configure environment variables.${colors.reset}\n`);
    }
  } else {
    console.log(`${colors.green}✅ Environment file found${colors.reset}\n`);
  }
}

/**
 * Launch mobile app
 */
function launchMobile() {
  console.log(`${colors.cyan}📱 Starting mobile app...${colors.reset}\n`);
  console.log(`${colors.yellow}Press 'w' for web, 'a' for Android, 'i' for iOS${colors.reset}\n`);

  const mobile = spawn('pnpm', ['start'], {
    cwd: path.join(__dirname, 'apps/mobile'),
    stdio: 'inherit',
    shell: true
  });

  runningProcesses.push(mobile);

  mobile.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${colors.red}❌ Mobile app exited with code ${code}${colors.reset}`);
    }
  });

  return mobile;
}

/**
 * Launch backend server
 */
function launchBackend() {
  console.log(`${colors.cyan}🖥️  Starting backend server...${colors.reset}\n`);

  const backendPath = path.join(__dirname, 'apps/backend');

  if (!fs.existsSync(backendPath)) {
    console.log(`${colors.yellow}⚠️  Backend not found, skipping...${colors.reset}\n`);
    return null;
  }

  const backend = spawn('pnpm', ['dev'], {
    cwd: backendPath,
    stdio: 'inherit',
    shell: true
  });

  runningProcesses.push(backend);

  backend.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${colors.red}❌ Backend exited with code ${code}${colors.reset}`);
    }
  });

  return backend;
}

/**
 * Show main menu
 */
function showMenu() {
  console.log(`${colors.bright}What would you like to do?${colors.reset}\n`);
  console.log(`  ${colors.green}1${colors.reset} - 🚀 Quick Start (Mobile App Only)`);
  console.log(`  ${colors.green}2${colors.reset} - 📱 Mobile App + 🖥️  Backend Server`);
  console.log(`  ${colors.green}3${colors.reset} - 🌐 Web Only`);
  console.log(`  ${colors.green}4${colors.reset} - 🔧 Install Dependencies Only`);
  console.log(`  ${colors.green}5${colors.reset} - ℹ️  System Info`);
  console.log(`  ${colors.green}6${colors.reset} - 🧹 Clean & Reinstall`);
  console.log(`  ${colors.green}0${colors.reset} - 🚪 Exit\n`);
}

/**
 * Show system info
 */
function showSystemInfo() {
  console.log(`${colors.cyan}System Information:${colors.reset}\n`);

  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
    const gitVersion = commandExists('git')
      ? execSync('git --version', { encoding: 'utf8' }).trim()
      : 'Not installed';

    console.log(`  Node.js:  ${colors.green}${nodeVersion}${colors.reset}`);
    console.log(`  pnpm:     ${colors.green}${pnpmVersion}${colors.reset}`);
    console.log(`  Git:      ${colors.green}${gitVersion}${colors.reset}`);

    const packageJson = require('./package.json');
    console.log(`\n  Project:  ${colors.cyan}${packageJson.name || 'Realm of Valor'}${colors.reset}`);
    console.log(`  Version:  ${colors.cyan}${packageJson.version || '1.0.0'}${colors.reset}`);

    const depsInstalled = checkDependencies();
    console.log(`\n  Dependencies: ${depsInstalled ? colors.green + '✓ Installed' : colors.red + '✗ Not Installed'}${colors.reset}`);

    const envExists = fs.existsSync(path.join(__dirname, 'apps/mobile/.env'));
    console.log(`  Environment:  ${envExists ? colors.green + '✓ Configured' : colors.yellow + '⚠ Missing'}${colors.reset}`);

  } catch (err) {
    console.log(`${colors.red}Error reading system info: ${err.message}${colors.reset}`);
  }

  console.log();
}

/**
 * Clean and reinstall
 */
async function cleanAndReinstall() {
  console.log(`${colors.yellow}🧹 Cleaning node_modules and lock files...${colors.reset}\n`);

  try {
    // Remove node_modules
    if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
      console.log('  Removing root node_modules...');
      execSync('rm -rf node_modules', { cwd: __dirname, stdio: 'inherit' });
    }

    if (fs.existsSync(path.join(__dirname, 'apps/mobile/node_modules'))) {
      console.log('  Removing mobile node_modules...');
      execSync('rm -rf apps/mobile/node_modules', { cwd: __dirname, stdio: 'inherit' });
    }

    // Remove lock file
    if (fs.existsSync(path.join(__dirname, 'pnpm-lock.yaml'))) {
      console.log('  Removing pnpm-lock.yaml...');
      fs.unlinkSync(path.join(__dirname, 'pnpm-lock.yaml'));
    }

    console.log(`\n${colors.green}✅ Cleanup complete!${colors.reset}\n`);

    // Reinstall
    await installDependencies();

  } catch (err) {
    console.log(`${colors.red}❌ Error during cleanup: ${err.message}${colors.reset}\n`);
  }
}

/**
 * Handle menu selection
 */
async function handleMenuSelection(choice) {
  switch (choice) {
    case '1':
      console.clear();
      printBanner();
      console.log(`${colors.bright}🚀 Quick Start Mode${colors.reset}\n`);
      launchMobile();
      break;

    case '2':
      console.clear();
      printBanner();
      console.log(`${colors.bright}📱 Full Stack Mode${colors.reset}\n`);
      launchBackend();
      setTimeout(() => launchMobile(), 2000); // Wait 2s for backend
      break;

    case '3':
      console.clear();
      printBanner();
      console.log(`${colors.bright}🌐 Web Mode${colors.reset}\n`);
      console.log(`${colors.cyan}Starting web server...${colors.reset}\n`);

      const web = spawn('pnpm', ['web'], {
        cwd: path.join(__dirname, 'apps/mobile'),
        stdio: 'inherit',
        shell: true
      });

      runningProcesses.push(web);
      break;

    case '4':
      console.clear();
      printBanner();
      await installDependencies();
      console.log(`${colors.green}Press any key to return to menu...${colors.reset}`);
      await waitForKey();
      return true; // Return to menu
      break;

    case '5':
      console.clear();
      printBanner();
      showSystemInfo();
      console.log(`${colors.green}Press any key to return to menu...${colors.reset}`);
      await waitForKey();
      return true; // Return to menu
      break;

    case '6':
      console.clear();
      printBanner();
      await cleanAndReinstall();
      console.log(`${colors.green}Press any key to return to menu...${colors.reset}`);
      await waitForKey();
      return true; // Return to menu
      break;

    case '0':
      console.log(`\n${colors.cyan}Thanks for using Realm of Valor! 🗡️${colors.reset}\n`);
      process.exit(0);
      break;

    default:
      console.log(`${colors.red}Invalid choice. Please try again.${colors.reset}\n`);
      return true; // Return to menu
  }

  return false; // Don't return to menu
}

/**
 * Wait for keypress
 */
function waitForKey() {
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve();
    });
  });
}

/**
 * Prompt user
 */
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Main function
 */
async function main() {
  try {
    printBanner();

    // Check prerequisites
    checkPrerequisites();

    // Check if dependencies are installed
    const depsInstalled = checkDependencies();

    if (!depsInstalled) {
      console.log(`${colors.yellow}⚠️  Dependencies not installed${colors.reset}\n`);
      const answer = await prompt(`Would you like to install them now? (y/n): `);

      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await installDependencies();
      } else {
        console.log(`\n${colors.red}Cannot proceed without dependencies. Exiting.${colors.reset}\n`);
        process.exit(1);
      }
    }

    // Check environment
    checkEnvironment();

    // Show menu and get choice
    let returnToMenu = true;

    while (returnToMenu) {
      console.clear();
      printBanner();
      showMenu();

      const choice = await prompt(`${colors.bright}Enter your choice:${colors.reset} `);
      returnToMenu = await handleMenuSelection(choice.trim());
    }

    // Keep process alive if servers are running
    if (runningProcesses.length > 0) {
      console.log(`\n${colors.green}✅ Servers running!${colors.reset}`);
      console.log(`${colors.yellow}Press Ctrl+C to stop all servers${colors.reset}\n`);

      // Wait for all processes to finish
      await Promise.all(
        runningProcesses.map(proc =>
          new Promise(resolve => proc.on('close', resolve))
        )
      );
    }

  } catch (err) {
    console.error(`\n${colors.red}❌ Error: ${err.message}${colors.reset}\n`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run main function
main();
