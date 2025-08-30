// VS Code Bridge - Click to open files in VS Code
document.addEventListener("DOMContentLoaded", function () {
  let isCtrlPressed = false;
  let currentTraceableElement = null;
  let lastKnownMouseTarget = null;

  // --- Create a single, dedicated overlay element ---
  const overlay = document.createElement("div");
  overlay.id = "svelte-trace-vscode-bridge-overlay";
  document.body.appendChild(overlay);

  /**
   * Decode base64 safely (handles UTF-8, not just ASCII)
   * @param {string} str
   */
  function decodeBase64(str) {
    try {
      const binary = atob(str);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    } catch (error) {
      console.error("Failed to decode base64:", error);
      return "";
    }
  }

  /**
   * Parse the decoded trace into a VS Code deep link.
   * @param {string} decoded
   */
  function buildVSCodeLink(decoded) {
    const match = decoded.match(/tag\[(\d+):(\d+)\].*?-f\[(.+)\]/);
    if (!match) return null;

    const line = parseInt(match[1], 10);
    const column = parseInt(match[2], 10);
    const filepath = match[3];

    return `vscode://file/${filepath}:${line}:${column}`;
  }

  /**
   * Hides the dedicated overlay element.
   */
  function clearCurrentOverlay() {
    currentTraceableElement = null;
    overlay.style.display = "none";
  }

  /**
   * Positions and shows the overlay on top of a specific element.
   * @param {Element} element
   */
  function showOverlayOn(element) {
    if (!element) return;
    const traceableElement = element.closest("[data-svelte-trace]");

    // If we're already showing the overlay on this element, do nothing.
    if (traceableElement === currentTraceableElement) return;

    if (traceableElement) {
      currentTraceableElement = traceableElement;
      const rect = traceableElement.getBoundingClientRect();
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.top = `${rect.top + window.scrollY}px`;
      overlay.style.left = `${rect.left + window.scrollX}px`;
      overlay.style.display = "block";
    } else {
      clearCurrentOverlay();
    }
  }

  /**
   * Handle ctrl+click on elements with data-svelte-trace
   * @param {MouseEvent} event
   */
  function handleClick(event) {
    if (!(event.ctrlKey || event.metaKey)) return;

    const element = event.target.closest("[data-svelte-trace]");
    if (!element) return;

    const encoded = element.getAttribute("data-svelte-trace");
    if (!encoded) return;

    const decoded = decodeBase64(encoded);
    const vscodeLink = buildVSCodeLink(decoded);

    if (vscodeLink) {
      console.log("Opening in VS Code:", vscodeLink);
      window.open(vscodeLink, "_self");
    }
  }

  /**
   * Track Ctrl key press.
   * @param {KeyboardEvent} event
   */
  function handleKeyDown(event) {
    if ((event.key === "Control" || event.key === "Meta") && !isCtrlPressed) {
      isCtrlPressed = true;
      document.body.style.cursor = "pointer";
      // Immediately show the overlay on the last known target.
      showOverlayOn(lastKnownMouseTarget);
    }
  }

  /**
   * Track Ctrl key release.
   * @param {KeyboardEvent} event
   */
  function handleKeyUp(event) {
    if (event.key === "Control" || event.key === "Meta") {
      isCtrlPressed = false;
      document.body.style.cursor = "auto";
      clearCurrentOverlay();
    }
  }

  // A lightweight, persistent listener that ALWAYS tracks the mouse position.
  document.addEventListener(
    "mousemove",
    (event) => {
      lastKnownMouseTarget = event.target;
      if (isCtrlPressed) {
        showOverlayOn(lastKnownMouseTarget);
      }
    },
    true
  );

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  document.addEventListener("click", handleClick);
  window.addEventListener("blur", handleKeyUp);
});
