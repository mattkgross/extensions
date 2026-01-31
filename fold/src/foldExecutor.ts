/**
 * @fileoverview Executes fold commands on VS Code editors.
 * Uses the built-in editor.fold command to collapse regions identified by the analyzer.
 */

import * as vscode from 'vscode';
import { FoldTarget } from './types';

/**
 * Executes fold operations for all specified targets in the given editor.
 * Uses VS Code's built-in fold command with selectionLines to fold specific regions.
 * @param editor - The text editor to perform folds in.
 * @param targets - An array of fold targets to collapse.
 */
export async function executeFolds(editor: vscode.TextEditor, targets: FoldTarget[]): Promise<void> {
  if (targets.length === 0) {
    return;
  }

  // Extract the start lines from all targets.
  const linesToFold = targets.map((target) => target.startLine);

  // Execute the fold command with all lines at once.
  // The selectionLines parameter tells VS Code which lines to fold at.
  await vscode.commands.executeCommand('editor.fold', {
    selectionLines: linesToFold,
  });
}

/**
 * Unfolds all regions in the given editor.
 * Useful for testing or resetting the fold state.
 * @param editor - The text editor to unfold.
 */
export async function executeUnfoldAll(editor: vscode.TextEditor): Promise<void> {
  await vscode.commands.executeCommand('editor.unfoldAll');
}
