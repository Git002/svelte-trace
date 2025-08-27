/** @import { AST } from 'svelte/compiler' */
import { parse } from 'svelte/compiler';
import MagicString from 'magic-string';

/**
 * Checks if the provided file path is valid by excluding unwanted folders.
 * @param {string} filePath - The file path to validate.
 * @returns {boolean} - Returns `true` if the file path is valid, otherwise `false`.
 */
function isValidFilePath(filePath) {
	let flag = 0;
	const invalidFolders = ['node_modules', '.svelte-kit'];

	invalidFolders.forEach((folderName) => {
		if (filePath && filePath.includes(folderName)) flag += 1;
	});

	if (flag > 0) return false;
	else return true;
}

/**
 * Recursively adds data attribute to all HTML elements in the Svelte AST.
 * @param {string} filepath
 * @param {string} content
 * @param {AST.Root} ast
 */
function processNodes(filepath, content, ast) {
	const magicString = new MagicString(content);

	/**
	 * Adds unique data attribute to an HTML element
	 * @param {AST.RegularElement} node
	 */
	const addDataAttribute = (node) => {
		if (node.type !== 'RegularElement') return;
		if (node.name === 'script' || node.name === 'style') return;

		const classAttr = node.attributes.find(
			(attr) => attr.type === 'Attribute' && attr.name === 'class'
		);

		const classAttrStart = classAttr ? classAttr.start : -1;
		const classAttrEnd = classAttr ? classAttr.end : -1;
		const dataAttrValue = `class[${classAttrStart},${classAttrEnd}]-f[${filepath}]`;
		const dataAttribute = `data-svelte-trace="${dataAttrValue}"`;

		// Always insert before the closing '>' to make it the last attribute
		const tagEnd = content.indexOf('>', node.start);
		magicString.appendLeft(tagEnd, ` ${dataAttribute}`);
	};

	/**
	 * Recursively walks the AST nodes
	 * @param {any} node - AST node (can be various types with different properties)
	 */
	const walk = (node) => {
		if (node.type === 'RegularElement') {
			addDataAttribute(node);
		}

		// Walk child nodes based on node type - check for property existence first
		if (node.children && Array.isArray(node.children)) {
			node.children.forEach(walk);
		}
		if (node.body && Array.isArray(node.body)) {
			node.body.forEach(walk);
		}
		if (node.fragment) {
			walk(node.fragment);
		}
		if (node.nodes && Array.isArray(node.nodes)) {
			node.nodes.forEach(walk);
		}

		// Handle {#if} blocks
		if (node.type === 'IfBlock') {
			if (node.consequent) {
				walk(node.consequent);
			}
			if (node.alternate) {
				walk(node.alternate);
			}
		}

		// Handle {#each} blocks
		if (node.type === 'EachBlock') {
			if (node.body) {
				walk(node.body);
			}
			if (node.fallback) {
				walk(node.fallback);
			}
		}

		// Handle {#await} blocks
		if (node.type === 'AwaitBlock') {
			if (node.pending) {
				walk(node.pending);
			}
			if (node.then) {
				walk(node.then);
			}
			if (node.catch) {
				walk(node.catch);
			}
		}

		// Handle {#key} blocks
		if (node.type === 'KeyBlock') {
			if (node.fragment) {
				walk(node.fragment);
			}
		}

		// Handle {#snippet} blocks
		if (node.type === 'SnippetBlock') {
			if (node.body) {
				walk(node.body);
			}
		}
	};

	// Start walking from the fragment
	if (ast.fragment && ast.fragment.nodes) {
		ast.fragment.nodes.forEach(walk);
	}

	return magicString.toString();
}

/**
 * A preprocessor for Svelte files.
 * Returns an object containing the preprocessor name and the markup function.
 */
export function svelteTrace() {
	return {
		name: 'svelte-trace',
		/**
		 * Processes the file content if the filepath is valid.
		 * @param {{ content: string, filename: string }} params
		 * @returns {{ code: string } | undefined}
		 */
		markup: ({ content, filename }) => {
			if (isValidFilePath(filename)) {
				try {
					const ast = parse(content, { modern: true });
					const processedContent = processNodes(filename, content, ast);
					return { code: processedContent };
				} catch (error) {
					// Return original content on parse error
					console.error(`Failed to parse ${filename}:`, error);
					return { code: content };
				}
			}
		}
	};
}
