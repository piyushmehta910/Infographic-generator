// ============================================================
// Image OCR (Tesseract.js, lazily loaded). Runs in the browser.
// ============================================================

export async function ocrImage(dataUrl: string): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(dataUrl);
    return (data.text || "").trim();
  } finally {
    await worker.terminate();
  }
}
