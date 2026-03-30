import { parse, type AST } from "svelte/compiler";
import { isValidFilePath, isRootLayoutFile } from "./utils/path_utility.js";
import { processNodes } from "./processors/core_processor.js";
import { injectIntoContentHead } from "./processors/head_processor.js";

interface PreprocessorResultType {
    code: string;
    map?: any;
}
interface MarkupParamsType {
    content: string;
    filename: string;
}

export type EditorType = "" | "vscode" | "cursor";

export interface SvelteTraceOptions {
    openInEditor?: EditorType;
    showIndicator?: boolean;
    postToParent?: boolean;
}

function normalizeOpenInEditor(value: EditorType | undefined): EditorType {
    if (value === "vscode" || value === "cursor") return value;
    return "";
}

/**
 * Svelte preprocessor that injects metadata into HTML elements for tracing.
 *
 * Each traced element gets:
 * - `data-svelte-trace` — base64-encoded source metadata.
 * - `data-svelte-trace-id` — deterministic `st_...` id for fast DOM lookup.
 *
 * @param options - Options object.
 * @param options.openInEditor - "", "vscode", or "cursor" for open in editor. Default "".
 * @param options.showIndicator - Shows hover/click overlay indicators. Default true.
 * @param options.postToParent - Posts source location to parent window. Default true.
 *
 * Examples:
 * ```js
 * svelteTrace({});
 * svelteTrace({ openInEditor: "vscode" });
 * svelteTrace({ openInEditor: "cursor", showIndicator: false, postToParent: true });
 * ```
 */
export function svelteTrace(options: SvelteTraceOptions = {}) {
    const openInEditor = normalizeOpenInEditor(options.openInEditor);
    const showIndicator = options.showIndicator !== false;
    const postToParent = options.postToParent !== false;

    return createPreprocessor(openInEditor, showIndicator, postToParent);
}

/**
 * Creates a Svelte preprocessor that rewrites markup: trace attributes on elements, optional `<svelte:head>` injection.
 */
function createPreprocessor(
    openInEditor: EditorType,
    showIndicator: boolean,
    postToParent: boolean,
) {
    return {
        name: "svelte-trace",
        markup: ({ content, filename }: MarkupParamsType): PreprocessorResultType | undefined => {
            if (!isValidFilePath(filename)) return;

            try {
                let transformedContent = content;
                let ast: AST.Root = parse(content, { modern: true });

                // Process nodes FIRST (before head injection)
                transformedContent = processNodes(filename, transformedContent, ast);

                const editorActive = openInEditor === "vscode" || openInEditor === "cursor";
                const injectHead =
                    isRootLayoutFile(filename) && (editorActive || showIndicator || postToParent);

                if (injectHead) {
                    ast = parse(transformedContent, { modern: true });
                    transformedContent = injectIntoContentHead(
                        transformedContent,
                        ast,
                        openInEditor,
                        showIndicator,
                        postToParent,
                    );
                }

                return { code: transformedContent };
            } catch (error) {
                console.error(`Failed to parse ${filename}:`, error);
                return { code: content };
            }
        },
    };
}
