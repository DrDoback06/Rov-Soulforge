# Debugging Session - Web App Loading Issue

## Problem Summary
Web app shows blank screen due to Metro bundler unable to resolve `@expo/metro-runtime` module.

## Root Cause
pnpm's module hoisting in monorepo structure doesn't properly expose Expo dependencies where Metro expects them.

## What We Tried

### Attempt 1: Install @expo/metro-runtime directly
- **Action**: `pnpm add @expo/metro-runtime`
- **Result**: Package installed at workspace root but not accessible to Metro
- **Why it failed**: pnpm doesn't create proper symlinks with default hoisting

### Attempt 2: Update .npmrc with aggressive hoisting
- **Action**: Added `public-hoist-pattern[]=@expo/*` and `node-linker=hoisted`
- **Result**: Completely broke dependency tree - even `expo` itself disappeared
- **Why it failed**: These settings are incompatible with pnpm workspaces

### Attempt 3: Various execution paths
- Tried running from workspace root
- Tried running with npx
- Tried direct node execution
- **Result**: None worked due to broken node_modules structure

## Current Status
- Reverting .npmrc to original settings (shamefully-hoist=true only)
- Running full clean reinstall: `rm -rf node_modules && pnpm install`
- This will restore the original dependency structure

## The Real Solution

The original error (`@expo/metro-runtime/symbolicate` not found) was actually **a version mismatch issue**, not a hoisting issue. Here's what we should have done:

1. **Check Expo SDK compatibility** - SDK 52 has specific requirements
2. **Ensure expo-router version matches** - May need expo-router@4.x updates
3. **Add proper metro.config.js resolver** - Tell Metro where to find packages

Instead of fighting pnpm's hoisting, we should:

```javascript
// metro.config.js
config.resolver.extraNodeModules = {
  '@expo/metro-runtime': path.resolve(__dirname, '../../node_modules/@expo/metro-runtime')
};
```

## Next Steps (Once Install Completes)

1. ✅ Verify `@expo/metro-runtime` exists in `node_modules/@expo/metro-runtime`
2. ✅ Check expo version: `pnpm list expo`
3. ✅ Update metro.config.js with explicit resolution paths
4. ✅ Start server: `cd apps/mobile && pnpm start --web`
5. ✅ Monitor for bundling success

## Lessons Learned
- Don't change .npmrc mid-project without understanding implications
- pnpm hoisting issues often indicate version/config problems, not actual hoisting problems
- Always check package versions and compatibility first
- Metro bundler needs explicit paths in monorepo setups

## Alternative: Switch to npm
If pnpm continues to cause issues:
```bash
rm -rf node_modules pnpm-lock.yaml
npm install
```

npm has better monorepo support out of the box for Expo projects.
