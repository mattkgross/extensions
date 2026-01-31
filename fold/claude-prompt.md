# TypeScript Auto-Fold Extension for Cursor

## Overview

Create a Cursor/VS Code extension that automatically folds TypeScript/TSX files when opened, showing method signatures while hiding implementation details.

## Requirements Summary

- **Fold imports** - Collapse all import statements into a single fold
- **Fold type/interface bodies** - Collapse type definitions (NOT constants)
- **Fold function/method bodies** - Keep JSDoc visible, fold only the body
- **Class handling** - Expand class, fold individual method bodies
- **File types** - Apply to `.ts` and `.tsx` files
- **Re-fold command** - Provide `Cmd+Shift+[` to re-fold after manual unfolds

## Technical Approach

**Use TypeScript Compiler API (AST)** instead of regex because:
- Must distinguish `type X = {...}` from `const x = {...}` (regex cannot do this reliably)
- Accurate JSDoc boundary detection via `getStart()` vs `getFullStart()`
- Handles multiline, nested structures correctly

**Use VS Code's built-in fold ranges** + selective `editor.fold` commands:
- Don't register a custom `FoldingRangeProvider` (would conflict with VS Code's TypeScript support)
- Parse AST to identify which lines to fold
- Execute `editor.fold` with `{ selectionLines: [...] }`

## File Structure

```
extensions/fold/
├── src/
│   ├── extension.ts      # Entry point, event handlers, command registration
│   ├── foldAnalyzer.ts   # AST parsing, fold target detection
│   ├── foldExecutor.ts   # Execute fold commands via VS Code API
│   └── types.ts          # Type definitions
├── package.json          # Extension manifest
├── tsconfig.json
└── README.md
```

## Implementation Details

### 1. Types (`src/types.ts`)

```typescript
export interface FoldTarget {
  startLine: number;  // 0-indexed
  endLine: number;
  kind: FoldTargetKind;
}

export enum FoldTargetKind {
  ImportBlock = 'import-block',
  TypeBody = 'type-body',
  InterfaceBody = 'interface-body',
  FunctionBody = 'function-body',
  MethodBody = 'method-body',
}

export interface FoldConfig {
  foldImports: boolean;
  foldTypes: boolean;
  foldFunctions: boolean;
  foldDelay: number;  // ms to wait after file open
}
```

### 2. Fold Analyzer (`src/foldAnalyzer.ts`)

Core algorithm:
1. Parse document with `ts.createSourceFile()`
2. Traverse AST to collect fold targets:
   - **Imports**: Find contiguous import block at file start
   - **Types/Interfaces**: Find `TypeAliasDeclaration` and `InterfaceDeclaration` nodes
   - **Functions/Methods**: Find all function variants, use `getStart()` (not `getFullStart()`) to exclude JSDoc from fold range

Key insight for JSDoc handling:
```typescript
// getFullStart() includes JSDoc, getStart() excludes it
const tokenStart = node.getStart(sourceFile);  // Line AFTER JSDoc
return sourceFile.getLineAndCharacterOfPosition(tokenStart).line;
```

### 3. Fold Executor (`src/foldExecutor.ts`)

```typescript
export async function executeFolds(editor: vscode.TextEditor, targets: FoldTarget[]): Promise<void> {
  const linesToFold = targets.map(t => t.startLine);
  await vscode.commands.executeCommand('editor.fold', { selectionLines: linesToFold });
}
```

### 4. Extension Entry (`src/extension.ts`)

Event flow:
1. Listen to `onDidChangeActiveTextEditor` (not `onDidOpenTextDocument` - timing issues)
2. Check if TypeScript/TSX file
3. Skip if already folded this session (track in Set)
4. Debounce 100ms to let VS Code initialize editor
5. Analyze and fold

Track folded documents to avoid re-folding on tab switch:
```typescript
const foldedDocuments = new Set<string>();
```

### 5. Package.json Configuration

```json
{
  "name": "ts-auto-fold",
  "activationEvents": ["onLanguage:typescript", "onLanguage:typescriptreact"],
  "contributes": {
    "commands": [{ "command": "tsAutoFold.refold", "title": "TypeScript: Re-fold All" }],
    "keybindings": [{
      "command": "tsAutoFold.refold",
      "key": "ctrl+shift+[",
      "mac": "cmd+shift+[",
      "when": "editorTextFocus && (editorLangId == typescript || editorLangId == typescriptreact)"
    }],
    "configuration": {
      "properties": {
        "tsAutoFold.foldImports": { "type": "boolean", "default": true },
        "tsAutoFold.foldTypes": { "type": "boolean", "default": true },
        "tsAutoFold.foldFunctions": { "type": "boolean", "default": true },
        "tsAutoFold.foldDelay": { "type": "number", "default": 100 }
      }
    }
  }
}
```

## Edge Cases Handled

| Case | Handling |
|------|----------|
| Single-line functions/types | Skip (check `endLine > startLine`) |
| Nested functions | Both get fold targets; outer fold hides inner |
| Arrow functions in objects | Detected via AST traversal |
| Class constructors/getters/setters | Treated as methods, folded individually |
| Syntax errors in file | TypeScript parser is error-tolerant, folds what it can |
| Re-export statements | Not included in import block (different AST node type) |

## Verification

1. **Manual testing**:
   - Open `just-worker/src/durable_object/esp/braze-resource-do.ts`
   - Verify: imports folded, class expanded, all method signatures visible with bodies folded
   - Verify: JSDoc comments above methods remain visible
   - Test `Cmd+Shift+[` re-folds after manual unfold

2. **Test cases to check**:
   - File with only imports (should fold)
   - File with `type X = {...}` vs `const x = {...}` (only type folds)
   - Function with JSDoc (JSDoc visible, body folded)
   - Class with multiple methods (all signatures visible)
   - Arrow function assigned to const (body folds)
   - Nested functions (both fold)

## Dependencies

- `typescript` (devDependency) - for AST parsing
- `@types/vscode` (devDependency) - VS Code API types

No runtime dependencies needed - TypeScript is available in VS Code's runtime.
