import { parse, type AST } from "svelte/compiler";
import { isValidFilePath, isRootLayoutFile } from "./utils/path_utility.js";
import { processNodes } from "./processors/core_processor.js";
import { injectIntoHead } from "./processors/head_processor.js";

interface PreprocessorResult {
  code: string;
  map?: any;
}

interface MarkupParams {
  content: string;
  filename: string;
}

/**
 * Svelte preprocessor that injects metadata into HTML elements for tracing.
 *
 * Set `openInCode` to `true` to enable "Open in VSCode" feature.
 */
export function svelteTrace(openInCode: boolean = false) {
  return {
    name: "svelte-trace",
    markup: ({ content, filename }: MarkupParams): PreprocessorResult | undefined => {
      if (!isValidFilePath(filename)) return;

      try {
        let processedContent = content;
        let ast: AST.Root = parse(content, { modern: true });

        // Process nodes FIRST (before head injection) so metadata uses original line numbers
        processedContent = processNodes(filename, processedContent, ast);

        if (isRootLayoutFile(filename) && openInCode) {
          ast = parse(processedContent, { modern: true });
          processedContent = injectIntoHead(processedContent, ast);
        }

        return { code: processedContent };
      } catch (error) {
        console.error(`Failed to parse ${filename}:`, error);
        return { code: content };
      }
    },
  };
}
