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
    left: "-300vw",
    top: "0px",
    width: `${width}px`,
    height: `${height}px`,
    overflow: "hidden",
    background: "#ffffff",
    zIndex: "-1",
    pointerEvents: "none",
  });

  const inner = document.createElement("div");
  inner.setAttribute("data-export-inner", "");
  Object.assign(inner.style, {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
  });

  // If the generated body has inline style or class attributes, transfer them to inner
  if (doc.body) {
    if (doc.body.getAttribute("style")) {
      inner.style.cssText += ";" + doc.body.getAttribute("style");
    }
    if (doc.body.className) {
      inner.className = doc.body.className;
    }
  }

  // Clone and scope stylesheet rules so body/html rules target inner instead of leaking.
  // <link rel="stylesheet"> (Google Fonts) is FETCHED and inlined as <style> first:
  // html-to-image's own link-inlining is flaky (CORS/timing), and inlining here
  // guarantees @font-face rules exist before the rasterizer runs.
  const headNodes = doc.querySelectorAll("style, link[rel='stylesheet']");
  for (const node of Array.from(headNodes)) {
    if (node.tagName.toLowerCase() === "style") {
      const styleEl = document.createElement("style");
      let css = node.textContent || "";
      // Scope body/html selectors to the export inner container
      css = css.replace(/(?:^|(?<=[},;]))\s*(?:html\s*,\s*body|html|body)\b/gi, "[data-export-inner]");
      styleEl.textContent = css;
      inner.appendChild(styleEl);
    } else {
      const href = node.getAttribute("href");
      let inlined = false;
      if (href) {
        try {
          const res = await fetch(href, { cache: "force-cache" });
          if (res.ok) {
            const cssText = await res.text();
            const styleEl = document.createElement("style");
            styleEl.setAttribute("data-export-inlined", href);
            // Inlined font CSS keeps absolute URLs (fonts.gstatic.com is CORS-enabled)
            styleEl.textContent = cssText;
            inner.appendChild(styleEl);
            inlined = true;
          }
        } catch {
          /* fall through to cloning the original link */
        }
      }
      if (!inlined) {
        inner.appendChild(node.cloneNode(true));
      }
    }
  }

  // Append the body's child contents directly into inner (avoids invalid nested <body> tag)
  if (doc.body) {
    const children = Array.from(doc.body.childNodes);
    if (children.length > 0) {
      for (const child of children) {
        inner.appendChild(child.cloneNode(true));
      }
    } else {
      inner.innerHTML += doc.body.innerHTML;
    }
  } else {
    inner.innerHTML += html;
  }

  holder.appendChild(inner);
  document.body.appendChild(holder);

  // Wait for layout + webfonts before capture. NOTE: `fonts.ready` alone is
  // racy — it can resolve BEFORE the inlined @font-face rules start loading
  // any font files. So: double-rAF (style/layout flush) → force reflow →
  // fonts.ready → poll until the FontFaceSet reports no pending loads.
  const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  void holder.offsetHeight; // force synchronous layout with the inlined CSS
  try {
    if (fonts?.ready) await fonts.ready;
    // Poll: give any late-declared @font-face loads a chance to register,
    // then confirm the set settles at "loaded" twice in a row.
    let stable = 0;
    for (let i = 0; i < 20 && stable < 2; i++) {
      if (fonts && fonts.status === "loaded") stable++;
      else stable = 0;
      await new Promise((r) => setTimeout(r, 100));
    }
  } catch {
    /* font API unavailable — proceed */
  }
  // Final settle so any webfont-driven reflow paints before rasterizing.
  await new Promise((r) => setTimeout(r, 120));

  return holder;
}
