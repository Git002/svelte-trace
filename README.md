<p align="center">
  <a href="https://github.com/Git002/svelte-trace">
    <img src="https://beeimg.com/images/p32116343591.png" alt="Svelte Trace Logo" width="225" />
  </a>
</p>

<h1 align="center">Svelte Trace</h1>

<p align="center">
  <strong>Trace your Svelte components in the DOM—effortlessly.</strong><br />
  <em>A Svelte 5 preprocessor that injects data attributes into DOM elements for reliable tooling and debugging.</em>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/svelte-trace"><img src="https://img.shields.io/npm/v/svelte-trace.svg" alt="NPM Version"></a>
  <a href="https://github.com/Git002/svelte-trace/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/svelte-trace.svg" alt="License"></a>
</p>

## Table of Contents

1. [Why Svelte Trace?](#1-why-svelte-trace)
2. [Features](#2-features)
3. [Installation](#3-installation)
4. [Setup](#4-setup)
    - [4.1 Add to `svelte.config.js`](#41-add-to-svelteconfigjs)
    - [4.2 Configuration Options](#42-configuration-options)
    - [4.3 Start the Dev Server](#43-start-the-dev-server)
5. [How It Works](#5-how-it-works)
6. [Decoding Trace Metadata](#6-decoding-trace-metadata)
    - [6.1 In the Browser](#61-in-the-browser)
    - [6.2 In Node.js](#62-in-nodejs)
    - [6.3 Decoded Format Reference](#63-decoded-format-reference)
7. [Optional Features](#7-optional-features)
    - [7.1 Open in Editor](#71-open-in-editor)
    - [7.2 Iframe Integration](#72-iframe-integration)
8. [Iframe Message Protocol](#8-iframe-message-protocol)
    - [8.1 `trace-ready` (iframe → parent)](#81-trace-ready-iframe--parent)
    - [8.2 `element-click` (parent → iframe)](#82-element-click-parent--iframe)
    - [8.3 Outbound Messages (iframe → parent)](#83-outbound-messages-iframe--parent)
9. [Runtime Flags & Teardown](#9-runtime-flags--teardown)
10. [Use Cases](#10-use-cases)
11. [Contributing](#11-contributing)
12. [Support](#12-support)
13. [License](#13-license)

## 1. Why Svelte Trace?

When building **devtools, visual editors, or automation** around Svelte, you constantly need to answer: _which part of the source does this DOM node belong to?_

Svelte Trace is a **preprocessor** that answers that automatically. It tags every element in the compiled markup so tools can read its **file path, line, and column**—plus a **stable short ID**—directly from the DOM, without maintaining fragile mappings by hand.

## 2. Features

- **Source location** — Elements receive `data-svelte-trace` encoding file, line, column, and offset metadata.
- **Stable identity** — Elements receive `data-svelte-trace-id` so they can be re-selected after re-renders or HMR.
- **Minimal setup** — Configure once in `svelte.config.js`; no extra wiring needed for the core tagging.
- **Open in editor** — Ctrl+Click any element to open its source in **VS Code** or **Cursor**.
- **Iframe support** — Designed for embedded previews: hover/click events, `trace-ready` notifications, and programmatic `element-click` commands are all supported.

## 3. Installation

```bash
npm install svelte-trace --save-dev
```

## 4. Setup

### 4.1 Add to `svelte.config.js`

Import and add `svelteTrace` to your preprocessors array:

```js
import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { svelteTrace } from "svelte-trace";

const config = {
    preprocess: [vitePreprocess(), svelteTrace()],
    kit: { adapter: adapter() },
};

export default config;
```

### 4.2 Configuration Options

All options are optional. Defaults: `openInEditor: ""`, `showIndicator: true`, `postToParent: true`.

```js
// Use defaults
svelteTrace();

// Open source in VS Code on Ctrl+Click
svelteTrace({ openInEditor: "vscode" });

// Open in Cursor, hide overlays, keep postMessage
svelteTrace({ openInEditor: "cursor", showIndicator: false, postToParent: true });
```

| Option          | Type                         | Default | Description                                                                                                                                                                                                                                                       |
| --------------- | ---------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openInEditor`  | `"vscode" \| "cursor" \| ""` | `""`    | Enables Ctrl+Click to open the element's source in the chosen editor.                                                                                                                                                                                             |
| `showIndicator` | `boolean`                    | `true`  | When `true`, shows hover and click overlays on traced DOM elements.                                                                                                                                                                                               |
| `postToParent`  | `boolean`                    | `true`  | When `true` and inside an iframe, posts `indicator-click`, `indicator-hover`, and `trace-ready` to `window.parent`. Set to `false` to disable outbound posts while keeping overlays. The `element-click` listener is always registered when the page is embedded. |

### 4.3 Start the Dev Server

```bash
npm run dev
```

Svelte Trace only runs during development; it does not affect production builds.

## 5. How It Works

Svelte Trace injects two data attributes onto every element at compile time:

**Before preprocessing:**

```html
<div class="container">
    <h1>Hello World</h1>
</div>
```

**After preprocessing:**

```html
<div class="container" data-svelte-trace="..." data-svelte-trace-id="st_82hj23af">
    <h1 data-svelte-trace="..." data-svelte-trace-id="st_ab1234ef">Hello World</h1>
</div>
```

| Attribute              | Contents                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `data-svelte-trace`    | Base64-encoded string containing source location metadata (file path, line, column, offsets).             |
| `data-svelte-trace-id` | A short, stable ID (e.g. `st_82hj23af`) derived deterministically from `filePath + ":" + tagOffsetStart`. |

The ID stays stable across recompiles as long as the element's position in the file does not change. If a hash collision occurs within the same document, Svelte Trace automatically extends the hash to ensure uniqueness.

## 6. Decoding Trace Metadata

### 6.1 In the Browser

```js
const el = document.querySelector("[data-svelte-trace]");
const decoded = atob(el.getAttribute("data-svelte-trace"));
console.log(decoded);
```

### 6.2 In Node.js

```js
const encoded = "dGFnWzI6M10tY2xhc3NbLTE6LTFdLWZbL3BhdGgvc3ZlbHRlXQ==";
const decoded = Buffer.from(encoded, "base64").toString("utf8");
console.log(decoded);
```

### 6.3 Decoded Format Reference

The decoded string follows this structure:

```
tagName[...]-tagLineCol[...]-tagOffset[...]-classOffset[...]-file[...]
```

| Field                    | Example                  | Description                                                                                                                                                                                |
| ------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tagName[name]`          | `tagName[h1]`            | The element's tag name.                                                                                                                                                                    |
| `tagLineCol[line:col]`   | `tagLineCol[44:4]`       | Line and column of the opening tag. Used by editors to jump to the right position.                                                                                                         |
| `tagOffset[start:end]`   | `tagOffset[1200:1220]`   | Character offsets of the opening tag's content—the span between `<` and `>`. For `<h1 class="flex">`, this covers `h1 class="flex"`.                                                       |
| `classOffset[start:end]` | `classOffset[1263:1350]` | Character offsets of the `class` attribute value. Returns `-1:-1` only when no `class` attribute is present. An empty (`class=""`) or bare (`class`) attribute still returns real offsets. |
| `file[path]`             | `file[/src/App.svelte]`  | Absolute path to the source file.                                                                                                                                                          |

## 7. Optional Features

### 7.1 Open in Editor

Enable Ctrl+Click to open an element's source directly in your editor:

```js
svelteTrace({ openInEditor: "vscode" });
svelteTrace({ openInEditor: "cursor" });
```

### 7.2 Iframe Integration

Use this when your Svelte app runs **inside an iframe**—for example, in a visual editor or design tool—and the **parent page** needs to:

- Know when the traced DOM has been rebuilt (after Vite HMR or navigation)
- Re-select the same logical element without requiring a new user click
- Use fresh trace metadata (`tagOffset`, `classOffset`, etc.) after each compile

Communication across the iframe boundary uses `postMessage` in both directions. Because DOM nodes cannot be passed across the boundary, elements are identified by their `id` or `data-svelte-trace-id`.

## 8. Iframe Message Protocol

### 8.1 `trace-ready` (iframe → parent)

**Purpose:** Notifies the parent that trace-bearing markup in the DOM may have changed. Any cached `tagOffset` or `classOffset` from a previous compile should be treated as stale until the next `indicator-click` (or your own re-parse).

**Requirements:** `postToParent: true` and the page must be embedded (`window.parent !== window`).

**When it fires:**

- Once around the `window load` event (or immediately if the document is already complete when the script initializes)
- On `MutationObserver` activity: `childList` or `subtree` changes under `document.documentElement`, or attribute changes on `data-svelte-trace` / `data-svelte-trace-id`

**Payload:**

```js
{ type: "trace-ready", source: "svelte-trace" }
```

> **Note:** There is no debounce. A single HMR pass can produce multiple `trace-ready` messages. The parent should coalesce them if needed (e.g. with `requestAnimationFrame`).

### 8.2 `element-click` (parent → iframe)

**Purpose:** Instructs the iframe to programmatically click a specific element, following the same code path as a real user click—including overlays (if enabled) and outbound `indicator-click` (if `postToParent` is true).

**Payload:**

| Field     | Type              | Description                                                                              |
| --------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `type`    | `"element-click"` | Required.                                                                                |
| `id`      | `string \| null`  | The element is located via `document.getElementById(id)` first.                          |
| `traceId` | `string \| null`  | Used when `id` is null or empty. Looks up `[data-svelte-trace-id="…"]` via `CSS.escape`. |

**Resolution order:**

1. Non-empty `id` → `getElementById`
2. Else non-empty `traceId` → `querySelector` on `data-svelte-trace-id`
3. If nothing is found → warns in the console and does nothing

**Examples:**

```js
// Locate by DOM id
iframe.contentWindow.postMessage(
    { type: "element-click", id: "hero", traceId: null },
    targetOrigin,
);

// Locate by trace id
iframe.contentWindow.postMessage(
    { type: "element-click", id: null, traceId: "st_abcd1234" },
    targetOrigin,
);
```

### 8.3 Outbound Messages (iframe → parent)

Sent only when `postToParent: true` and the page is embedded. Every message includes `source: "svelte-trace"`.

| `type`            | When it fires                                                              | Extra fields      |
| ----------------- | -------------------------------------------------------------------------- | ----------------- |
| `trace-ready`     | On load and on trace-related DOM mutations                                 | _(none)_          |
| `indicator-click` | User click, or a successful `element.click()` triggered by `element-click` | `rect`, `element` |
| `indicator-hover` | Pointer moves over a traced element                                        | `rect`, `element` |

The `element` object on click and hover events:

| Field                                            | Present when                                  |
| ------------------------------------------------ | --------------------------------------------- |
| `tagName`, `id`, `className`, `traceId`          | Always                                        |
| `tagLineCol`, `tagOffset`, `classOffset`, `file` | When `data-svelte-trace` decodes successfully |

`traceId` is taken from the nearest `[data-svelte-trace]` ancestor's `data-svelte-trace-id`.

## 9. Runtime Flags & Teardown

The indicator bundle is injected into the root layout whenever any of the following is true: `openInEditor` is `"vscode"` or `"cursor"`, `showIndicator` is `true`, or `postToParent` is `true`.

Before `indicator.js` runs, these globals are set:

| Global                                   | Controls                                       |
| ---------------------------------------- | ---------------------------------------------- |
| `window.__SVELTE_TRACE_SHOW_INDICATOR__` | Whether overlay UI is rendered                 |
| `window.__SVELTE_TRACE_POST_TO_PARENT__` | Whether outbound `postMessage` events are sent |

To tear down Svelte Trace at runtime (disconnect observers, remove listeners):

```js
window.__SVELTE_TRACE_DESTROY__?.();
```

## 10. Use Cases

- **DevTools** — Display source file and line number on hover.
- **Visual Editors** — Map DOM selections back to their source location.
- **Automation** — Locate and transform source snippets programmatically.
- **Debugging** — Build smarter, source-aware Svelte tooling.

## 11. Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/Git002/svelte-trace).

## 12. Support

- [Issue Tracker](https://github.com/Git002/svelte-trace/issues)
- [Discussions](https://github.com/Git002/svelte-trace/discussions)
- [Email](mailto:i.am.abhaysalvi@gmail.com)

## 13. License

MIT — see [LICENSE](LICENSE).

_Built with ❤️ for the Svelte community._
