const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1) Watch monorepo
config.watchFolders = [workspaceRoot];

// 2) Map internal workspace packages
config.resolver.extraNodeModules = {
  '@rov/types': path.resolve(workspaceRoot, 'packages/types'),
  '@rov/firebase': path.resolve(workspaceRoot, 'packages/firebase'),
  '@rov/logic': path.resolve(workspaceRoot, 'packages/logic'),
};

// 3) Configure asset extensions (exclude audio to prevent jimp errors)
const assetExts = config.resolver.assetExts.filter(
  ext => !['mp3', 'wav', 'ogg', 'm4a', 'aac', 'mpeg', 'flac', 'aiff', 'wma'].includes(ext)
);

// 4) Add source extensions including audio as source (not asset)
const sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];

config.resolver.assetExts = assetExts;
config.resolver.sourceExts = sourceExts;

// 5) Enable package exports to fix react-map-gl dynamic imports
config.resolver.unstable_enablePackageExports = true;

// 6) Disable require cycle warnings (common in React Native)
config.resolver.unstable_enableSymlinks = true;

// 7) Disable strict mode for web to allow dynamic imports
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config;
