import MagicString from "magic-string";
import { getLineColumn } from "../utils/path_utility.js";
import { encodeMetadata, generateUniqueTraceId } from "../utils/trace_utility.js";
import type { AST } from "svelte/compiler";

type ExtendedNode =
    | AST.Root
    | AST.RegularElement
    | AST.IfBlock
    | AST.EachBlock
    | AST.AwaitBlock
    | AST.KeyBlock
    | AST.SnippetBlock
    | { [key: string]: any };

/**
 * Walks the Svelte markup AST and injects tracing attributes on each traced element:
 * - `data-svelte-trace` — base64 metadata for tooling (line/column, offsets, file).
 * - `data-svelte-trace-id` — short deterministic id (`st_...`) for fast DOM lookup after re-renders / recompiles.
 */
export function processNodes(filepath: string, content: string, ast: AST.Root): string {
    const magicString = new MagicString(content);
    const usedTraceIds = new Set<string>();
    /**
     * Adds `data-svelte-trace` and `data-svelte-trace-id` on a regular HTML element.
     */
    const addDataAttribute = (node: AST.RegularElement): void => {
        if (node.type !== "RegularElement") return;

        // Skip meta elements that shouldn't be traced
        const skipElements = ["script", "style", "meta", "link", "title"];
        if (skipElements.includes(node.name)) return;

        // Find class attribute if it exists (class, class="", or class="value" all have start/end from AST)
        const classAttr = node.attributes.find(
            (attr): attr is AST.Attribute => attr.type === "Attribute" && attr.name === "class",
        );
        const classAttrStart = classAttr?.start ?? -1;
        const classAttrEnd = classAttr?.end ?? -1;

        // Opening tag content range: from after "<" to before ">" (e.g. for <h1 class="flex"> → 'h1 class="flex"')
        let openTagEnd = node.start + 1 + node.name.length;
        for (const attr of node.attributes) {
            openTagEnd = Math.max(openTagEnd, attr.end);
        }
        const gtIndex = content.indexOf(">", openTagEnd);
        const tagStartOffset = node.start + 1; // after "<"
        const tagEndOffset = gtIndex >= 0 ? gtIndex : openTagEnd; // before ">" (exclusive end)

        // Note: Tag uses line:column and not offset, because editors only understand line/column for "go to position".
        const { line: tagLine, column: tagColumn } = getLineColumn(content, node.start);
        const encodedMetadata = encodeMetadata(
            node.name,
            tagLine,
            tagColumn,
            tagStartOffset,
            tagEndOffset,
            classAttrStart,
            classAttrEnd,
            filepath,
        );
        // Stable id for `querySelector([data-svelte-trace-id="..."])`; same across recompiles if this opening tag stays at the same source offset.
        const traceId = generateUniqueTraceId(filepath, tagStartOffset, usedTraceIds);

        // Determine where to insert the data attribute
        const insertionPoint =
            node.attributes.length > 0
                ? node.attributes[node.attributes.length - 1].end
                : node.start + 1 + node.name.length; // Position after tag name

        magicString.appendLeft(
            insertionPoint,
            ` data-svelte-trace="${encodedMetadata}" data-svelte-trace-id="${traceId}"`,
        );
    };

    /**
     * Recursively walk through all AST nodes
     */
    const walk = (node: ExtendedNode | any): void => {
        // Process regular elements
        if (node.type === "RegularElement") {
            addDataAttribute(node);
        }

        // Walk through various node structures
        if (Array.isArray(node.children)) node.children.forEach(walk);
        if (Array.isArray(node.body)) node.body.forEach(walk);
        if (node.fragment) walk(node.fragment);
        if (Array.isArray(node.nodes)) node.nodes.forEach(walk);

        // Handle control flow blocks
        if (node.type === "IfBlock") {
            if (node.consequent) walk(node.consequent);
            if (node.alternate) walk(node.alternate);
        }

        if (node.type === "EachBlock") {
            if (node.body) walk(node.body);
            if (node.fallback) walk(node.fallback);
        }

        if (node.type === "AwaitBlock") {
            if (node.pending) walk(node.pending);
            if (node.then) walk(node.then);
            if (node.catch) walk(node.catch);
        }

        if (node.type === "KeyBlock" && node.fragment) {
            walk(node.fragment);
        }

        if (node.type === "SnippetBlock" && node.body) {
            walk(node.body);
        }
    };

    // Start traversal from the document fragment
    if (ast.fragment?.nodes) {
        ast.fragment.nodes.forEach(walk);
    }

    return magicString.toString();
}
