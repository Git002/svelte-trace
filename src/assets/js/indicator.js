/**
 * Visually highlights hovered and clicked DOM elements
 * and reports element metadata to a parent window (iframe-safe).
 *
 * Lifecycle:
 * - We emit `trace-ready` event after load / DOM updates.
 * - We emit `indicator-click` event when an element is clicked.
 * - We emit `indicator-hover` event when the mouse is hovered over an element.
 * - We accept `element-click` messages from the parent to programmatically click an element.
 */

// ---------- Configuration ----------
const SHOW_INDICATOR = window.__SVELTE_TRACE_SHOW_INDICATOR__ === true;
const POST_TO_PARENT = window.__SVELTE_TRACE_POST_TO_PARENT__ !== false;

const PARENT_REQUEST_ELEMENT_CLICK = "element-click";

const CONFIG = {
    SOURCE_ID: "svelte-trace",
    CLASS_NAMES: {
        base: "svelte-trace-indicator",
        click: "svelte-trace-indicator-click",
        hover: "svelte-trace-indicator-hover",
    },
};
const BODY_CURSOR_CLASS = "svelte-trace-indicator-cursor";

// ---------- Element Geometry ----------
const ElementBounds = {
    fromElement(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
        };
    },
};

// ---------- Indicator Overlay Rendering ----------
const IndicatorOverlay = {
    create(...classNames) {
        const el = document.createElement("div");
        el.className = classNames.join(" ");
        el.setAttribute("aria-hidden", "true");
        el.style.pointerEvents = "none";
        el.style.position = "fixed";
        el.style.boxSizing = "border-box";
        el.style.display = "none";
        return el;
    },

    isIndicator(el) {
        return el?.closest?.("." + CONFIG.CLASS_NAMES.base) ?? false;
    },

    show(overlayEl, bounds) {
        Object.assign(overlayEl.style, {
            top: `${bounds.top}px`,
            left: `${bounds.left}px`,
            width: `${bounds.width}px`,
            height: `${bounds.height}px`,
            display: "block",
        });
    },

    hide(overlayEl) {
        overlayEl.style.display = "none";
    },
};

// Decoded format: tagName[tagname]-tagLineCol[line:column]-tagOffset[start:end]-classOffset[start:end]-file[filepath]
function parseTraceString(decoded) {
    if (!decoded || typeof decoded !== "string") return null;
    const tagNameMatch = decoded.match(/tagName\[([^\]]*)\]/);
    const tagLineColMatch = decoded.match(/tagLineCol\[(\d+):(\d+)\]/);
    const tagOffsetMatch = decoded.match(/tagOffset\[(-?\d+):(-?\d+)\]/);
    const classOffsetMatch = decoded.match(/classOffset\[(-?\d+):(-?\d+)\]/);
    const fileMatch = decoded.match(/file\[([^\]]*)\]/);
    if (!tagNameMatch || !tagLineColMatch || !fileMatch) return null;
    return {
        tagName: tagNameMatch[1] ?? "",
        tagLineCol: {
            line: parseInt(tagLineColMatch[1], 10),
            column: parseInt(tagLineColMatch[2], 10),
        },
        tagOffset: tagOffsetMatch
            ? { start: parseInt(tagOffsetMatch[1], 10), end: parseInt(tagOffsetMatch[2], 10) }
            : null,
        classOffset: classOffsetMatch
            ? { start: parseInt(classOffsetMatch[1], 10), end: parseInt(classOffsetMatch[2], 10) }
            : null,
        file: fileMatch[1] ?? "",
    };
}

// ---------- Share data with parent window ----------
const ParentMessenger = {
    post(type, payload) {
        if (!POST_TO_PARENT || window.parent === window) return;

        try {
            window.parent.postMessage(
                {
                    type: type,
                    source: CONFIG.SOURCE_ID,
                    ...payload,
                },
                "*",
            );
        } catch (err) {
            console.warn("[Indicator] postMessage failed:", err);
        }
    },

    createIndicatorPayload(element, bounds) {
        const tracedElement = element.closest?.("[data-svelte-trace]");
        const encoded = tracedElement?.dataset?.svelteTrace;
        const traceId = tracedElement?.dataset?.svelteTraceId ?? null;
        let trace = null;

        if (encoded) {
            try {
                trace = parseTraceString(atob(encoded));
            } catch (_) {}
        }

        return {
            rect: bounds,
            element: {
                tagName: element.tagName,
                id: element.id || null,
                className: element.className || null,
                traceId,
                ...(trace && {
                    tagLineCol: trace.tagLineCol,
                    tagOffset: trace.tagOffset,
                    classOffset: trace.classOffset,
                    file: trace.file,
                }),
            },
        };
    },
};

/**
 * Resolves an element from a parent-issued programmatic click payload.
 * Prefers `id` (non-empty) via `getElementById`; otherwise `traceId` via `data-svelte-trace-id`
 *
 * @param {{ id?: string | null; traceId?: string | null }} data
 * @returns {Element | null}
 */
function resolveClickTarget(data) {
    const id = data.id;
    if (id != null && String(id).length > 0) {
        const byId = document.getElementById(String(id));
        return byId instanceof Element ? byId : null;
    }

    const traceId = data.traceId;
    if (traceId != null && String(traceId).length > 0) {
        const safe = CSS.escape(String(traceId));
        return document.querySelector(`[data-svelte-trace-id="${safe}"]`);
    }

    return null;
}

// ---------- Initialize Indicator Script ----------
function init() {
    document.documentElement.classList.add(BODY_CURSOR_CLASS);

    let clickIndicator = null;
    let hoverIndicator = null;
    let lastClickedElement = null;
    let lastHoveredElement = null;

    let resizeObserver = null;
    let mutationObserver = null;

    /** Observes trace attributes / subtree so the parent can refresh after HMR-style updates */
    let traceLifecycleObserver = null;
    /** Parent `postMessage` → programmatic click */
    let parentMessageHandler = null;

    /**
     * Informs the parent that the traced DOM may have changed. Fires on load and on each matching mutation.
     */
    function postTraceReady() {
        if (!POST_TO_PARENT || window.parent === window) return;
        ParentMessenger.post("trace-ready", {});
    }

    if (POST_TO_PARENT && window.parent !== window) {
        traceLifecycleObserver = new MutationObserver(() => postTraceReady());
        traceLifecycleObserver.observe(document.documentElement, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ["data-svelte-trace-id", "data-svelte-trace"],
        });

        window.addEventListener("load", () => postTraceReady(), { once: true });
        if (document.readyState === "complete") {
            postTraceReady();
        }
    }

    /**
     * Parent asks the iframe to click an element (e.g. restore selection after HMR)
     * Payload: `{ type: "element-click", id?: string | null, traceId?: string | null }`
     */
    function handleMessageFromParent(event) {
        if (window.parent === window) return;
        if (event.source !== window.parent) return;

        const data = event.data;

        if (!data || typeof data !== "object") return;
        if (data.type !== PARENT_REQUEST_ELEMENT_CLICK) return;

        const el = resolveClickTarget(data);
        if (!el) {
            console.warn(
                "[Indicator] programmatic element-click: no element for id / traceId",
                data,
            );
            return;
        }

        try {
            el.click();
        } catch (err) {
            console.warn("[Indicator] programmatic click failed:", err);
        }
    }

    if (window.parent !== window) {
        parentMessageHandler = handleMessageFromParent;
        window.addEventListener("message", parentMessageHandler);
    }

    if (SHOW_INDICATOR) {
        // Create overlay elements
        clickIndicator = IndicatorOverlay.create(CONFIG.CLASS_NAMES.base, CONFIG.CLASS_NAMES.click);
        hoverIndicator = IndicatorOverlay.create(CONFIG.CLASS_NAMES.base, CONFIG.CLASS_NAMES.hover);
        document.body.append(clickIndicator, hoverIndicator);

        // Update overlays when elements are resized
        resizeObserver = new ResizeObserver(() => {
            if (lastHoveredElement?.isConnected) {
                IndicatorOverlay.show(
                    hoverIndicator,
                    ElementBounds.fromElement(lastHoveredElement),
                );
            }
            if (lastClickedElement?.isConnected) {
                IndicatorOverlay.show(
                    clickIndicator,
                    ElementBounds.fromElement(lastClickedElement),
                );
            }
        });

        // Update overlays when elements are mutated (e.g. when an element is re-rendered)
        mutationObserver = new MutationObserver(() => {
            if (lastHoveredElement && !lastHoveredElement.isConnected) {
                lastHoveredElement = null;
                IndicatorOverlay.hide(hoverIndicator);
            }
            if (lastClickedElement && !lastClickedElement.isConnected) {
                lastClickedElement = null;
                IndicatorOverlay.hide(clickIndicator);
            }
        });
        mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    function handleClick(event) {
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (SHOW_INDICATOR && IndicatorOverlay.isIndicator(target)) return;

        lastClickedElement = target;

        if (SHOW_INDICATOR) {
            resizeObserver.observe(target);
            const bounds = ElementBounds.fromElement(target);
            IndicatorOverlay.show(clickIndicator, bounds);
        }

        const bounds = ElementBounds.fromElement(target);
        ParentMessenger.post(
            "indicator-click",
            ParentMessenger.createIndicatorPayload(target, bounds),
        );

        clearHover();
    }

    function handleMouseMove(event) {
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (SHOW_INDICATOR && IndicatorOverlay.isIndicator(target)) return;
        if (target === lastHoveredElement) return;

        // Don't show hover on the exact clicked/selected element
        if (target === lastClickedElement) {
            clearHover();
            return;
        }

        lastHoveredElement = target;

        if (SHOW_INDICATOR) {
            resizeObserver.observe(target);
            const bounds = ElementBounds.fromElement(target);
            IndicatorOverlay.show(hoverIndicator, bounds);
        }

        const bounds = ElementBounds.fromElement(target);
        ParentMessenger.post(
            "indicator-hover",
            ParentMessenger.createIndicatorPayload(target, bounds),
        );
    }

    function clearHover() {
        lastHoveredElement = null;
        if (SHOW_INDICATOR && hoverIndicator) {
            IndicatorOverlay.hide(hoverIndicator);
        }
    }

    function handleMouseLeave() {
        clearHover();
    }

    function handleMouseOut(event) {
        const related = event.relatedTarget;
        if (related === null) {
            return clearHover();
        }
        if (typeof document.contains === "function" && !document.contains(related)) {
            return clearHover();
        }
    }

    // Update overlays when the page is scrolled
    function handleScroll() {
        if (!SHOW_INDICATOR) return;
        if (lastHoveredElement?.isConnected) {
            IndicatorOverlay.show(hoverIndicator, ElementBounds.fromElement(lastHoveredElement));
        }
        if (lastClickedElement?.isConnected) {
            IndicatorOverlay.show(clickIndicator, ElementBounds.fromElement(lastClickedElement));
        }
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseout", handleMouseOut, true);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return function destroy() {
        document.documentElement.classList.remove(BODY_CURSOR_CLASS);

        document.removeEventListener("click", handleClick, true);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseleave", handleMouseLeave);
        document.removeEventListener("mouseout", handleMouseOut, true);
        window.removeEventListener("scroll", handleScroll);

        if (resizeObserver) resizeObserver.disconnect();
        if (mutationObserver) mutationObserver.disconnect();
        if (traceLifecycleObserver) traceLifecycleObserver.disconnect();
        if (parentMessageHandler) {
            window.removeEventListener("message", parentMessageHandler);
            parentMessageHandler = null;
        }
        if (clickIndicator) clickIndicator.remove();
        if (hoverIndicator) hoverIndicator.remove();
    };
}

// ---------- Bootstrap ----------
let destroy = null;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        destroy = init();
    });
} else {
    destroy = init();
}

// Escape hatch
window.__SVELTE_TRACE_DESTROY__ = () => destroy?.();
