import { join } from "path";
import { readFileSync, existsSync } from "fs";
import type { AST } from "svelte/compiler";
import { getAssetsJsPath, getAssetsCssPath } from "../utils/path_utility.js";

/**
 * Finds the `<svelte:head>` element in the AST, if it exists.
 */
export function findSvelteHead(ast: AST.Root): AST.SvelteHead | null {
    let svelteHeadNode: AST.SvelteHead | null = null;

    const walk = (node: any): void => {
        if (node.type === "SvelteHead") {
            svelteHeadNode = node;
            return;
        }

        // Recursively search all child nodes
        if (Array.isArray(node.children)) node.children.forEach(walk);
        if (node.fragment) walk(node.fragment);
        if (Array.isArray(node.nodes)) node.nodes.forEach(walk);
    };

    if (ast.fragment?.nodes) {
        ast.fragment.nodes.forEach(walk);
    }

    return svelteHeadNode;
}

/**
 * Reads and wraps asset files (CSS/JS) for injection into the document head.
 *
 * @param openInEditor - "", "vscode", or "cursor" for open in editor.
 * @param showIndicator - When true, indicator script shows hover/click overlays.
 * @param postToParent - When true, indicator posts messages to parent with source location.
 */
export function generateHeadContent(
    openInEditor: "" | "vscode" | "cursor" = "",
    showIndicator: boolean = true,
    postToParent: boolean = true,
): string {
    const jsPath = getAssetsJsPath();
    const cssPath = getAssetsCssPath();
    const injectionContent: string[] = [];
    const editorActive = openInEditor === "vscode" || openInEditor === "cursor";
    const indicatorActive = editorActive || showIndicator || postToParent;

    try {
        // IDE bridge CSS: when open-in-editor is vscode or cursor
        if (editorActive) {
            const bridgeCss = join(cssPath, "ide_bridge.css");
            if (existsSync(bridgeCss)) {
                const cssContent = readFileSync(bridgeCss, "utf-8");
                injectionContent.push(
                    `<style data-svelte-trace-ide-bridge>\n${cssContent}\n</style>`,
                );
            }
        }

        // Indicator CSS: when indicator is active
        if (indicatorActive) {
            const indicatorCss = join(cssPath, "indicator.css");
            if (existsSync(indicatorCss)) {
                const cssContent = readFileSync(indicatorCss, "utf-8");
                injectionContent.push(
                    `<style data-svelte-trace-indicator>\n${cssContent}\n</style>`,
                );
            }
        }

        // IDE bridge script + editor config: when openInEditor is vscode or cursor
        if (editorActive) {
            injectionContent.push(
                `<script data-svelte-trace-editor-config>window.__SVELTE_TRACE_EDITOR__=${JSON.stringify(openInEditor)};</script>`,
            );
            const bridgeJs = join(jsPath, "ide_bridge.js");
            if (existsSync(bridgeJs)) {
                const jsContent = readFileSync(bridgeJs, "utf-8");
                injectionContent.push(
                    `<script data-svelte-trace-ide-bridge>\n${jsContent}\n</script>`,
                );
            }
        }

        // Indicator: config + script when indicator is active
        if (indicatorActive) {
            injectionContent.push(
                `<script data-svelte-trace-config>window.__SVELTE_TRACE_SHOW_INDICATOR__=${JSON.stringify(showIndicator)};window.__SVELTE_TRACE_POST_TO_PARENT__=${JSON.stringify(postToParent)};</script>`,
            );

            const indicatorJs = join(jsPath, "indicator.js");
            if (existsSync(indicatorJs)) {
                const indicatorContent = readFileSync(indicatorJs, "utf-8");
                injectionContent.push(
                    `<script data-svelte-trace-indicator>\n${indicatorContent}\n</script>`,
                );
            }
        }

        return injectionContent.join("\n");
    } catch (error: any) {
        console.warn("Failed to read svelte-trace assets:", error.message);
        return "";
    }
}
