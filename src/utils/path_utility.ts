import { fileURLToPath } from "url";
import { dirname, join } from "path";

/**
 * Checks if the provided file path is valid by excluding unwanted folders.
 */
export function isValidFilePath(filePath: string): boolean {
  const invalidFolders = ["node_modules", ".svelte-kit"];
  return !invalidFolders.some((folderName) => filePath.includes(folderName));
}

/**
 * Checks if the file is the root `/src/routes/+layout.svelte` file.
 */
export function isRootLayoutFile(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, "/");
  return normalizedPath.endsWith("/src/routes/+layout.svelte");
}

/**
 * Gets line and column number from character offset.
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
 */
export function getPackageRoot(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return dirname(__dirname); // Go up one level from utils/ to package root
}

/**
 * Gets the path to the vscode-bridge assets directory.
 */
export function getVSCodeBridgeAssetsPath(): string {
  return join(getPackageRoot(), "assets", "vscode_bridge");
}
