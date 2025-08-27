# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Base64 encoding for metadata
- Configuration options
- Performance optimizations
- Better error handling
- TypeScript definitions

## [0.1.0-beta] - 27th Aug 2025

### Added

- Initial beta release
- Svelte 5 preprocessor functionality
- `data-svelte-trace` attribute injection
- Support for all HTML elements in Svelte components
- Class attribute position tracking
- File path metadata inclusion
- Support for complex Svelte blocks (if, each, await, key, snippet)
- Integration with SvelteKit and Vite

### Technical Details

- Uses magic-string for efficient code manipulation
- Parses Svelte AST to identify HTML elements
- Excludes script and style tags from processing
- Handles elements with and without existing attributes
- Tracks class attribute start/end positions

### Known Limitations

- Metadata is not base64 encoded yet
- Limited testing with complex Svelte features
- No configuration options
- Performance not optimized for large applications

[Unreleased]: https://github.com/Git002/svelte-trace/compare/v0.1.0-beta.1...HEAD
[0.1.0-beta]: https://github.com/Git002/svelte-trace/releases/tag/v0.1.0-beta.1
