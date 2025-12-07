import MagicString from "magic-string";
import { getLineColumn } from "../utils/path_utility.js";
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
 * Encodes element metadata into a base64 string for the data-svelte-trace attribute.
 * Format: tag[line:column]-class[start:end]-f[filepath]
 */
function encodeMetadata(
  tagLine: number,
  tagColumn: number,
  classAttrStart: number,
  classAttrEnd: number,
  filepath: string
): string {
  const metadataString = `tag[${tagLine}:${tagColumn}]-class[${classAttrStart}:${classAttrEnd}]-f[${filepath}]`;
  return Buffer.from(metadataString, "utf8").toString("base64");
}

/**
 * Recursively adds data attribute to all HTML elements in the Svelte AST.
 */
export function processNodes(filepath: string, content: string, ast: AST.Root): string {
  const magicString = new MagicString(content);

  /**
   * Adds a unique `data-svelte-trace` attribute to an HTML element
   */
  const addDataAttribute = (node: AST.RegularElement): void => {
    if (node.type !== "RegularElement") return;

    // Skip meta elements that shouldn't be traced
    const skipElements = ["script", "style", "meta", "link", "title"];
    if (skipElements.includes(node.name)) return;

    // Find class attribute if it exists
    const classAttr = node.attributes.find(
      (attr): attr is AST.Attribute => attr.type === "Attribute" && attr.name === "class"
    );

    const classAttrStart = classAttr?.start ?? -1;
    const classAttrEnd = classAttr?.end ?? -1;

    // Get element's line and column position
    const { line, column } = getLineColumn(content, node.start);
    const encodedMetadata = encodeMetadata(line, column, classAttrStart, classAttrEnd, filepath);

    // Determine where to insert the data attribute
    const insertionPoint =
      node.attributes.length > 0
        ? node.attributes[node.attributes.length - 1].end
        : node.start + 1 + node.name.length; // Position after tag name

    magicString.appendLeft(insertionPoint, ` data-svelte-trace="${encodedMetadata}"`);
  };

  /**
   * Recursively walks through all AST nodes
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
