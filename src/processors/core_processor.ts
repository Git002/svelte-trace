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
 * Recursively adds data attribute to all HTML elements in the Svelte AST.
 */
export function processNodes(filepath: string, content: string, ast: AST.Root): string {
  const magicString = new MagicString(content);

  /**
   * Adds unique data attribute to an HTML element
   */
  const addDataAttribute = (node: AST.RegularElement): void => {
    if (node.type !== "RegularElement") return;
    if (
      node.name === "script" ||
      node.name === "style" ||
      node.name === "meta" ||
      node.name === "link" ||
      node.name === "title"
    )
      return;

    const classAttr = node.attributes.find(
      (attr): attr is AST.Attribute => attr.type === "Attribute" && attr.name === "class"
    );

    const classAttrStart = classAttr ? classAttr.start : -1;
    const classAttrEnd = classAttr ? classAttr.end : -1;

    // Get tag start position (line and column)
    const tagPosition = getLineColumn(content, node.start);

    const dataAttrValue = `tag[${tagPosition.line}:${tagPosition.column}]-class[${classAttrStart}:${classAttrEnd}]-f[${filepath}]`;
    const encodedBase64Data = Buffer.from(dataAttrValue, "utf8").toString("base64");
    const dataAttribute = `data-svelte-trace="${encodedBase64Data}"`;

    // Find the correct insertion point based on whether it's self-closing or not
    let insertionPoint: number;

    // If there are attributes, insert after the last attribute
    if (node.attributes.length > 0) {
      const lastAttr = node.attributes[node.attributes.length - 1];
      insertionPoint = lastAttr.end;
    }
    // If no attributes, insert after the tag name. Included +1 for '<'
    else {
      const tagNameEnd = node.start + 1 + node.name.length;
      insertionPoint = tagNameEnd;
    }

    magicString.appendLeft(insertionPoint, ` ${dataAttribute}`);
  };

  /**
   * Recursively walks the AST nodes
   */
  const walk = (node: ExtendedNode | any): void => {
    if (node.type === "RegularElement") {
      addDataAttribute(node);
    }

    // Handle different node structures
    if (Array.isArray(node.children)) {
      node.children.forEach(walk);
    }
    if (Array.isArray(node.body)) {
      node.body.forEach(walk);
    }
    if (node.fragment) {
      walk(node.fragment);
    }
    if (Array.isArray(node.nodes)) {
      node.nodes.forEach(walk);
    }

    // Handle {#if} blocks
    if (node.type === "IfBlock") {
      if (node.consequent) walk(node.consequent);
      if (node.alternate) walk(node.alternate);
    }

    // Handle {#each} blocks
    if (node.type === "EachBlock") {
      if (node.body) walk(node.body);
      if (node.fallback) walk(node.fallback);
    }

    // Handle {#await} blocks
    if (node.type === "AwaitBlock") {
      if (node.pending) walk(node.pending);
      if (node.then) walk(node.then);
      if (node.catch) walk(node.catch);
    }

    // Handle {#key} blocks
    if (node.type === "KeyBlock" && node.fragment) {
      walk(node.fragment);
    }

    // Handle {#snippet} blocks
    if (node.type === "SnippetBlock" && node.body) {
      walk(node.body);
    }
  };

  // Start walking from the fragment
  if (ast.fragment?.nodes) {
    ast.fragment.nodes.forEach(walk);
  }

  return magicString.toString();
}
