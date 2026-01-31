/**
 * @fileoverview AST-based analyzer for identifying foldable regions in TypeScript files.
 * Uses the TypeScript Compiler API to accurately detect imports, types, interfaces,
 * functions, and methods while correctly handling JSDoc comments.
 */

import * as ts from 'typescript';
import { FoldTarget, FoldTargetKind, FoldConfig } from './types';

/**
 * Analyzes a TypeScript/TSX document and returns all foldable regions.
 * @param text - The full text content of the document.
 * @param fileName - The file name (used for determining script kind).
 * @param config - Configuration options controlling which constructs to fold.
 * @returns An array of fold targets representing foldable regions.
 */
export function analyzeFoldTargets(text: string, fileName: string, config: FoldConfig): FoldTarget[] {
  const targets: FoldTarget[] = [];

  const scriptKind = fileName.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : fileName.endsWith('.ts')
      ? ts.ScriptKind.TS
      : ts.ScriptKind.Unknown;

  const sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, scriptKind);

  if (config.foldImports) {
    const importTarget = findImportBlock(sourceFile);
    if (importTarget) {
      targets.push(importTarget);
    }
  }

  if (config.foldTypes || config.foldFunctions) {
    const bodyTargets = findFoldableNodes(sourceFile, config);
    targets.push(...bodyTargets);
  }

  return targets;
}

// ============================================================================
// Import Block Detection
// ============================================================================

/**
 * Finds the contiguous block of import statements at the start of the file.
 * Only includes ImportDeclaration nodes (not re-exports).
 * @param sourceFile - The parsed source file.
 * @returns A fold target for the import block, or undefined if no imports exist.
 */
function findImportBlock(sourceFile: ts.SourceFile): FoldTarget | undefined {
  let firstImportLine: number | undefined;
  let lastImportLine: number | undefined;

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement)) {
      const startLine = sourceFile.getLineAndCharacterOfPosition(statement.getStart(sourceFile)).line;
      const endLine = sourceFile.getLineAndCharacterOfPosition(statement.getEnd()).line;

      if (firstImportLine === undefined) {
        firstImportLine = startLine;
      }
      lastImportLine = endLine;
    } else if (firstImportLine !== undefined) {
      // Stop at first non-import statement after imports have started.
      break;
    }
  }

  if (firstImportLine !== undefined && lastImportLine !== undefined && lastImportLine > firstImportLine) {
    return {
      startLine: firstImportLine,
      endLine: lastImportLine,
      kind: FoldTargetKind.ImportBlock,
    };
  }

  return undefined;
}

// ============================================================================
// Node Body Detection
// ============================================================================

/**
 * Finds all foldable type, interface, function, and method bodies in the source file.
 * @param sourceFile - The parsed source file.
 * @param config - Configuration options.
 * @returns An array of fold targets for foldable bodies.
 */
function findFoldableNodes(sourceFile: ts.SourceFile, config: FoldConfig): FoldTarget[] {
  const targets: FoldTarget[] = [];

  /**
   * Recursively visits all nodes in the AST to find foldable constructs.
   * @param node - The current AST node.
   */
  function visit(node: ts.Node): void {
    // Type alias declarations: fold the entire type literal body.
    if (config.foldTypes && ts.isTypeAliasDeclaration(node)) {
      const target = getTypeLiteralFoldTarget(node, sourceFile);
      if (target) {
        targets.push(target);
      }
    }

    // Interface declarations: fold the body.
    if (config.foldTypes && ts.isInterfaceDeclaration(node)) {
      const target = getBracedBodyFoldTarget(node, sourceFile, FoldTargetKind.InterfaceBody);
      if (target) {
        targets.push(target);
      }
    }

    // Function declarations.
    if (config.foldFunctions && ts.isFunctionDeclaration(node) && node.body) {
      const target = getFunctionBodyFoldTarget(node, node.body, sourceFile, FoldTargetKind.FunctionBody);
      if (target) {
        targets.push(target);
      }
    }

    // Function expressions (including arrow functions assigned to variables).
    if (config.foldFunctions && ts.isFunctionExpression(node) && node.body) {
      const target = getFunctionBodyFoldTarget(node, node.body, sourceFile, FoldTargetKind.FunctionBody);
      if (target) {
        targets.push(target);
      }
    }

    // Arrow functions.
    if (config.foldFunctions && ts.isArrowFunction(node)) {
      const body = node.body;
      // Only fold block bodies (not expression bodies like `x => x + 1`).
      if (ts.isBlock(body)) {
        const target = getFunctionBodyFoldTarget(node, body, sourceFile, FoldTargetKind.FunctionBody);
        if (target) {
          targets.push(target);
        }
      }
    }

    // Method declarations (class methods).
    if (config.foldFunctions && ts.isMethodDeclaration(node) && node.body) {
      const target = getFunctionBodyFoldTarget(node, node.body, sourceFile, FoldTargetKind.MethodBody);
      if (target) {
        targets.push(target);
      }
    }

    // Constructor declarations.
    if (config.foldFunctions && ts.isConstructorDeclaration(node) && node.body) {
      const target = getFunctionBodyFoldTarget(node, node.body, sourceFile, FoldTargetKind.MethodBody);
      if (target) {
        targets.push(target);
      }
    }

    // Getter declarations.
    if (config.foldFunctions && ts.isGetAccessorDeclaration(node) && node.body) {
      const target = getFunctionBodyFoldTarget(node, node.body, sourceFile, FoldTargetKind.MethodBody);
      if (target) {
        targets.push(target);
      }
    }

    // Setter declarations.
    if (config.foldFunctions && ts.isSetAccessorDeclaration(node) && node.body) {
      const target = getFunctionBodyFoldTarget(node, node.body, sourceFile, FoldTargetKind.MethodBody);
      if (target) {
        targets.push(target);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return targets;
}

// ============================================================================
// Fold Target Helpers
// ============================================================================

/**
 * Gets a fold target for a type alias declaration with a type literal body.
 * Only folds if the type is an object type literal (has braces).
 * @param node - The type alias declaration node.
 * @param sourceFile - The source file.
 * @returns A fold target, or undefined if not foldable.
 */
function getTypeLiteralFoldTarget(node: ts.TypeAliasDeclaration, sourceFile: ts.SourceFile): FoldTarget | undefined {
  // We want to fold the body starting from the opening brace.
  // Use getStart() to exclude JSDoc from the fold range.
  const tokenStartLine = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line;
  const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;

  if (endLine > tokenStartLine) {
    return {
      startLine: tokenStartLine,
      endLine,
      kind: FoldTargetKind.TypeBody,
    };
  }

  return undefined;
}

/**
 * Gets a fold target for a node with a braced body (like interfaces).
 * @param node - The node with a braced body.
 * @param sourceFile - The source file.
 * @param kind - The kind of fold target.
 * @returns A fold target, or undefined if not foldable.
 */
function getBracedBodyFoldTarget(
  node: ts.InterfaceDeclaration,
  sourceFile: ts.SourceFile,
  kind: FoldTargetKind
): FoldTarget | undefined {
  // Use getStart() to exclude JSDoc.
  const tokenStartLine = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line;
  const endLine = sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;

  if (endLine > tokenStartLine) {
    return {
      startLine: tokenStartLine,
      endLine,
      kind,
    };
  }

  return undefined;
}

/**
 * Gets a fold target for a function body, properly excluding JSDoc comments.
 * @param declarationNode - The function/method declaration node (used for JSDoc detection).
 * @param bodyNode - The block body of the function.
 * @param sourceFile - The source file.
 * @param kind - The kind of fold target.
 * @returns A fold target, or undefined if not foldable.
 */
function getFunctionBodyFoldTarget(
  declarationNode: ts.Node,
  bodyNode: ts.Block,
  sourceFile: ts.SourceFile,
  kind: FoldTargetKind
): FoldTarget | undefined {
  // getStart() returns the position after any leading trivia (comments, JSDoc).
  // This ensures JSDoc remains visible when the function body is folded.
  const tokenStartLine = sourceFile.getLineAndCharacterOfPosition(declarationNode.getStart(sourceFile)).line;
  const endLine = sourceFile.getLineAndCharacterOfPosition(bodyNode.getEnd()).line;

  if (endLine > tokenStartLine) {
    return {
      startLine: tokenStartLine,
      endLine,
      kind,
    };
  }

  return undefined;
}
