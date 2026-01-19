---
description: Ensure that firebase imports work seamlessly in Vite projects,
  especially when dealing with mono-repos or complex dependency structures. This
  rule reminds the model to check `vite.config.ts` for alias configurations if
  module resolution issues persist with Firebase.
alwaysApply: true
---

When configuring Vite for a React project that uses Firebase, always consider adding aliases in `vite.config.ts` if you encounter "Failed to resolve import" errors for firebase subpackages (like `firebase/auth`). Specifically, alias `firebase/auth` to `firebase/auth/dist/esm/index.esm.js` (or the appropriate ESM entry point) to ensure Vite can correctly resolve the module. This is particularly important in monorepos or when package managers might install dependencies in unexpected structures.