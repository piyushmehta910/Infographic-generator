// ============================================================
// Phase 3.5: Parse generated HTML + CSS into editable Fabric objects.
// Best-effort structural mapping: containers -> Rects, text -> IText,
// inline SVG -> Images. Runs fully in the browser (client-only).
// ============================================================

type FabricModule = typeof import("fabric");
type FObject = InstanceType<FabricModule["Object"]>;
type Rect = InstanceType<FabricModule["Rect"]>;

export interface FabricBuildResult {
  objects: FObject[];
  warnings: string[];
  background: string | null;
}

const FONT_FALLBACK = "Inter, system-ui, sans-serif";

function isVisible(el: Element, cs: CSSStyleDeclaration): boolean {
  return cs.display !== "none" && cs.visibility !== "hidden" && cs.opacity !== "0";
}

function parsePx(value: string): number {
  const m = value.match(/^([\d.]+)px$/);
  return m ? parseFloat(m[1]) : 0;
}

function parseBorderRadius(cs: CSSStyleDeclaration, w: number, h: number): { rx: number; ry: number } {
  if (cs.borderRadius === "50%") return { rx: w / 2, ry: h / 2 };
  const parts = cs.borderRadius.split(/\s+/);
  const first = parts[0] || "0";
  const rx = first.includes("%") ? (w * parseFloat(first)) / 100 : parsePx(first);
  const ry = parts[1] ? (parts[1].includes("%") ? (h * parseFloat(parts[1])) / 100 : parsePx(parts[1])) : rx;
  return { rx, ry };
}

function parseBoxShadow(cs: CSSStyleDeclaration): { color: string; blur: number; offsetX: number; offsetY: number } | null {
  const shadow = cs.boxShadow;
  if (!shadow || shadow === "none") return null;
  // e.g. "0 4px 20px rgba(0,0,0,0.1)"
  const m = shadow.match(/^(-?[\d.]+px)\s+(-?[\d.]+px)\s+([\d.]+px)\s+(.+)$/);
  if (!m) return null;
  return {
    offsetX: parsePx(m[1]),
    offsetY: parsePx(m[2]),
    blur: parsePx(m[3]),
    color: m[4].trim(),
  };
}

function hasVisualFill(cs: CSSStyleDeclaration): boolean {
  if (cs.backgroundColor && !/rgba\(0,\s*0,\s*0,\s*0\)|transparent/.test(cs.backgroundColor)) return true;
  if (cs.backgroundImage && cs.backgroundImage !== "none") return true;
  return false;
}

async function svgToImage(el: SVGSVGElement): Promise<FObject | null> {
  try {
    const clone = el.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(clone.outerHTML)}`;
    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("svg image failed"));
    });
    const rect = el.getBoundingClientRect();
    const { Image: FabricImage } = await import("fabric");
    const image = new FabricImage(img, {
      left: rect.left,
      top: rect.top,
    });
    const scale = rect.width && rect.height && img.width && img.height
      ? Math.min(rect.width / img.width, rect.height / img.height)
      : 1;
    image.scale(scale);
    return image;
  } catch {
    return null;
  }
}

function directText(el: Element): string {
  return Array.from(el.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent || "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function processElement(
  el: Element,
  objects: FObject[],
  warnings: string[],
): Promise<void> {
  if (!(el instanceof HTMLElement) && !(el instanceof SVGSVGElement)) return;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 1 && rect.height <= 1) return;

  const { Rect: FabricRect, IText: FabricIText, Shadow: FabricShadow, Image: FabricImage } = await import("fabric");

  // Inline SVG icons -> Image objects
  if (el instanceof SVGSVGElement) {
    const img = await svgToImage(el);
    if (img) objects.push(img);
    return;
  }

  if (el instanceof HTMLImageElement) {
    try {
      await new Promise<void>((resolve, reject) => {
        if (el.complete && el.naturalWidth > 0) return resolve();
        el.onload = () => resolve();
        el.onerror = () => reject(new Error("img failed"));
      });
      const image = new FabricImage(el, { left: rect.left, top: rect.top });
      image.scale(
        rect.width && rect.height && el.naturalWidth && el.naturalHeight
          ? Math.min(rect.width / el.naturalWidth, rect.height / el.naturalHeight)
          : 1,
      );
      objects.push(image);
    } catch {
      /* skip broken images */
    }
    return;
  }

  const cs = getComputedStyle(el);
  if (!isVisible(el, cs)) return;

  const text = directText(el);
  const hasText = text.length > 0;
  const tag = el.tagName.toLowerCase();
  const isContainer = /^(div|section|article|main|header|footer|aside|ul|ol|table|figure|span|a)$/.test(tag);
  const isHeading = /^h[1-6]$/.test(tag);
  const isTextNode = hasText && (/^(h[1-6]|p|li|td|th|span|a|figcaption)$/.test(tag) || isContainer);

  // Container background -> Rect (drawn beneath children)
  if (isContainer && hasVisualFill(cs)) {
    const radius = parseBorderRadius(cs, rect.width, rect.height);
    const shadow = parseBoxShadow(cs);
    const fill = cs.backgroundImage && cs.backgroundImage !== "none" ? cs.backgroundColor : cs.backgroundColor;
    const rectObj = new FabricRect({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      rx: radius.rx,
      ry: radius.ry,
      fill: fill || "transparent",
      stroke: cs.borderWidth && cs.borderWidth !== "0px" ? cs.borderColor : undefined,
      strokeWidth: cs.borderWidth && cs.borderWidth !== "0px" ? parsePx(cs.borderWidth) : 0,
      shadow: shadow
        ? new FabricShadow({ color: shadow.color, blur: shadow.blur, offsetX: shadow.offsetX, offsetY: shadow.offsetY })
        : undefined,
    });
    if (cs.backgroundImage && /gradient/.test(cs.backgroundImage)) {
      warnings.push("Gradient backgrounds are approximated with the base color in edit mode.");
    }
    objects.push(rectObj as unknown as Rect);
  }

  // Direct text -> IText (double-click to edit)
  if (isTextNode && hasText && text !== "…") {
    const radius = parseBorderRadius(cs, rect.width, rect.height);
    const shadow = parseBoxShadow(cs);
    const itext = new FabricIText(text, {
      left: rect.left,
      top: rect.top,
      width: Math.max(rect.width, 10),
      fontSize: Math.max(parsePx(cs.fontSize), 8),
      fontFamily: cs.fontFamily !== "" ? cs.fontFamily : FONT_FALLBACK,
      fontWeight: Number.isNaN(parseFloat(cs.fontWeight)) ? 400 : parseFloat(cs.fontWeight) || 400,
      fill: cs.color || "#000000",
      textAlign: (cs.textAlign as "left" | "center" | "right" | "justify") || "left",
      lineHeight: parseFloat(cs.lineHeight) > 1 ? parseFloat(cs.lineHeight) : 1.16,
      backgroundColor: hasVisualFill(cs) ? cs.backgroundColor : undefined,
      rx: radius.rx,
      ry: radius.ry,
      shadow: shadow
        ? new FabricShadow({ color: shadow.color, blur: shadow.blur, offsetX: shadow.offsetX, offsetY: shadow.offsetY })
        : undefined,
      breakWords: true,
      editingBorderColor: "#8b5cf6",
    });
    // Headings inherit container width so wrapping matches the design
    if (isHeading) itext.set({ width: Math.max(rect.width, 10) });
    objects.push(itext);
  }
}

async function walk(
  el: Element,
  objects: FObject[],
  warnings: string[],
  depth: number,
): Promise<void> {
  if (depth > 24) return;
  if (el instanceof HTMLScriptElement || el instanceof HTMLStyleElement || el instanceof HTMLMetaElement || el instanceof HTMLTitleElement) return;
  if (el instanceof HTMLElement && el.tagName.toLowerCase() === "br") return;

  await processElement(el, objects, warnings);
  const children = Array.from(el.children);
  for (const child of children) {
    await walk(child, objects, warnings, depth + 1);
  }
}

export async function buildFabricFromHTML(
  html: string,
  width: number,
  height: number,
): Promise<FabricBuildResult> {
  const warnings: string[] = [];

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none;";
  iframe.sandbox.add("allow-same-origin");
  document.body.appendChild(iframe);

  try {
    iframe.srcdoc = html;
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      setTimeout(() => resolve(), 2500);
    });

    const doc = iframe.contentDocument;
    if (!doc || !doc.body) throw new Error("Generated HTML could not be parsed.");

    const objects: FObject[] = [];
    const bodyCs = getComputedStyle(doc.body);
    const background =
      bodyCs.backgroundColor && !/rgba\(0,\s*0,\s*0,\s*0\)|transparent/.test(bodyCs.backgroundColor)
        ? bodyCs.backgroundColor
        : null;

const { Rect: FabricRect } = await import("fabric");
    const bodyRect = doc.body.getBoundingClientRect();
    const bodyWidth = bodyRect.width || width;
    const bodyHeight = bodyRect.height || height;

    // Full-canvas background keeps the exported image looking right.
    if (background) {
      objects.push(
        new FabricRect({
          left: 0,
          top: 0,
          width: bodyWidth,
          height: bodyHeight,
          fill: background,
        }),
      );
    }

    await walk(doc.body, objects, warnings, 0);
    return { objects, warnings, background };
  } finally {
    document.body.removeChild(iframe);
  }
}
