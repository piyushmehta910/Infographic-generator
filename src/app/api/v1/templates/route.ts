import { NextResponse } from 'next/server';
import { BUILT_IN_TEMPLATES } from '@/services/template/templateEngine';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: BUILT_IN_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.category,
      aspectRatios: t.aspectRatios,
      themes: t.themes,
      fonts: t.fonts,
      version: t.version,
    })),
  });
}