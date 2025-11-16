<p align="center">
    <a href="https://github.com/Git002/svelte-trace">
    <img src="https://beeimg.com/images/p32116343591.png" alt="Svelte Trace Logo" width="225" />
    </a>
</p>

<h1 align="center">Svelte Trace</h1>

<p align="center">
    <strong>Inject traceable metadata into your Svelte components for tooling and debugging.</strong>
    <br />
    A Svelte 5 preprocessor that adds a <code>data-svelte-trace</code> attribute to every DOM element, enabling tools to reliably identify elements and their source locations.
</p>

<p align="center">
<a href="https://www.npmjs.com/package/svelte-trace"><img src="https://img.shields.io/npm/v/svelte-trace.svg" alt="NPM Version"></a>
<a href="https://github.com/Git002/svelte-trace/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/svelte-trace.svg" alt="License"></a>
</p>

---

## 🎯 Why Svelte Trace?

Building visual editors, dev tools, or automated scripts for Svelte? You need a reliable way to map DOM elements back to source code. `svelte-trace` solves this by injecting base64 metadata directly into your components at build time.

## ✨ Core Features

- **Automatic Metadata Injection:** Every HTML element gets a `data-svelte-trace` attribute with source location (line, column, file path).
- **Zero Configuration:** Just add it into your preprocessors list and you're good to go.
- **Optional VS Code Integration:** Enable `Ctrl + Click` in the browser to jump to source (development only, disabled by default).
- **Extensible Foundation:** Power visual editors, custom dev tools, or automated transformations.

## 📦 Installation

```bash
npm install svelte-trace --save-dev
```

## 🚀 Quick Start

### 1. Update `svelte.config.js`

```js
import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
// Import svelteTrace
import { svelteTrace } from "svelte-trace";

// Then add it to your preprocess list
const config = {
  preprocess: [vitePreprocess(), svelteTrace()],
  kit: { adapter: adapter() },
};

export default config;
```

### 2. Run your dev server

```bash
npm run dev
```

## 🔍 How It Works

Every element gets a base64-encoded `data-svelte-trace` attribute:

**Input:**

```html
<div class="container">
  <h1>Hello World</h1>
</div>
```

**Output:**

```html
<div
  class="container"
  data-svelte-trace="dGFnWzE6MV0tY2xhc3NbNTo1Ml0tZlsvaG9tZS9hYmhheS8uLi5zdmVsdGVd"
>
  <h1 data-svelte-trace="dGFnWzI6M10tY2xhc3NbLTE6LTFdLWZbL2hvbWUvYWJoYXkvLi4uc3ZlbHRlXQ==">
    Hello World
  </h1>
</div>
```

## 📖 Decoding the Metadata

Decode the `data-svelte-trace` value to access source information:

**Browser:**

```js
const el = document.querySelector("[data-svelte-trace]");
const decoded = atob(el.getAttribute("data-svelte-trace"));
console.log(decoded);
// Output: tag[1:1]-class[5:52]-f[/path/to/component.svelte]
```

**Node.js:**

```js
const encoded = "dGFnWzI6M10tY2xhc3NbLTE6LTFdLWZbL3BhdGgvc3ZlbHRlXQ==";
const decoded = Buffer.from(encoded, "base64").toString("utf8");
console.log(decoded);
// Output: tag[2:3]-class[-1:-1]-f[/path/to/component.svelte]
```

**Token Format:**

- `tag[line:column]` — element position in source
- `class[line:column]` — class attribute position (`-1:-1` if absent)
- `f[filepath]` — source file path

**Parse example:**

```js
const decoded = "tag[4:2]-class[-1:-1]-f[src/routes/+page.svelte]";
const m = decoded.match(/tag\[(.*?)\]-class\[(.*?)\]-f\[(.*)\]/);
const [_, tagPos, classInfo, filePath] = m;
```

## 💡 Use Cases

- **DevTools:** Display source file + line when hovering elements.
- **Visual Editors:** Map DOM selections back to component source (Webflow/Figma style).
- **Automated Scripts:** Locate and transform source snippets programmatically.
- **Custom Debugging:** Build tools that understand your Svelte component structure.

### OPTIONAL: Enable "Open In VSCode" feature

Set `openInCode: true` to use `Ctrl + Click` to open elements in VS Code during development. Below is the little preview:

## ⚙️ Configuration

```js
svelteTrace({
  openInCode: true,
});
```

<p align="center">
    <img src="https://beeimg.com/images/v89261247551.gif" alt="VS Code open-in-editor demo" width="800" />
</p>

## 🤝 Contributing

Please report issues and submit pull requests on [GitHub](https://github.com/Git002/svelte-trace).

## 📄 License

MIT License - see [LICENSE](LICENSE) file.

## 📞 Support

- 🐛 [Report Issues](https://github.com/Git002/svelte-trace/issues)
- 💬 [Discussions](https://github.com/Git002/svelte-trace/discussions)
- 📧 [Email](mailto:i.am.abhaysalvi@gmail.com)

---

**Built with ❤️ for the Svelte community**
