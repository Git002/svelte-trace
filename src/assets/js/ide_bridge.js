// ======================
// Utility Functions
// ======================

const TraceUtils = {
    decodeBase64(str) {
        try {
            const binary = atob(str);
            const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
            return new TextDecoder().decode(bytes);
        } catch (e) {
            console.error("Failed to decode base64:", e);
            return "";
        }
    },

    buildEditorLink(decoded, scheme) {
        const match = decoded.match(/tagLineCol\[(\d+):(\d+)\].*?-file\[(.+)\]/);
        if (!match) return null;
        const [, line, column, filepath] = match;
        return `${scheme}://file/${filepath}:${line}:${column}`;
    },
};

// ======================
// IDE Bridge Implementation
// ======================

const SCHEME = window.__SVELTE_TRACE_EDITOR__ || "vscode";

document.addEventListener("DOMContentLoaded", () => {
    const state = {
        isCtrlPressed: false,
        lastTargetElement: null,
        currentElement: null,
    };

    const overlay = document.createElement("div");
    overlay.id = "svelte-trace-ide-bridge-overlay";
    document.body.appendChild(overlay);

    function hideOverlay() {
        state.currentElement = null;
        overlay.style.display = "none";
    }

    function showOverlay(target) {
        const el = target?.closest("[data-svelte-trace]");

        if (!el) return hideOverlay();
        if (el === state.currentElement) return;

        state.currentElement = el;

        const r = el.getBoundingClientRect();

        Object.assign(overlay.style, {
            width: `${r.width}px`,
            height: `${r.height}px`,
            top: `${r.top + scrollY}px`,
            left: `${r.left + scrollX}px`,
            display: "block",
        });
    }

    document.addEventListener(
        "mousemove",
        (e) => {
            state.lastTargetElement = e.target;
            if (state.isCtrlPressed) showOverlay(e.target);
        },
        true,
    );

    document.addEventListener("keydown", (e) => {
        if ((e.key === "Control" || e.key === "Meta") && !state.isCtrlPressed) {
            state.isCtrlPressed = true;
            document.body.style.cursor = "pointer";
            showOverlay(state.lastTargetElement);
        }
    });

    document.addEventListener("keyup", (e) => {
        if (e.key === "Control" || e.key === "Meta") resetState();
    });

    document.addEventListener("click", (e) => {
        if (!(e.ctrlKey || e.metaKey)) return;

        const el = e.target.closest("[data-svelte-trace]");
        if (!el) return;

        const decoded = TraceUtils.decodeBase64(el.dataset.svelteTrace);
        const link = TraceUtils.buildEditorLink(decoded, SCHEME);

        if (link) window.open(link, "_self");
    });

    document.addEventListener("mouseout", (e) => {
        if (e.relatedTarget === null) hideOverlay();
    });

    window.addEventListener("blur", resetState);

    function resetState() {
        state.isCtrlPressed = false;
        document.body.style.cursor = "auto";
        hideOverlay();
    }
});
