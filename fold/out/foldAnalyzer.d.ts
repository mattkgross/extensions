/**
 * @fileoverview AST-based analyzer for identifying foldable regions in TypeScript files.
 * Uses the TypeScript Compiler API to accurately detect imports, types, interfaces,
 * functions, and methods while correctly handling JSDoc comments.
 */
import { FoldTarget, FoldConfig } from './types';
/**
 * Analyzes a TypeScript/TSX document and returns all foldable regions.
 * @param text - The full text content of the document.
 * @param fileName - The file name (used for determining script kind).
 * @param config - Configuration options controlling which constructs to fold.
 * @returns An array of fold targets representing foldable regions.
 */
export declare function analyzeFoldTargets(text: string, fileName: string, config: FoldConfig): FoldTarget[];
//# sourceMappingURL=foldAnalyzer.d.ts.map