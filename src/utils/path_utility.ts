import { fileURLToPath } from "url";
import { dirname, join } from "path";

/**
 * Validates if a file path should be processed by the preprocessor.
 * Excludes node_modules and .svelte-kit to avoid unnecessary processing.
 *
 * @param filePath - The file path to validate
 * @returns true if the file should be processed
 */
export function isValidFilePath(filePath: string): boolean {
  const invalidFolders = ["node_modules", ".svelte-kit"];
  return !invalidFolders.some((folderName) => filePath.includes(folderName));
}

/**
 * Checks if the file is the root layout component.
 * Used to conditionally inject VS Code bridge assets.
 *
 * @param filePath - The file path to check
 * @returns true if this is src/routes/+layout.svelte
 */
export function isRootLayoutFile(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, "/");
  return normalizedPath.endsWith("/src/routes/+layout.svelte");
}

/**
 * Converts a character offset into line and column numbers.
 * Useful for mapping AST node positions to readable source locations.
 *
 * @param content - The full file content
 * @param offset - Character offset from the start
 * @returns Object with line (1-indexed) and column (1-indexed) numbers
 */
export function getLineColumn(content: string, offset: number): { line: number; column: number } {
  const lines = content.substring(0, offset).split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

/**
 * Gets the absolute path to the package root directory.
 * Used as the base for locating asset files.
 *
 * @returns Absolute path to the package root
 */
export function getPackageRoot(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return dirname(__dirname); // Go up: utils/ → src/ → root
}

/**
 * Gets the path to the VS Code bridge assets directory.
 * These assets are injected into the root layout for "Open in Code" functionality.
 *
 * @returns Absolute path to the vscode_bridge assets folder
 */
export function getVSCodeBridgeAssetsPath(): string {
  return join(getPackageRoot(), "assets", "vscode_bridge");
}
