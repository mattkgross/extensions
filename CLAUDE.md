# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Monorepo of independent extensions (browser, VS Code, CLI, etc.). Each extension lives in its own top-level directory with its own tooling, dependencies, and build process. Extensions are unrelated to each other — no shared code or dependencies between them.

## Extensions

### `fold/` - TypeScript Auto-Fold (VS Code)
Automatically folds TypeScript/TSX files when opened. Uses the TypeScript Compiler API (AST) to detect foldable regions and VS Code's built-in `editor.fold` command to collapse them.

**Architecture:** `extension.ts` (entry point, event handlers, session state) -> `foldAnalyzer.ts` (AST parsing via `ts.createSourceFile`, fold target detection) -> `foldExecutor.ts` (executes `editor.fold` with `selectionLines`). Types in `types.ts`.

**Key design decisions:**
- Uses `getStart()` (not `getFullStart()`) to exclude JSDoc from fold ranges so comments stay visible.
- Listens on `onDidChangeActiveTextEditor` (not `onDidOpenTextDocument`) to avoid timing issues.
- Tracks folded URIs in a `Set<string>` to fold each file only once per session.
- Does NOT register a custom `FoldingRangeProvider` to avoid conflicting with VS Code's built-in TypeScript support.

**Build:** `cd fold/ && npm install && npm run compile`. Watch mode: `npm run watch`. Package: `npm run package`. Test via F5 (Extension Development Host).

### `claude-export/` - Claude Chat Export (Firefox)
Exports Claude.ai conversations to Markdown files. Click the toolbar icon, press Export, and a .md file downloads.

**Architecture:** `popup.js` (button click handler, sends message to content script) -> `content.js` (fetches Claude API, builds markdown, triggers download). No background script. No build step.

**Key design decisions:**
- On-demand fetch approach: content script calls Claude's internal API directly (same-origin with cookies) rather than intercepting webRequest traffic.
- Manifest V3 with minimal permissions (`activeTab` + content script on `claude.ai`).
- Markdown builder handles text, artifacts (create/rewrite/update), REPL analysis blocks, tool results, and file attachments.

**Install:** Load temporarily via `about:debugging#/runtime/this-firefox` -> "Load Temporary Add-on..." -> select `claude-export/manifest.json`.
