#!/usr/bin/env node

/**
 * Setup Diagnostic Script
 * Run this to check if your environment is configured correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Realm of Valor - Setup Diagnostic\n');

let hasErrors = false;

// Check 1: .env file exists
console.log('1️⃣ Checking .env file...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✅ .env file found');

  // Read and parse .env
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID',
    'EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN',
  ];

  requiredVars.forEach(varName => {
    const regex = new RegExp(`${varName}=(.+)`);
    const match = envContent.match(regex);
    if (match && match[1] && match[1].trim() !== '') {
      console.log(`   ✅ ${varName} is set`);
    } else {
      console.log(`   ❌ ${varName} is MISSING or EMPTY`);
      hasErrors = true;
    }
  });
} else {
  console.log('   ❌ .env file NOT FOUND');
  console.log('   📝 Expected location:', envPath);
  hasErrors = true;
}

// Check 2: node_modules exists
console.log('\n2️⃣ Checking node_modules...');
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✅ node_modules found');
} else {
  console.log('   ❌ node_modules NOT FOUND');
  console.log('   💡 Run: pnpm install');
  hasErrors = true;
}

// Check 3: package.json
console.log('\n3️⃣ Checking package.json...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('   ✅ package.json found');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  // Check key dependencies
  const requiredDeps = [
    'expo',
    'expo-router',
    'react',
    'react-native',
    'firebase',
    '@tanstack/react-query',
  ];

  requiredDeps.forEach(dep => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      console.log(`   ✅ ${dep} installed`);
    } else {
      console.log(`   ❌ ${dep} MISSING`);
      hasErrors = true;
    }
  });
} else {
  console.log('   ❌ package.json NOT FOUND');
  hasErrors = true;
}

// Check 4: Key files exist
console.log('\n4️⃣ Checking key app files...');
const keyFiles = [
  'app/_layout.tsx',
  'app/index.tsx',
  'app/(tabs)/index.tsx',
  'lib/firebase.ts',
  'lib/firebase-context.tsx',
];

keyFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} MISSING`);
    hasErrors = true;
  }
});

// Check 5: TypeScript config
console.log('\n5️⃣ Checking TypeScript config...');
const tsconfigPath = path.join(__dirname, 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  console.log('   ✅ tsconfig.json found');
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
    console.log('   ✅ Path aliases configured');
  } else {
    console.log('   ⚠️  Path aliases not configured');
  }
} else {
  console.log('   ❌ tsconfig.json NOT FOUND');
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ ISSUES FOUND - Please fix the errors above');
  console.log('\n📚 See TROUBLESHOOTING.md for help');
  process.exit(1);
} else {
  console.log('✅ ALL CHECKS PASSED');
  console.log('\n🚀 You\'re ready to run the app!');
  console.log('\n   Run: pnpm start');
  console.log('   Then press "a" for Android or "i" for iOS');
  process.exit(0);
}
