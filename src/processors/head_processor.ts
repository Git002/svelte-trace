import MagicString from "magic-string";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getVSCodeBridgeAssetsPath } from "../utils/path_utility.js";
import type { AST } from "svelte/compiler";

const INJECTION_MARKER = "<!-- svelte-trace-injection -->";

/**
 * Reads and wraps asset files (CSS/JS) for injection into the document head.
 */
function generateHeadContent(): string {
  const assetsPath = getVSCodeBridgeAssetsPath();
  const injectionContent: string[] = [];

  try {
    // Inject CSS for styling the open-in-code feature
    const cssPath = join(assetsPath, "vscode_bridge.css");
    if (existsSync(cssPath)) {
      const cssContent = readFileSync(cssPath, "utf-8");
      injectionContent.push(`  <style data-svelte-trace-open-in-code>\n${cssContent}\n  </style>`);
    }

    // Inject JavaScript for the open-in-code functionality
    const jsPath = join(assetsPath, "vscode_bridge.js");
    if (existsSync(jsPath)) {
      const jsContent = readFileSync(jsPath, "utf-8");
      injectionContent.push(`  <script data-svelte-trace-open-in-code>\n${jsContent}\n  </script>`);
    }

    return injectionContent.join("\n");
  } catch (error: any) {
    console.warn("⚠️ Failed to read VS Code bridge assets:", error.message);
    return "";
  }
}

/**
 * Finds the <svelte:head> element in the AST, if it exists.
 */
function findSvelteHead(ast: AST.Root): AST.SvelteHead | null {
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
 * Injects content into <svelte:head> or creates one if it doesn't exist.
 * Prevents duplicate injections using a marker comment.
 */
export function injectIntoHead(content: string, ast: AST.Root): string {
  const headContent = generateHeadContent();

  // Skip injection if no content to inject or already injected
  if (!headContent || content.includes(INJECTION_MARKER)) {
    return content;
  }

  const magicString = new MagicString(content);
  const svelteHead = findSvelteHead(ast);

  if (svelteHead) {
    // Inject into existing <svelte:head> tag
    const closingTagStart = content.indexOf("</svelte:head>", svelteHead.start);
    if (closingTagStart !== -1) {
      magicString.appendLeft(closingTagStart, `${INJECTION_MARKER}\n${headContent}\n`);
    }
  } else {
    // Create a new <svelte:head> block at the top of the component
    const headSection = `<svelte:head>\n${INJECTION_MARKER}\n${headContent}\n</svelte:head>\n\n`;

    // Insert after any <script> or <style> blocks
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

    magicString.appendLeft(insertionPoint, headSection);
  }

  return magicString.toString();
}
