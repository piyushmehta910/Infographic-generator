// ============================================================
// Offscreen HTML renderer for exports.
//
// The live preview renders AI output inside an <iframe srcDoc>,
// which html-to-image cannot rasterize (nested browsing contexts
// are skipped during SVG foreignObject serialization). For exports
// we re-render the SAME html inline in a detached container:
//   - <head> <style>/<link> rules are cloned into the container
//   - <body> markup becomes the container's child
//   - the node is attached offscreen so it lays out with real fonts,
//     captured at natural canvas size (2x pixel ratio), then removed.
//
// Style leakage into the app shell is transient: the node exists
// only for the duration of one export call and is always removed
// in a finally block by the caller.
// ============================================================

export async function renderOffscreenForCapture(
  html: string,
  width: number,
  height: number,
): Promise<HTMLElement> {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const holder = document.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  holder.setAttribute("data-export-capture", "");
  Object.assign(holder.style, {
    position: "fixed",
    left: "-200vw",
    top: "0px",
    width: `${width}px`,
    height: `${height}px`,
    overflow: "hidden",
    background: "#ffffff",
    zIndex: "-1",
    pointerEvents: "none",
  });

  const inner = document.createElement("div");
  Object.assign(inner.style, {
    width: "100%",
    height: "100%",
    position: "relative",
  });

  // Clone stylesheet/link nodes from the generated document's head.
  const headNodes = doc.head.querySelectorAll("style, link[rel='stylesheet']");
  for (const node of Array.from(headNodes)) {
    inner.appendChild(node.cloneNode(true));
  }

  // Append the body content (cloned so the parsed doc stays intact).
  if (doc.body) {
    inner.appendChild(doc.body.cloneNode(true));
  } else {
    inner.innerHTML = html;
  }

  holder.appendChild(inner);
  document.body.appendChild(holder);

  // Wait for webfonts (Google Fonts inside generated HTML) to be ready
  // so text renders with the intended families in the capture.
  try {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) await fonts.ready;
  } catch {
    /* font API unavailable — proceed */
  }

  return holder;
}
