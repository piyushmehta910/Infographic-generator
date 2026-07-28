'use client';

import React from 'react';
import { TemplateProps } from '@/lib/types';
import { getSpacingValue } from '@/services/template/templateEngine';

export const StartupTemplate: React.FC<TemplateProps> = ({
  content,
  theme,
  aspectRatio,
  settings,
  onElementClick,
}) => {
  const spacing = getSpacingValue(settings.spacing);
  const isDark = theme.isDark;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: isDark ? '#0f0a1a' : '#faf5ff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Poppins', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* Bold Header */}
      <div
        style={{
          padding: `${spacing * 2}px ${spacing * 2}px ${spacing}px`,
          position: 'relative',
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            right: '-20px',
            top: '-20px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentLight})`,
            opacity: 0.15,
          }}
        />
        <h1
          style={{
            fontSize: aspectRatio.width > aspectRatio.height ? '38px' : '28px',
            fontWeight: 800,
            color: theme.colors.text,
            margin: 0,
            lineHeight: 1.1,
            position: 'relative',
            zIndex: 1,
          }}
          onClick={() => onElementClick?.('title')}
        >
          {content.title}
        </h1>
        {content.subtitle && (
          <p style={{ fontSize: '15px', color: theme.colors.textSecondary, marginTop: '6px', fontWeight: 500, position: 'relative', zIndex: 1 }}>
            {content.subtitle}
          </p>
        )}
      </div>

      {/* Key Metrics - Large prominent stats */}
      {content.statistics.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(content.statistics.length, 3)}, 1fr)`,
            gap: '8px',
            padding: `0 ${spacing * 1.5}px ${spacing}px`,
          }}
        >
          {content.statistics.slice(0, 3).map((stat) => (
            <div
              key={stat.id}
              onClick={() => onElementClick?.(`stat-${stat.id}`)}
              style={{
                background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentLight})`,
                borderRadius: '16px',
                padding: `${spacing}px ${spacing * 0.8}px`,
                textAlign: 'center',
                color: '#ffffff',
                boxShadow: `0 4px 12px ${theme.colors.shadow}`,
              }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, lineHeight: 1.1 }}>
                {stat.prefix}{stat.value}{stat.suffix}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: 500, marginTop: '2px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Sections */}
      <div
        style={{
          flex: 1,
          padding: `0 ${spacing * 1.5}px ${spacing * 1.5}px`,
          display: 'grid',
          gridTemplateColumns: aspectRatio.width > aspectRatio.height ? '1fr 1fr' : '1fr',
          gap: `${spacing}px`,
          overflow: 'auto',
        }}
      >
        {content.sections.slice(0, 4).map((section, index) => (
          <div
            key={section.id}
            onClick={() => onElementClick?.(section.id)}
            style={{
              background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
              borderRadius: '14px',
              padding: `${spacing * 1.2}px`,
              border: `1px solid ${theme.colors.border}`,
              transition: 'transform 0.2s',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Small accent dot */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '40px',
                height: '40px',
                borderRadius: '0 14px 0 50%',
                background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentLight})`,
                opacity: 0.1,
              }}
            />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: theme.colors.accent, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {section.icon && <span style={{ fontSize: '18px' }}>{section.icon}</span>}
              {section.title}
            </h3>
            <p style={{ fontSize: '12px', color: theme.colors.textSecondary, lineHeight: 1.5, margin: 0 }}>
              {section.content}
            </p>
            {section.bullets && section.bullets.length > 0 && (
              <ul style={{ paddingLeft: '16px', margin: '4px 0 0', fontSize: '11px', color: theme.colors.textSecondary, lineHeight: 1.5 }}>
                {section.bullets.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      {content.callToAction && (
        <div
          style={{
            padding: `${spacing}px ${spacing * 1.5}px`,
            borderTop: `1px solid ${theme.colors.border}`,
            textAlign: 'center',
            background: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
            cursor: 'pointer',
          }}
          onClick={() => onElementClick?.('cta')}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '10px 32px',
              background: `linear-gradient(135deg, ${theme.colors.accent}, #8b5cf6)`,
              color: '#ffffff',
              borderRadius: '25px',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: `0 4px 15px ${theme.colors.shadow}`,
            }}
          >
            {content.callToAction}
          </span>
        </div>
      )}
    </div>
  );
};