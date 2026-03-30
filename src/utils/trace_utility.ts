import { createHash } from "crypto";

/**
 * Encodes element metadata into a base64 string for the data-svelte-trace attribute.
 *
 * Decoded format: `tagName[tagname]-tagLineCol[line:column]-tagOffset[start:end]-classOffset[start:end]-file[filepath]`
 *
 * @param tagName - Tag name (e.g. h1, div)
 * @param tagLine - 1-based line of the opening tag (editors use this)
 * @param tagColumn - 1-based column of the opening tag (editors use this)
 * @param tagStart - Start offset of opening tag content (after "<")
 * @param tagEnd - End offset of opening tag content (before ">", exclusive)
 * @param classAttrStart - Start offset of class attribute, or -1 if no class attribute
 * @param classAttrEnd - End offset of class attribute, or -1 if no class attribute
 * @param filepath - Absolute path to the source file
 * @returns Base64-encoded metadata string for the data-svelte-trace attribute
 */
export function encodeMetadata(
    tagName: string,
    tagLine: number,
    tagColumn: number,
    tagStart: number,
    tagEnd: number,
    classAttrStart: number,
    classAttrEnd: number,
    filepath: string,
): string {
    const metadataString = `tagName[${tagName}]-tagLineCol[${tagLine}:${tagColumn}]-tagOffset[${tagStart}:${tagEnd}]-classOffset[${classAttrStart}:${classAttrEnd}]-file[${filepath}]`;
    return Buffer.from(metadataString, "utf8").toString("base64");
}

/**
 * Creates a deterministic short trace id for fast DOM re-identification.
 *
 * Format: `st_<8-char-hash>` (hex prefix of sha1)
 * Seed: `${filePath}:${tagOffsetStart}` where `tagOffsetStart` is the character offset of the first character after `<` in the opening tag.
 *
 * Stable across Vite HMR / recompiles when that opening tag does not move in the source file;
 * if the tag shifts (edits above it, structural rewrites), the id changes—by design.
 */
export function generateTraceId(filePath: string, tagOffsetStart: number): string {
    const seed = `${filePath}:${tagOffsetStart}`;
    const fullHash = createHash("sha1").update(seed).digest("hex");
    return `st_${fullHash.slice(0, 8)}`;
}

/**
 * Generates a deterministic trace id and guarantees uniqueness within a document.
 * If an 8-char prefix collides, the hash length is increased deterministically.
 */
export function generateUniqueTraceId(
    filePath: string,
    tagOffsetStart: number,
    usedTraceIds: Set<string>,
): string {
    const seed = `${filePath}:${tagOffsetStart}`;
    const fullHash = createHash("sha1").update(seed).digest("hex");

    let hashLength = 8;
    let traceId = `st_${fullHash.slice(0, hashLength)}`;

    while (usedTraceIds.has(traceId) && hashLength < fullHash.length) {
        hashLength += 1;
        traceId = `st_${fullHash.slice(0, hashLength)}`;
    }

    usedTraceIds.add(traceId);
    return traceId;
}
