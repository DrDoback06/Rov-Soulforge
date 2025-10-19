# Metro Config Fixes Applied

**Date**: October 19, 2025  
**Status**: 🔧 In Progress

---

## Issues Found

### 1. styleq Import Error
**Error**:
```
Unable to resolve "styleq/transform-localize-style" from "react-native-web/dist/exports/StyleSheet/index.js"
```

**Root Cause**: Metro configuration had `disableHierarchicalLookup: true` and restricted `nodeModulesPaths`, preventing Metro from properly resolving npm packages in the monorepo structure.

### 2. Jimp Audio Error  
**Error**:
```
Error: Unsupported MIME type: audio/mpeg
```

**Root Cause**: Audio files were being treated as image assets and processed by jimp.

---

## Fixes Applied

### metro.config.js Changes

**Removed**:
- `config.resolver.nodeModulesPaths` - Was restricting package resolution
- `config.resolver.disableHierarchicalLookup = true` - Was blocking Metro from finding packages

**Updated**:
- Audio extensions moved from `assetExts` to `sourceExts` to prevent jimp processing
- Added more audio formats to the exclusion list

### Before:
```javascript
// 2) Only resolve from the app's node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// 4) Prevent Metro from walking up into workspace node_modules
config.resolver.disableHierarchicalLookup = true;

// 5) Configure asset extensions (exclude audio to prevent jimp errors)
config.resolver.assetExts = config.resolver.assetExts.filter(
  ext => !['mp3', 'wav', 'ogg', 'm4a', 'aac', 'mpeg'].includes(ext)
);

// 6) Add source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];
```

### After:
```javascript
// 3) Configure asset extensions (exclude audio to prevent jimp errors)
const assetExts = config.resolver.assetExts.filter(
  ext => !['mp3', 'wav', 'ogg', 'm4a', 'aac', 'mpeg', 'flac', 'aiff', 'wma'].includes(ext)
);

// 4) Add source extensions including audio as source (not asset)
const sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs', 'mp3', 'wav', 'ogg', 'm4a', 'aac', 'mpeg'];

config.resolver.assetExts = assetExts;
config.resolver.sourceExts = sourceExts;
```

---

## Why This Works

1. **Allowing Hierarchical Lookup**: Metro can now properly resolve packages in node_modules, including nested imports like `styleq/transform-localize-style`

2. **Proper Audio Handling**: Audio files are treated as source files (like .js) rather than assets, so jimp never tries to process them

3. **Simplified Configuration**: Removed overly restrictive settings that were causing more problems than they solved

---

## Testing

After applying these fixes:
1. Stop any running Metro bundler
2. Clear cache: `npx expo start --clear`
3. Verify both errors are resolved

---

## Expected Outcome

✅ `styleq/transform-localize-style` resolves correctly  
✅ No jimp audio errors  
✅ App bundles successfully for web

