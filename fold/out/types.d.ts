/**
 * @fileoverview Type definitions for the TypeScript Auto-Fold extension.
 * Defines fold targets, their kinds, and configuration options.
 */
/**
 * Represents a foldable region in the document.
 */
export interface FoldTarget {
    /** 0-indexed line number where the fold should start. */
    startLine: number;
    /** 0-indexed line number where the fold should end. */
    endLine: number;
    /** The kind of construct being folded. */
    kind: FoldTargetKind;
}
/**
 * Enumeration of different kinds of foldable constructs.
 */
export declare enum FoldTargetKind {
    /** A contiguous block of import statements at the top of the file. */
    ImportBlock = "import-block",
    /** The body of a type alias declaration (e.g., `type X = {...}`). */
    TypeBody = "type-body",
    /** The body of an interface declaration. */
    InterfaceBody = "interface-body",
    /** The body of a standalone function declaration or expression. */
    FunctionBody = "function-body",
    /** The body of a class method, getter, setter, or constructor. */
    MethodBody = "method-body"
}
/**
 * Configuration options for the auto-fold behavior.
 */
export interface FoldConfig {
    /** Whether to fold import statement blocks. */
    foldImports: boolean;
    /** Whether to fold type and interface bodies. */
    foldTypes: boolean;
    /** Whether to fold function and method bodies. */
    foldFunctions: boolean;
    /** Delay in milliseconds before folding after file opens. */
    foldDelay: number;
}
//# sourceMappingURL=types.d.ts.map