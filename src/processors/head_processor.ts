import type { AST } from "svelte/compiler";
import MagicString from "magic-string";
import { findSvelteHead, generateHeadContent } from "../utils/head_utility.js";

const INJECTION_MARKER = "<!-- svelte-trace-injection -->";

/**
 * Injects content into `<svelte:head>` or creates one if it doesn't exist.
 *
 * @param content - The content of the component to inject into.
 * @param ast - The AST of the component to inject into.
 * @param openInEditor - "", "vscode", or "cursor" for open in editor.
 * @param showIndicator - When true, indicator script shows overlays.
 * @param postToParent - When true, indicator posts messages to parent with source location.
 */
export function injectIntoContentHead(
    content: string,
    ast: AST.Root,
    openInEditor: "" | "vscode" | "cursor" = "",
    showIndicator: boolean = true,
    postToParent: boolean = true,
): string {
    const headContent = generateHeadContent(openInEditor, showIndicator, postToParent);

    // Skip injection if no content, or script/style blocks are already injected
    if (!headContent || content.includes(INJECTION_MARKER)) {
        return content;
    }

    const magicString = new MagicString(content);
    const svelteHead = findSvelteHead(ast);

    // Inject Head Content into existing `<svelte:head>` tag
    if (svelteHead) {
        const closingTagStart = content.indexOf("</svelte:head>", svelteHead.start);
        if (closingTagStart !== -1) {
            magicString.appendLeft(closingTagStart, `${INJECTION_MARKER}\n${headContent}\n`);
        }
    }
    // Otherwise, create a new `<svelte:head>` block at the top of the component
    else {
        const headSection = `<svelte:head>\n${INJECTION_MARKER}\n${headContent}\n</svelte:head>\n\n`;

        // Find insertion point after any `<script>` or `<style>` blocks
        let insertionPoint = 0;

        if (ast.fragment?.nodes) {
            for (const node of ast.fragment.nodes) {
                if (
                    (node.type === "RegularElement" || node.type === "SvelteElement") &&
                    (node.name === "script" || node.name === "style")
                ) {
                    insertionPoint = node.end;
                } else {
                    break;
                }
            }
        }

        // Insert Head Content at the determined insertion point
        magicString.appendLeft(insertionPoint, headSection);
    }

    return magicString.toString();
}
