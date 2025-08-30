# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Work towards making it stable.
- Add the related file name too below the colored overlay.

## [0.1.6-beta | 0.1.6-beta.2] - 31st Aug 2025

### Added

Nothing added.

### Technical Improvements

Nothing improved.

### Changed

- Added LICENSE, README, and package.json to dist/ on build.

### Fixed

- Bug fixes for self closing tags.

## [0.1.5-beta] - 30th Aug 2025

### Added

- **Click to Open in VS Code**: Ctrl/Cmd + Click functionality to instantly open source files in VS Code.
- **Automatic Client-side Script Injection**: Zero-configuration setup with automatic script injection for click-to-open functionality.
- **Base64 Metadata Encoding**: Implemented base64 encoding for `data-svelte-trace` attributes.
- **Configuration Options**: Added `openInCode` configuration option to control client-side script injection.
- **VS Code Integration**: Seamless integration with VS Code through `vscode://` protocol links.
- **Enhanced User Experience**: Instant navigation from browser elements to source code with precise line and column positioning.

### Technical Improvements

- Client-side event listener for `Ctrl/Cmd` + `Click` detection.
- Base64 encoding/decoding for metadata security and cleanliness.
- Configurable preprocessor options.
- VS Code protocol URL construction for direct editor opening.
- Improved metadata handling and parsing.

### Changed

- Made code modular, and more readable.
- Metadata format now uses base64 encoding for cleaner HTML output.
- Enhanced preprocessor configuration system.
- Improved documentation with comprehensive setup guide.

### Fixed

- Nothing there to fix.

## [0.1.0-beta] - 27th Aug 2025

### Added

- Initial beta release.
- Svelte 5 preprocessor functionality.
- `data-svelte-trace` attribute injection.
- Support for all HTML elements in Svelte components.
- Class attribute position tracking.
- File path metadata inclusion.
- Support for complex Svelte blocks (if, each, await, key, snippet).
- Integration with SvelteKit and Vite.

### Technical Details

- Uses magic-string for efficient code manipulation.
- Parses Svelte AST to identify HTML elements.
- Excludes script and style tags from processing.
- Handles elements with and without existing attributes.
- Tracks class attribute start/end positions.

### Known Limitations

- Metadata is not base64 encoded yet.
- Limited testing with complex Svelte features.
- No configuration options.
- Terrible code quality.

[Unreleased]: https://github.com/Git002/svelte-trace/compare/v0.1.5-beta...HEAD
[0.1.5-beta]: https://github.com/Git002/svelte-trace/compare/v0.1.0-beta.1...v0.1.5-beta
[0.1.0-beta]: https://github.com/Git002/svelte-trace/releases/tag/v0.1.0-beta.1
