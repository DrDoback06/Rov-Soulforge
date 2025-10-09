const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Add explicit module resolution for @expo packages and React (pnpm monorepo fix)
config.resolver.extraNodeModules = {
  '@expo/metro-runtime': path.resolve(workspaceRoot, 'node_modules/@expo/metro-runtime'),
  'react': path.resolve(workspaceRoot, 'node_modules/react'),
  'react-dom': path.resolve(workspaceRoot, 'node_modules/react-dom'),
  'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
  'react-native-web': path.resolve(workspaceRoot, 'node_modules/react-native-web'),
};

// 4. Force single copy of React packages
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName === 'react-dom' || moduleName === 'react-native' || moduleName === 'react-native-web') {
    return {
      filePath: path.resolve(workspaceRoot, 'node_modules', moduleName, 'index.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

// 5. Allow hierarchical lookup for better compatibility
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
