"use strict";
/**
 * @fileoverview Executes fold commands on VS Code editors.
 * Uses the built-in editor.fold command to collapse regions identified by the analyzer.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeFolds = executeFolds;
exports.executeUnfoldAll = executeUnfoldAll;
const vscode = __importStar(require("vscode"));
/**
 * Executes fold operations for all specified targets in the given editor.
 * Uses VS Code's built-in fold command with selectionLines to fold specific regions.
 * @param editor - The text editor to perform folds in.
 * @param targets - An array of fold targets to collapse.
 */
async function executeFolds(editor, targets) {
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
async function executeUnfoldAll(editor) {
    await vscode.commands.executeCommand('editor.unfoldAll');
}
//# sourceMappingURL=foldExecutor.js.map