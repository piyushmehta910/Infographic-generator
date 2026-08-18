// ============================================================
// CSV parsing + chart detection (PapaParse).
// ============================================================

import Papa from "papaparse";

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  numericColumns: string[];
  suggestions: string[];
}

export function parseCSV(text: string): ParsedCSV | null {
  const result = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (result.errors.length > 0 && result.data.length === 0) return null;
  const rows = result.data;
  if (rows.length === 0) return null;

  const headers = Object.keys(rows[0]).filter(Boolean);
  if (headers.length === 0) return null;

  const numericColumns = headers.filter((h) =>
    rows.some((r) => {
      const v = (r[h] ?? "").replace(/[^0-9.\-]/g, "");
      return v !== "" && !Number.isNaN(parseFloat(v));
    }),
  );

  // Chart-type suggestions based on shape of the data
  const suggestions: string[] = [];
  const rowCount = rows.length;
  if (rowCount >= 2 && headers.length >= 2) {
    if (rowCount <= 8) suggestions.push("bar");
    if (rowCount <= 12) suggestions.push("line");
    if (rowCount <= 6) suggestions.push("pie");
  }
  if (numericColumns.length >= 1 && headers.length >= 1) suggestions.push("metric-card");
  if (rowCount >= 2 && numericColumns.length >= 1) suggestions.push("progress-ring");
  if (suggestions.length === 0) suggestions.push("metric-card");

  return { headers, rows, numericColumns, suggestions };
}

export function csvToContentText(parsed: ParsedCSV): string {
  const lines = [parsed.headers.join(",")];
  for (const row of parsed.rows) {
    lines.push(parsed.headers.map((h) => row[h] ?? "").join(","));
  }
  return lines.join("\n");
}
