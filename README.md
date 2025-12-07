<p align="center">
    <a href="https://github.com/Git002/svelte-trace">
    <img src="https://beeimg.com/images/p32116343591.png" alt="Svelte Trace Logo" width="225" />
    </a>
</p>

<h1 align="center">Svelte Trace</h1>

<p align="center">
    <strong>Trace your Svelte components in the DOM—effortlessly.</strong>
    <br />
    <em>A Svelte 5 preprocessor that injects <code>data-svelte-trace</code> metadata into every DOM element for reliable tooling, debugging, and automation.</em>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/svelte-trace"><img src="https://img.shields.io/npm/v/svelte-trace.svg" alt="NPM Version"></a>
<a href="https://github.com/Git002/svelte-trace/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/svelte-trace.svg" alt="License"></a>
</p>

---

## Why Svelte Trace?

Visual editors, dev tools, and scripts need to map DOM elements back to source code. Svelte Trace solves this by embedding base64-encoded source metadata directly into your components—no config, no fuss.

## Features

- **Automatic Metadata:** Every HTML element gets a `data-svelte-trace` attribute with line, column, and file path.
- **Plug & Play:** Just add to your preprocessors—no setup required.
- **Tooling Ready:** Power editors, dev tools, and custom scripts.
- **VS Code Integration:** (Optional) Ctrl+Click in the browser to jump to source in VS Code.

## 📦 Install

```bash
npm install svelte-trace --save-dev
```

## Usage

### 1. Add to `svelte.config.js`

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

### 2. Start your dev server

```bash
npm run dev
```

## What It Does

Svelte Trace adds a base64-encoded `data-svelte-trace` attribute to every element into the browser DOM so that you could build dev tooling around that:

**Before:**

```html
<div class="container">
  <h1>Hello World</h1>
</div>
```

**After:**

```html
<div class="container" data-svelte-trace="...">
  <h1 data-svelte-trace="...">Hello World</h1>
</div>
```

## Decoding Metadata

Decode the trace to get source info:

**Browser:**

```js
const el = document.querySelector("[data-svelte-trace]");
const decoded = atob(el.getAttribute("data-svelte-trace"));
console.log(decoded);
// Example: tag[1:1]-class[5:52]-f[/path/to/component.svelte]
```

**Node.js:**

```js
const encoded = "dGFnWzI6M10tY2xhc3NbLTE6LTFdLWZbL3BhdGgvc3ZlbHRlXQ==";
const decoded = Buffer.from(encoded, "base64").toString("utf8");
console.log(decoded);
```

**Format:**

- `tag[line:column]` — element position
- `class[line:column]` — class attribute position (`-1:-1` if missing)
- `f[filepath]` — source file path

## Use Cases

- **DevTools:** Show source file + line on hover.
- **Visual Editors:** Map DOM selections to source.
- **Automation:** Locate and transform source snippets.
- **Debugging:** Build smarter Svelte tools.

## VS Code Integration (Optional)

Enable "Open In VSCode" with Ctrl+Click:

```js
svelteTrace({
  openInCode: true,
});
```

<p align="center">
    <img src="https://beeimg.com/images/v89261247551.gif" alt="VS Code open-in-editor demo" width="800" />
</p>

## Contribute

Issues and PRs welcome! [GitHub](https://github.com/Git002/svelte-trace)

## License

MIT — see [LICENSE](LICENSE).

## Support

- [Issues](https://github.com/Git002/svelte-trace/issues)
- [Discussions](https://github.com/Git002/svelte-trace/discussions)
- [Email](mailto:i.am.abhaysalvi@gmail.com)

---

<p align="center"><em>Built with ❤️ for the Svelte community</em></p>
