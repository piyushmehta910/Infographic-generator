'use client';

import React from 'react';
import { AspectRatio } from '@/lib/types';

interface AIDesignRendererProps {
  html: string;
  aspectRatio: AspectRatio;
}

export const AIDesignRenderer: React.FC<AIDesignRendererProps> = ({ html, aspectRatio }) => {
  const MAX_PREVIEW_WIDTH = 750;
  const MAX_PREVIEW_HEIGHT = 550;
  
  const scale = Math.min(
    MAX_PREVIEW_WIDTH / aspectRatio.width,
    MAX_PREVIEW_HEIGHT / aspectRatio.height,
    1
  );

  const scaledWidth = aspectRatio.width * scale;
  const scaledHeight = aspectRatio.height * scale;

  return (
    <div
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}
      className="template-canvas-container"
    >
      <div
        style={{
          width: `${aspectRatio.width}px`,
          height: `${aspectRatio.height}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
          border: 'none',
          overflow: 'hidden',
        }}
      >
        <iframe
          srcDoc={html}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            overflow: 'hidden',
          }}
          title="AI Generated Infographic"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
};

export default AIDesignRenderer;