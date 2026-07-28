'use client';

import React from 'react';
import { ModernTemplate } from './ModernTemplate';
import { BusinessTemplate } from './BusinessTemplate';
import { TimelineTemplate } from './TimelineTemplate';
import { MarketingTemplate } from './MarketingTemplate';
import { getTheme } from '@/services/template/templateEngine';

const THUMB_SIZE = 240;
const ASPECT = { width: THUMB_SIZE, height: THUMB_SIZE };
const LIGHT_THEME = getTheme('light');

const templateRenderers: Record<string, React.FC<any>> = {
  modern: ModernTemplate,
  business: BusinessTemplate,
  timeline: TimelineTemplate,
  marketing: MarketingTemplate,
  comparison: ModernTemplate,
  education: ModernTemplate,
  medical: ModernTemplate,
  technology: ModernTemplate,
  startup: ModernTemplate,
};

const demoContent = {
  title: 'Template',
  subtitle: 'Preview',
  sections: [{ id: '1', title: 'Feature', content: 'Sample content preview', icon: '✨' }],
  statistics: [{ id: '1', value: '99%', label: 'Quality', icon: '📊' }],
  timeline: [],
  colors: ['#3B82F6', '#8B5CF6', '#EC4899'],
  icons: ['✨'],
  callToAction: 'Try Now',
};

interface TemplateThumbnailProps {
  templateId: string;
  templateName: string;
  useCase: string;
  colors: string;
}

export const TemplateThumbnail: React.FC<TemplateThumbnailProps> = ({ templateId, templateName, useCase, colors }) => {
  const Component = templateRenderers[templateId] || ModernTemplate;

  return (
    <div
      style={{
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        overflow: 'hidden',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      <div style={{ transform: 'scale(0.22)', transformOrigin: 'top left' }}>
        <div style={{ width: 1080, height: 1080 }}>
          <Component
            content={demoContent}
            theme={LIGHT_THEME}
            aspectRatio={{ width: 1080, height: 1080, label: '1:1' }}
            settings={{ alignment: 'center', spacing: 'comfortable', fontFamily: 'Inter', padding: 20, roundedCorners: 0, shadow: 0, border: false }}
            onElementClick={() => {}}
          />
        </div>
      </div>
      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          padding: '12px',
          color: '#fff',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 700 }}>{templateName}</div>
        <div style={{ fontSize: '10px', opacity: 0.8 }}>{useCase}</div>
      </div>
    </div>
  );
};