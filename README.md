# SvelteTrace 🔍

> **⚠️ Beta Stage**: This package is currently in beta and may not be stable. Use with caution.

A Svelte 5 preprocessor (unofficial) that enables visual editing by adding metadata to HTML elements. SvelteTrace creates a bridge between visual editors and your actual Svelte code, making it possible to build tools like visual website builders that directly modify your source files.

## 🚀 What is SvelteTrace?

SvelteTrace is a pre-processor that automatically adds `data-svelte-trace` attributes to all HTML elements in your Svelte components. These attributes contain metadata about the element's location in your source code, including:

- File path
- Class attribute position (start/end offsets)
- Line numbers and positioning data

This enables the creation of visual editors that can:

- Click on any element in the browser
- Instantly know where it exists in your code
- Make real-time changes to your Svelte files
- Support Tailwind classes, inline styles, and more (in future)

## 🎯 Use Cases

- **Visual Website Builders**: Build Webflow-like editors for Svelte
- **Design Systems**: Allow designers to modify components visually
- **Rapid Prototyping**: Speed up development with visual editing tools
- **Client Editing**: Let clients make content/style changes without coding
- **Developer Tools**: Create better debugging and development experiences

## 📦 Installation

```bash
npm install svelte-trace --save-dev
```

## 🔧 Usage

### Basic Setup

Add SvelteTrace to your `svelte.config.js`:

```javascript
import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { svelteTrace } from "svelte-trace";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess(), svelteTrace()],

  kit: {
    // adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://svelte.dev/docs/kit/adapters for more information about adapters.
    adapter: adapter(),
  },

  extensions: [".svelte"],
};

export default config;
```

## 📋 Example Output

**Input:**

```svelte
<div class="bg-blue-500 text-white">
  <h1 class="text-2xl font-bold">Hello World</h1>
  <p>This is a paragraph</p>
</div>
```

**Output:**

```svelte
<div class="bg-blue-500 text-white" data-svelte-trace="loc[45,67]-f[src/App.svelte]">
  <h1 class="text-2xl font-bold" data-svelte-trace="loc[120,142]-f[src/App.svelte]">Hello World</h1>
  <p data-svelte-trace="loc[-1,-1]-f[src/App.svelte]">This is a paragraph</p>
</div>
```

## 📊 Metadata Format

The `data-svelte-trace` attribute contains:

- `loc[start,end]`: Character offsets of the class attribute in the file (-1,-1 if no class)
- `f[filepath]`: Relative path to the source file

**Future versions will use base64 encoding for more compact metadata.**

## 🛠️ Building Visual Editors

With SvelteTrace, you can build editors that:

1. **Parse metadata**: Extract file paths and positions from DOM elements
2. **Locate source code**: Find exact locations in your Svelte files
3. **Make changes**: Modify classes, styles, or content programmatically
4. **Update files**: Write changes back to your source code in real-time

Example of reading the metadata:

```javascript
// Get element metadata
const element = document.querySelector("[data-svelte-trace]");
const metadata = element.getAttribute("data-svelte-trace");

// Parse: "loc[45,67]-f[src/App.svelte]"
const [locPart, filePart] = metadata.split("-f");
const [start, end] = locPart.match(/\d+/g).map(Number);
const filepath = filePart.slice(1, -1); // Remove brackets

console.log({ start, end, filepath });
// { start: 45, end: 67, filepath: "src/App.svelte" }
```

## 🎨 Framework Compatibility

- ✅ **Svelte 5**: Full support
- ✅ **SvelteKit**: Full support
- ✅ **Vite**: Full support
- ✅ **Tailwind CSS**: Works perfectly
- ⚠️ **Svelte 4**: Not tested (may work)

## 🚧 Current Limitations (Beta)

- Metadata is not yet base64 encoded
- Limited testing with complex Svelte features
- No configuration options yet
- Performance not optimized for large applications
- May conflict with SSR in some edge cases

## 🗺️ Roadmap

- [ ] Base64 encoding for metadata
- [ ] Configuration options
- [ ] Performance optimizations
- [ ] Better error handling
- [ ] Support for more Svelte features
- [ ] Official visual editor
- [ ] React/Vue preprocessors

## 🤝 Contributing

We welcome contributions! This is beta software and needs testing across different Svelte applications.

### Development Setup

```bash
git clone https://github.com/yourusername/svelte-trace.git
cd svelte-trace
npm install
npm run build
```

### Testing

```bash
npm test
```

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
