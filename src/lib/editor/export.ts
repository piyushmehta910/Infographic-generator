// ============================================================
// Phase 4.5: Export from the editable Fabric canvas.
// PNG (2x/3x), JPG, SVG, PDF (pdf-lib), and JSON canvas state.
// ============================================================

import { Project } from "./persistence";

type FabricModule = typeof import("fabric");

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function exportCanvasPNG(
  canvas: InstanceType<FabricModule["Canvas"]>,
  multiplier: 2 | 3,
  filename = "infographic.png",
): Promise<void> {
  const dataUrl = canvas.toDataURL({ format: "png", multiplier });
  downloadDataUrl(dataUrl, filename);
}

export async function exportCanvasJPG(
  canvas: InstanceType<FabricModule["Canvas"]>,
  multiplier: 2 | 3,
  filename = "infographic.jpg",
): Promise<void> {
  const dataUrl = canvas.toDataURL({ format: "jpeg", quality: 1, multiplier });
  downloadDataUrl(dataUrl, filename);
}

export async function exportCanvasSVG(
  canvas: InstanceType<FabricModule["Canvas"]>,
  filename = "infographic.svg",
): Promise<void> {
  const svg = canvas.toSVG();
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportCanvasPDF(
  canvas: InstanceType<FabricModule["Canvas"]>,
  widthPx: number,
  heightPx: number,
  filename = "infographic.pdf",
): Promise<void> {
  const { PDFDocument, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  // 96dpi px -> pt (72pt/inch)
  const width = Math.round((widthPx * 72) / 96);
  const height = Math.round((heightPx * 72) / 96);
  const page = pdf.addPage([width, height]);
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });

  const pngData = canvas.toDataURL({ format: "png", multiplier: 2 });
  const bytes = Uint8Array.from(atob(pngData.split(",")[1]), (c) => c.charCodeAt(0));
  const image = await pdf.embedPng(bytes);
  page.drawImage(image, { x: 0, y: 0, width, height });

const pdfBytes = await pdf.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportCanvasJSON(
  canvas: InstanceType<FabricModule["Canvas"]>,
  filename = "infographic.json",
): Promise<void> {
  const json = JSON.stringify(canvas.toJSON(), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportProjectFile(project: Project): Promise<void> {
  const { exportProjectJSON } = await import("./persistence");
  await exportProjectJSON(project);
}

