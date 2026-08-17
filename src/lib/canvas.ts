import { AspectRatioId } from "@/lib/types";
import { ASPECT_RATIOS } from "@/lib/constants";

/**
 * Resolve the exact pixel canvas size for an aspect-ratio request.
 * Explicit width/height always win; otherwise falls back to the preset
 * dimensions. Single source of truth for all canvas math in the app.
 */
export function getCanvasDimensions(
  aspectRatio?: AspectRatioId,
  width?: number,
  height?: number,
): { width: number; height: number } {
  if (width && height) return { width, height };
  const preset = aspectRatio ? ASPECT_RATIOS[aspectRatio] : undefined;
  return {
    width: preset?.width ?? 1080,
    height: preset?.height ?? 1080,
  };
}

export type CanvasOrientation = "square" | "portrait" | "wide";

export function getCanvasOrientation(
  aspectRatio?: AspectRatioId,
  width?: number,
  height?: number,
): CanvasOrientation {
  const { width: w, height: h } = getCanvasDimensions(aspectRatio, width, height);
  if (w > h) return "wide";
  if (h > w) return "portrait";
  return "square";
}