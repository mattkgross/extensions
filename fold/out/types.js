"use strict";
/**
 * @fileoverview Type definitions for the TypeScript Auto-Fold extension.
 * Defines fold targets, their kinds, and configuration options.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoldTargetKind = void 0;
/**
 * Enumeration of different kinds of foldable constructs.
 */
var FoldTargetKind;
(function (FoldTargetKind) {
    /** A contiguous block of import statements at the top of the file. */
    FoldTargetKind["ImportBlock"] = "import-block";
    /** The body of a type alias declaration (e.g., `type X = {...}`). */
    FoldTargetKind["TypeBody"] = "type-body";
    /** The body of an interface declaration. */
    FoldTargetKind["InterfaceBody"] = "interface-body";
    /** The body of a standalone function declaration or expression. */
    FoldTargetKind["FunctionBody"] = "function-body";
    /** The body of a class method, getter, setter, or constructor. */
    FoldTargetKind["MethodBody"] = "method-body";
})(FoldTargetKind || (exports.FoldTargetKind = FoldTargetKind = {}));
//# sourceMappingURL=types.js.map