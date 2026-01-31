/**
 * @fileoverview Entry point for the TypeScript Auto-Fold extension.
 * Handles activation, event listeners, command registration, and fold orchestration.
 */

import * as vscode from 'vscode';
import { analyzeFoldTargets } from './foldAnalyzer';
import { executeFolds } from './foldExecutor';
import { FoldConfig } from './types';

// ============================================================================
// State Management
// ============================================================================

/**
 * Tracks document URIs that have already been folded this session.
 * Prevents re-folding when switching between already-open tabs.
 */
const foldedDocuments = new Set<string>();

// ============================================================================
// Extension Lifecycle
// ============================================================================

/**
 * Called when the extension is activated.
 * Sets up event listeners and registers commands.
 * @param context - The extension context for managing subscriptions.
 */
export function activate(context: vscode.ExtensionContext): void {
  // Register the re-fold command.
  const refoldCommand = vscode.commands.registerCommand('tsAutoFold.refold', async () => {
    const editor = vscode.window.activeTextEditor;
    if (editor && isTypeScriptFile(editor.document)) {
      await performFold(editor, true);
    }
  });

  // Listen for active editor changes.
  const editorChangeListener = vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    if (editor && isTypeScriptFile(editor.document)) {
      await handleEditorActivation(editor);
    }
  });

  // Also handle the currently active editor on activation.
  if (vscode.window.activeTextEditor && isTypeScriptFile(vscode.window.activeTextEditor.document)) {
    handleEditorActivation(vscode.window.activeTextEditor);
  }

  context.subscriptions.push(refoldCommand, editorChangeListener);
}

/**
 * Called when the extension is deactivated.
 * Cleans up any resources.
 */
export function deactivate(): void {
  foldedDocuments.clear();
}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Handles activation of a text editor.
 * Folds the document if it hasn't been folded this session.
 * @param editor - The activated text editor.
 */
async function handleEditorActivation(editor: vscode.TextEditor): Promise<void> {
  const uri = editor.document.uri.toString();

  // Skip if already folded this session.
  if (foldedDocuments.has(uri)) {
    return;
  }

  const config = getConfig();

  // Debounce to let VS Code fully initialize the editor.
  await delay(config.foldDelay);

  // Verify the editor is still active after the delay.
  if (vscode.window.activeTextEditor !== editor) {
    return;
  }

  await performFold(editor, false);
}

// ============================================================================
// Fold Operations
// ============================================================================

/**
 * Performs the fold operation on the given editor.
 * @param editor - The text editor to fold.
 * @param force - If true, folds even if already folded this session.
 */
async function performFold(editor: vscode.TextEditor, force: boolean): Promise<void> {
  const uri = editor.document.uri.toString();

  // Skip if already folded (unless forcing).
  if (!force && foldedDocuments.has(uri)) {
    return;
  }

  const config = getConfig();
  const text = editor.document.getText();
  const fileName = editor.document.fileName;

  // Analyze the document for fold targets.
  const targets = analyzeFoldTargets(text, fileName, config);

  if (targets.length > 0) {
    // Execute the folds.
    await executeFolds(editor, targets);
  }

  // Mark as folded.
  foldedDocuments.add(uri);
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Retrieves the current extension configuration.
 * @returns The fold configuration with all settings.
 */
function getConfig(): FoldConfig {
  const config = vscode.workspace.getConfiguration('tsAutoFold');

  return {
    foldImports: config.get<boolean>('foldImports', true),
    foldTypes: config.get<boolean>('foldTypes', true),
    foldFunctions: config.get<boolean>('foldFunctions', true),
    foldDelay: config.get<number>('foldDelay', 100),
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Checks if the document is a TypeScript or TSX file.
 * @param document - The text document to check.
 * @returns True if the document is TypeScript or TSX.
 */
function isTypeScriptFile(document: vscode.TextDocument): boolean {
  return document.languageId === 'typescript' || document.languageId === 'typescriptreact';
}

/**
 * Creates a promise that resolves after a specified delay.
 * @param ms - The delay in milliseconds.
 * @returns A promise that resolves after the delay.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
