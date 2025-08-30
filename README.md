<p align="center">
    <a href="https://github.com/Git002/svelte-trace">
    <img src="https://beeimg.com/images/p32116343591.png" alt="Svelte Trace Logo" width="225" />
    </a>
</p>

<h1 align="center">Svelte Trace</h1>

<p align="center">
    <strong>
        Instantly jump from your browser to your Svelte code in VS Code.
    </strong>
    <br />
    Supercharge your development workflow by <code>Ctrl + Clicking</code> any element to open its source.
</p>

<p align="center">
<a href="https://www.npmjs.com/package/svelte-trace"><img src="https://img.shields.io/npm/v/svelte-trace.svg" alt="NPM Version"></a>
<a href="https://github.com/Git002/svelte-trace/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/svelte-trace.svg" alt="License"></a>
</p>

> ⚠️ BETA Stage: This package is currently in BETA stage, and will evolve. Things might break, and your feedback is most welcomed. Happy Coding!

---

`svelte-trace` is a Svelte 5 preprocessor that closes the gap between your rendered application and your source code. Stop hunting for components in your file tree—just `Ctrl + Click` in your browser, and **instantly land in the right file and line in VS Code!** 

Here's how the end result is gonna look like:

<br/>
<p align="center">
    <img src="https://beeimg.com/images/v89261247551.gif" alt="Svelte Trace Demo" width="800" />
    </a>
</p>

## 🚀 Key Features

- **🖱️ Click to Open in VS Code:** `Ctrl + Click` (or `Cmd + Click`) any element during development to open its source file directly in your editor, pinpointing the exact line and column.

- **✨ Zero Configuration:** The client-side script that enables the click-to-open functionality is injected automatically. Just add the preprocessor to your config, and you're done.

- **🛠️ Extensible for Tooling:** Under the hood, it works by adding source code metadata to your HTML elements. This powerful foundation can be used to build advanced tools like visual editors like webflow/figma, but for svelte and edit code in realtime visually.

## 📦 Installation

```bash
npm install svelte-trace --save-dev
```

## 🔧 Getting Started in 3 Steps

### Step 1: Update your svelte.config.js

Add svelteTrace to your preprocessor array. It's that simple.

```js
// Basic svelte.config.js
import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { svelteTrace } from "svelte-trace";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Add svelteTrace() to your preprocessors
  preprocess: [vitePreprocess(), svelteTrace()],
  kit: {
    adapter: adapter(),
  },
};

export default config;
```

### Step 2: Run your dev server

```bash
npm run dev
```

### Step 3: Ctrl + Click Anything!

Open your application in the browser, hold down the `Ctrl` (or `Cmd` on Mac) key, and `click` on any element. It will instantly open in your VS Code editor.

## ⚙️ Configuration

The preprocessor is designed to work **out-of-the-box**. However, you can customize its behavior.

```js
// svelte.config.js
import { svelteTrace } from "svelte-trace";

const config = {
  // The client-side "Open in VS Code" script is injected by default.
  // Set to false if you only want the metadata for building custom tools.
  preprocess: [svelteTrace({ openInCode: false })],
  // ...
};
```

## 🤔 How It Works

`svelte-trace` parses your Svelte components during the build process and injects a `data-svelte-trace` attribute into every HTML element. This attribute contains the element's exact location in your source code.

Input Svelte Code:

```html
<div>
  <h1>Hello World</h1>
</div>
```

Output HTML:

```html
<div data-svelte-trace="dGFnWzQ6Ml0tbG9jWy0xOi0xXS1mW3NyYy9yb3V0ZXMvK3BhZ2Uuc3ZlbHRlXQ==">
  <h1 data-svelte-trace="dGFnWzU6NF0tbG9jWy0xOi0xXS1mW3NyYy9yb3V0ZXMvK3BhZ2Uuc3ZlbHRlXQ==">
    Hello World
  </h1>
</div>
```

The automatically injected client-side script listens for `Ctrl` + `Click` events, reads this attribute, and constructs a `vscode://` link to open the file instantly.

## 🎯 Advanced Use Case: Building Visual Editors

While the primary feature is the "Open in VS Code" workflow, the metadata added by svelte-trace is powerful. It creates a bridge that allows you to build sophisticated tools, such as:

- **Visual Website Builders:** Create Webflow-like editors for Svelte.
- **Client-Facing Edit Tools:** Let clients make content or style changes safely.
- **Enhanced DevTools:** Build custom debugging and development experiences.

To build these tools, you can disable the default click handler with openInCode: false and implement your own logic to parse the data-svelte-trace attributes.

## 🤝 Contributing

We welcome contributions! This is beta software and needs testing across different Svelte applications. Please report issues, suggest features, or submit pull requests.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Inspired by the need for better visual editing tools in the Svelte ecosystem. Special thanks to the Svelte team for creating an amazing framework.

## 📞 Support

- 🐛 [Report Issues](https://github.com/Git002/svelte-trace/issues)
- 💬 [Discussions](https://github.com/Git002/svelte-trace/discussions)
- 📧 [Email](mailto:i.am.abhaysalvi@gmail.com)

---

**Built with ❤️ for the Svelte community**
