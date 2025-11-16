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
 * A preprocessor for Svelte files for tracking element's metadata. This function returns an object containing the preprocessor name, and a markup function.
 *
 * Set `openInCode` parameter to `true` if you want "Open in VSCode".
 */
export function svelteTrace(openInCode: boolean = false) {
  return {
    name: "svelte-trace",
    markup: ({ content, filename }: MarkupParams): PreprocessorResult | undefined => {
      if (!isValidFilePath(filename)) return;

      try {
        let ast: AST.Root = parse(content, { modern: true });
        let processedContent = content;

        // If the file is "src/routes/+layout.svelte"
        if (isRootLayoutFile(filename)) {
          // If openInCode is enabled, we inject a script to allow this feature
          if (openInCode) {
            processedContent = injectIntoHead(processedContent, ast);
          }

          // Re-parse content in case of head injection
          if (processedContent !== content) {
            const newAst: AST.Root = parse(processedContent, { modern: true });
            processedContent = processNodes(filename, processedContent, newAst);
          } else {
            processedContent = processNodes(filename, processedContent, ast);
          }
        } else {
          processedContent = processNodes(filename, processedContent, ast);
        }

        return { code: processedContent };
      } catch (error) {
        console.error(`Failed to parse ${filename}:`, error);
        return { code: content };
      }
    },
  };
}
