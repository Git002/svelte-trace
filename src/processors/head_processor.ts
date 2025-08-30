import MagicString from "magic-string";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getVSCodeBridgeAssetsPath } from "../utils/path_utility.js";
import type { AST } from "svelte/compiler";

/**
 * Generates head injection content by reading files from assets directory
 */
function generateHeadContent(): string {
  const assetsPath = getVSCodeBridgeAssetsPath();
  const injectionContent: string[] = [];

  try {
    // Inject CSS file if it exists
    const cssPath = join(assetsPath, "vscode_bridge.css");
    if (existsSync(cssPath)) {
      const cssContent = readFileSync(cssPath, "utf-8");
      injectionContent.push(`  <style data-svelte-trace-open-in-code>\n${cssContent}\n  </style>`);
    }

    // Inject JS file as inline script
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
 * Finds svelte:head element in AST
 */
function findSvelteHead(ast: AST.Root): AST.SvelteHead | null {
  let svelteHeadNode: AST.SvelteHead | null = null;

  const walk = (node: any): void => {
    if (node.type === "SvelteHead") {
      svelteHeadNode = node;
      return;
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(walk);
    }
    if (node.fragment) {
      walk(node.fragment);
    }
    if (Array.isArray(node.nodes)) {
      node.nodes.forEach(walk);
    }
  };

  if (ast.fragment?.nodes) {
    ast.fragment.nodes.forEach(walk);
  }

  return svelteHeadNode;
}

/**
 * Injects content into svelte:head or creates one if it doesn't exist
 */
export function injectIntoHead(content: string, ast: AST.Root): string {
  const magicString = new MagicString(content);
  const headContent = generateHeadContent();

  if (!headContent) return content;

  const svelteHead = findSvelteHead(ast);
  const injectionMarker = "<!-- svelte-trace-injection -->";

  // Prevent duplicate injection
  if (content.includes(injectionMarker)) return content;

  // Inject before </svelte:head>
  if (svelteHead) {
    const closingTagStart = content.indexOf("</svelte:head>", svelteHead.start);
    if (closingTagStart !== -1) {
      magicString.appendLeft(closingTagStart, `${injectionMarker}\n${headContent}\n`);
    }
  }
  // Create new <svelte:head> block
  else {
    const headSection = `<svelte:head>\n${injectionMarker}\n${headContent}\n</svelte:head>\n\n`;

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
