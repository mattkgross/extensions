# TypeScript Auto-Fold

A VS Code/Cursor extension that automatically folds TypeScript and TSX files when opened, showing method signatures while hiding implementation details.

## Features

- **Fold imports** - Collapses all import statements into a single fold
- **Fold type/interface bodies** - Collapses type definitions (but not constants)
- **Fold function/method bodies** - Keeps JSDoc visible, folds only the body
- **Class handling** - Expands class structure, folds individual method bodies
- **Re-fold command** - Press `Cmd+Shift+[` to re-fold after manual unfolds

## Installation

### From Source

1. Clone or copy the extension to your extensions directory
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build
4. Copy the entire `fold` folder to:
   - **macOS**: `~/.vscode/extensions/` or `~/.cursor/extensions/`
   - **Windows**: `%USERPROFILE%\.vscode\extensions\`
   - **Linux**: `~/.vscode/extensions/`

### Development

1. Open this folder in VS Code/Cursor
2. Run `npm install`
3. Press `F5` to launch the Extension Development Host
4. Open any `.ts` or `.tsx` file to see auto-folding in action

## Configuration

Available settings in `Settings > Extensions > TypeScript Auto-Fold`:

| Setting | Default | Description |
|---------|---------|-------------|
| `tsAutoFold.foldImports` | `true` | Fold import statement blocks |
| `tsAutoFold.foldTypes` | `true` | Fold type and interface bodies |
| `tsAutoFold.foldFunctions` | `true` | Fold function and method bodies |
| `tsAutoFold.foldDelay` | `100` | Delay (ms) before folding after file opens |

## Keybindings

| Command | Keybinding | Description |
|---------|------------|-------------|
| TypeScript: Re-fold All | `Cmd+Shift+[` (Mac) / `Ctrl+Shift+[` (Windows/Linux) | Re-fold the current file |

## How It Works

The extension uses the TypeScript Compiler API to parse files and identify foldable regions:

1. **AST-based detection** - Accurately distinguishes `type X = {...}` from `const x = {...}`
2. **JSDoc preservation** - Uses `getStart()` vs `getFullStart()` to keep JSDoc visible
3. **Session tracking** - Only auto-folds each file once per session (tab switching won't re-fold)
4. **Built-in fold ranges** - Leverages VS Code's native folding instead of custom ranges

## What Gets Folded

| Construct | Behavior |
|-----------|----------|
| Import statements | Folded as a single block |
| Type aliases (`type X = {...}`) | Body folded |
| Interfaces | Body folded |
| Functions (declaration, expression, arrow) | Body folded, signature visible |
| Class methods | Body folded, class structure visible |
| Constructors, getters, setters | Body folded |
| Constants (`const x = {...}`) | **Not folded** |
| Single-line constructs | Not folded |

## License

MIT
