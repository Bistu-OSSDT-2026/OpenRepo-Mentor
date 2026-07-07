# Bug: Windows path handling fails

When the CLI runs on Windows, path handling may fail because some code assumes POSIX-style separators.

Expected behavior:
- The CLI should work on Windows and Unix-like systems.
- Path handling should use Node.js path utilities.

Possible related file:
- src/path.ts
