import { NextRequest, NextResponse } from "next/server";

// ============================================================
// URL content extraction proxy.
// Fetches the target page server-side (avoids CORS) and extracts
// the main readable text with cheerio. Client-only fetching of
// arbitrary URLs fails on CORS, so this route is required.
// ============================================================

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ success: false, error: "Missing ?url= parameter" }, { status: 400 });
  }
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid URL" }, { status: 400 });
  }
  if (!/^https?:$/.test(target.protocol)) {
    return NextResponse.json({ success: false, error: "Only http(s) URLs are supported" }, { status: 400 });
  }

  try {
    const res = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; InfographicGenerator/1.0; +https://infographic-generator.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Upstream returned ${res.status}` },
        { status: 502 },
      );
    }
    const html = await res.text();
    const { load } = await import("cheerio");
    const $ = load(html);

    const title = $("title").first().text().trim();
    const description = $('meta[name="description"]').attr("content")?.trim() || "";

    // Extract main content: prefer <article>, else <main>, else body paragraphs.
    const $main = $("article").first();
    const $root = $main.length > 0 ? $main : $("main").first();
    const $content = $root.length > 0 ? $root : $("body");

    $content.find("script, style, noscript, iframe, nav, header, footer, form, button, svg, aside").remove();

    const paragraphs: string[] = [];
    $content.find("h1, h2, h3, h4, p, li, blockquote").each((_i, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text.length >= 40) paragraphs.push(text);
    });
    const text = paragraphs.slice(0, 80).join("\n\n");

    return NextResponse.json({
      success: true,
      title,
      description,
      text,
      source: target.toString(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch or extract the page" },
      { status: 502 },
    );
  }
}
