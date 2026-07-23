'use client';

import React from 'react';
import { TemplateProps } from '@/lib/types';
import { getAlignmentStyle, getSpacingValue } from '@/services/template/templateEngine';

export const ModernTemplate: React.FC<TemplateProps> = ({
  content,
  theme,
  aspectRatio,
  settings,
  onElementClick,
}) => {
  const isWide = aspectRatio.width > aspectRatio.height;
  const spacing = getSpacingValue(settings.spacing);
  const align = getAlignmentStyle(settings.alignment);
  const isDark = theme.isDark;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.backgroundSecondary} 100%)`,
        padding: `${spacing * 2}px`,
        display: 'flex',
        flexDirection: 'column',
        gap: `${spacing}px`,
        position: 'relative',
        overflow: 'hidden',
      }}
      className="modern-template"
    >
      {/* Decorative Elements */}
      <div
        style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.colors.accent}33, ${theme.colors.accentLight}22)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.colors.accentLight}44, ${theme.colors.accent}22)`,
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{ cursor: 'pointer' }}
        onClick={() => onElementClick?.('title')}
      >
        <h1
          style={{
            fontSize: isWide ? '42px' : '36px',
            fontWeight: 800,
            color: theme.colors.accent,
            marginBottom: '8px',
            lineHeight: 1.1,
            ...align,
          }}
        >
          {content.title}
        </h1>
        {content.subtitle && (
          <p
            style={{
              fontSize: '18px',
              color: theme.colors.textSecondary,
              fontWeight: 400,
              lineHeight: 1.4,
              ...align,
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
            gap: `${spacing}px`,
            margin: `${spacing}px 0`,
          }}
        >
          {content.statistics.slice(0, 4).map((stat) => (
            <div
              key={stat.id}
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                borderRadius: '12px',
                padding: `${spacing}px`,
                textAlign: 'center',
                border: `1px solid ${theme.colors.border}`,
              }}
              onClick={() => onElementClick?.(`stat-${stat.id}`)}
            >
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: isWide ? '32px' : '28px',
                  fontWeight: 700,
                  color: theme.colors.accent,
                }}
              >
                {stat.prefix}{stat.value}{stat.suffix}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: theme.colors.textSecondary,
                  fontWeight: 500,
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
          gap: `${spacing}px`,
          flex: 1,
        }}
      >
        {content.sections.slice(0, 4).map((section) => (
          <div
            key={section.id}
            style={{
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
              borderRadius: '12px',
              padding: `${spacing}px`,
              border: `1px solid ${theme.colors.border}`,
            }}
            onClick={() => onElementClick?.(section.id)}
          >
            {section.title && (
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: theme.colors.accent,
                  marginBottom: '8px',
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
                  lineHeight: 1.5,
                  marginBottom: section.bullets?.length ? '8px' : 0,
                }}
              >
                {section.content}
              </p>
            )}
            {section.bullets && section.bullets.length > 0 && (
              <ul style={{ paddingLeft: '16px', margin: 0 }}>
                {section.bullets.map((bullet, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: '12px',
                      color: theme.colors.textSecondary,
                      marginBottom: '4px',
                      lineHeight: 1.4,
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

      {/* Timeline */}
      {content.timeline.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: `${spacing / 2}px`,
            padding: `${spacing}px 0`,
            borderTop: `1px solid ${theme.colors.border}`,
            overflow: 'hidden',
          }}
        >
          {content.timeline.slice(0, 4).map((event) => (
            <div
              key={event.id}
              style={{
                flex: 1,
                textAlign: 'center',
                position: 'relative',
              }}
              onClick={() => onElementClick?.(`timeline-${event.id}`)}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: theme.colors.accent,
                  margin: '0 auto 4px',
                }}
              />
              <div style={{ fontSize: '11px', fontWeight: 600, color: theme.colors.accent }}>
                {event.date}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: theme.colors.text }}>
                {event.title}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      {content.callToAction && (
        <div
          style={{
            textAlign: 'center',
            padding: `${spacing / 2}px`,
            cursor: 'pointer',
          }}
          onClick={() => onElementClick?.('cta')}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentLight})`,
              color: '#ffffff',
              borderRadius: '8px',
              fontSize: isWide ? '16px' : '14px',
              fontWeight: 600,
            }}
          >
            {content.callToAction}
          </span>
        </div>
      )}
    </div>
  );
};