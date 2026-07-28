'use client';

import React from 'react';
import { TemplateProps } from '@/lib/types';

export const BlankTemplate: React.FC<TemplateProps> = ({
  content,
  theme,
  aspectRatio,
  settings,
  onElementClick,
}) => {
  const isWide = aspectRatio.width > aspectRatio.height;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: theme.colors.background,
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ cursor: 'pointer' }} onClick={() => onElementClick?.('title')}>
        <h1
          style={{
            fontSize: isWide ? '36px' : '30px',
            fontWeight: 800,
            color: theme.colors.text,
            margin: 0,
            marginBottom: '6px',
            lineHeight: 1.15,
          }}
        >
          {content.title}
        </h1>
        {content.subtitle && (
          <p
            style={{
              fontSize: '16px',
              color: theme.colors.textSecondary,
              fontWeight: 500,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {content.subtitle}
          </p>
        )}
      </div>

      {/* Statistics Row */}
      {content.statistics.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(content.statistics.length, 4)}, 1fr)`,
            gap: '12px',
          }}
        >
          {content.statistics.slice(0, 4).map((stat) => (
            <div
              key={stat.id}
              style={{
                background: theme.colors.backgroundSecondary,
                borderRadius: '12px',
                padding: '14px 12px',
                textAlign: 'center',
                border: `1px solid ${theme.colors.border}`,
              }}
              onClick={() => onElementClick?.(`stat-${stat.id}`)}
            >
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: isWide ? '30px' : '26px',
                  fontWeight: 700,
                  color: theme.colors.accent,
                  lineHeight: 1.1,
                }}
              >
                {stat.prefix}{stat.value}{stat.suffix}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: theme.colors.textSecondary,
                  fontWeight: 500,
                  marginTop: '2px',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isWide && content.sections.length > 1 ? '1fr 1fr' : '1fr',
          gap: '12px',
          flex: 1,
        }}
      >
        {content.sections.slice(0, 4).map((section) => (
          <div
            key={section.id}
            style={{
              background: theme.colors.cardBackground,
              borderRadius: '12px',
              padding: '16px',
              border: `1px solid ${theme.colors.border}`,
            }}
            onClick={() => onElementClick?.(section.id)}
          >
            {section.title && (
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: theme.colors.accent,
                  margin: 0,
                  marginBottom: '6px',
                }}
              >
                {section.icon} {section.title}
              </h3>
            )}
            {section.content && (
              <p
                style={{
                  fontSize: '13px',
                  color: theme.colors.text,
                  lineHeight: 1.6,
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                {section.content}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      {content.callToAction && (
        <div
          style={{
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onClick={() => onElementClick?.('cta')}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '10px 28px',
              background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentLight})`,
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              boxShadow: `0 2px 8px ${theme.colors.shadow}`,
            }}
          >
            {content.callToAction}
          </span>
        </div>
      )}
    </div>
  );
};

export default BlankTemplate;