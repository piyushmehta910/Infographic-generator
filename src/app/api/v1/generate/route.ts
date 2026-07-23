import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, idea, image, imageUrl, templateId, theme, aspectRatio, font } = body;

    if (!text && !idea && !image && !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Please provide text, idea, image, or imageUrl' },
        { status: 400 }
      );
    }

    // This endpoint is a proxy - actual AI calls happen client-side
    // Return the request configuration that the client can use
    return NextResponse.json({
      success: true,
      message: 'API endpoint ready. Use client-side generation with your AI provider API key.',
      data: {
        inputType: text ? 'text' : idea ? 'idea' : image ? 'image' : 'image-url',
        templateId: templateId || 'modern',
        theme: theme || 'light',
        aspectRatio: aspectRatio || '1:1',
        font: font || 'inter',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }
}