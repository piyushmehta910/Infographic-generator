'use client';

import React from 'react';
import { TemplateProps } from '@/lib/types';
import { getAlignmentStyle, getSpacingValue } from '@/services/template/templateEngine';

export const BusinessTemplate: React.FC<TemplateProps> = ({
  content,
  theme,
  aspectRatio,
  settings,
  onElementClick,
}) => {
  const isWide = aspectRatio.width > aspectRatio.height;
  const spacing = getSpacingValue(settings.spacing);
  const align = getAlignmentStyle(settings.alignment);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: theme.colors.background,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Corporate Header Bar */}
      <div
        style={{
          background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.accentLight})`,
          padding: `${spacing}px ${spacing * 2}px`,
          color: '#ffffff',
        }}
      >
        <h1
          style={{
            fontSize: isWide ? '38px' : '28px',
            fontWeight: 700,
            margin: 0,
            ...align,
          }}
          onClick={() => onElementClick?.('title')}
        >
          {content.title}
        </h1>
        {content.subtitle && (
          <p
            style={{
              fontSize: '16px',
              opacity: 0.9,
              marginTop: '4px',
              ...align,
            }}
          >
            {content.subtitle}
          </p>
        )}
      </div>

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          padding: `${spacing * 2}px`,
          display: 'flex',
          flexDirection: isWide ? 'row' : 'column',
          gap: `${spacing}px`,
        }}
      >
        {/* Left/Top - Key Stats */}
        <div style={{ flex: isWide ? 0.4 : 1 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: `${spacing}px`,
            }}
          >
            {content.statistics.slice(0, 4).map((stat) => (
              <div
                key={stat.id}
                style={{
                  background: theme.colors.backgroundSecondary,
                  borderRadius: '8px',
                  padding: `${spacing}px`,
                  border: `1px solid ${theme.colors.border}`,
                  borderLeft: `4px solid ${theme.colors.accent}`,
                }}
                onClick={() => onElementClick?.(`stat-${stat.id}`)}
              >
                <div style={{ fontSize: '24px', fontWeight: 700, color: theme.colors.accent }}>
                  {stat.prefix}{stat.value}{stat.suffix}
                </div>
                <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right/Bottom - Sections */}
        <div style={{ flex: 1 }}>
          {content.sections.slice(0, 3).map((section) => (
            <div
              key={section.id}
              style={{
                marginBottom: `${spacing}px`,
                paddingBottom: `${spacing}px`,
                borderBottom: `1px solid ${theme.colors.border}`,
              }}
              onClick={() => onElementClick?.(section.id)}
            >
              <h3
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: theme.colors.accent,
                  marginBottom: '4px',
                }}
              >
                {section.title}
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: theme.colors.textSecondary,
                  lineHeight: 1.5,
                }}
              >
                {section.content}
              </p>
              {section.bullets && section.bullets.length > 0 && (
                <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                  {section.bullets.slice(0, 3).map((bullet, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: '12px',
                        color: theme.colors.textSecondary,
                        marginBottom: '2px',
                      }}
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: `${spacing}px ${spacing * 2}px`,
          borderTop: `2px solid ${theme.colors.accent}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: theme.colors.backgroundSecondary,
        }}
      >
        {content.timeline.length > 0 && (
          <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>
            {content.timeline[0].date} - {content.timeline[content.timeline.length - 1].date}
          </div>
        )}
        {content.callToAction && (
          <div
            style={{
              padding: '8px 20px',
              background: theme.colors.accent,
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => onElementClick?.('cta')}
          >
            {content.callToAction}
          </div>
        )}
      </div>
    </div>
  );
};