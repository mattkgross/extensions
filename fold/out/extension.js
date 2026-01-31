"use strict";
/**
 * @fileoverview Entry point for the TypeScript Auto-Fold extension.
 * Handles activation, event listeners, command registration, and fold orchestration.
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const foldAnalyzer_1 = require("./foldAnalyzer");
const foldExecutor_1 = require("./foldExecutor");
// ============================================================================
// State Management
// ============================================================================
/**
 * Tracks document URIs that have already been folded this session.
 * Prevents re-folding when switching between already-open tabs.
 */
const foldedDocuments = new Set();
// ============================================================================
// Extension Lifecycle
// ============================================================================
/**
 * Called when the extension is activated.
 * Sets up event listeners and registers commands.
 * @param context - The extension context for managing subscriptions.
 */
function activate(context) {
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
function deactivate() {
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
async function handleEditorActivation(editor) {
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
async function performFold(editor, force) {
    const uri = editor.document.uri.toString();
    // Skip if already folded (unless forcing).
    if (!force && foldedDocuments.has(uri)) {
        return;
    }
    const config = getConfig();
    const text = editor.document.getText();
    const fileName = editor.document.fileName;
    // Analyze the document for fold targets.
    const targets = (0, foldAnalyzer_1.analyzeFoldTargets)(text, fileName, config);
    if (targets.length > 0) {
        // Execute the folds.
        await (0, foldExecutor_1.executeFolds)(editor, targets);
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
function getConfig() {
    const config = vscode.workspace.getConfiguration('tsAutoFold');
    return {
        foldImports: config.get('foldImports', true),
        foldTypes: config.get('foldTypes', true),
        foldFunctions: config.get('foldFunctions', true),
        foldDelay: config.get('foldDelay', 100),
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
function isTypeScriptFile(document) {
    return document.languageId === 'typescript' || document.languageId === 'typescriptreact';
}
/**
 * Creates a promise that resolves after a specified delay.
 * @param ms - The delay in milliseconds.
 * @returns A promise that resolves after the delay.
 */
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=extension.js.map