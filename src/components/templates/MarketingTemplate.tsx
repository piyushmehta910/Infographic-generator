'use client';

import React from 'react';
import { TemplateProps } from '@/lib/types';
import { getSpacingValue } from '@/services/template/templateEngine';

export const MarketingTemplate: React.FC<TemplateProps> = ({
  content,
  aspectRatio,
  onElementClick,
}) => {
  const isWide = aspectRatio.width > aspectRatio.height;
  const spacing = getSpacingValue('comfortable');

  // Trendy gradient colors
  const bgGradient = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
  const accentColor = '#f59e0b';
  const textColor = '#ffffff';
  const textMuted = 'rgba(255,255,255,0.7)';
  const cardBg = 'rgba(255,255,255,0.08)';
  const cardBorder = 'rgba(255,255,255,0.1)';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: bgGradient,
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Poppins', 'Inter', sans-serif",
      }}
    >
      {/* Floating geometric decorations */}
      <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(236,72,153,0.1)', pointerEvents: 'none' }} />

      {/* Top section with title and CTA */}
      <div style={{ position: 'relative', zIndex: 1, flex: '0 0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '8px' }}>
              INFOGRAPHIC
            </div>
            <h1
              style={{
                fontSize: isWide ? '34px' : '28px',
                fontWeight: 800,
                color: textColor,
                margin: 0,
                lineHeight: 1.15,
                marginBottom: '6px',
              }}
              onClick={() => onElementClick?.('title')}
            >
              {content.title}
            </h1>
            {content.subtitle && (
              <p style={{ fontSize: '13px', color: textMuted, margin: 0, lineHeight: 1.4, fontWeight: 400 }}>
                {content.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats in a row */}
      {content.statistics.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 1 }}>
          {content.statistics.slice(0, 3).map((stat) => (
            <div
              key={stat.id}
              style={{
                flex: 1,
                background: 'rgba(245,158,11,0.15)',
                borderRadius: '16px',
                padding: '14px 10px',
                textAlign: 'center',
                border: '1px solid rgba(245,158,11,0.2)',
                backdropFilter: 'blur(10px)',
              }}
              onClick={() => onElementClick?.(`stat-${stat.id}`)}
            >
              <div style={{ fontSize: '20px', marginBottom: '2px' }}>{stat.icon}</div>
              <div style={{ fontSize: isWide ? '28px' : '24px', fontWeight: 800, color: accentColor, lineHeight: 1 }}>
                {stat.prefix}{stat.value}{stat.suffix}
              </div>
              <div style={{ fontSize: '10px', color: textMuted, fontWeight: 500, marginTop: '2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main content sections */}
      <div style={{ display: 'grid', gridTemplateColumns: isWide && content.sections.length > 1 ? '1fr 1fr' : '1fr', gap: '10px', flex: 1, position: 'relative', zIndex: 1 }}>
        {content.sections.slice(0, 4).map((section) => (
          <div
            key={section.id}
            style={{
              background: cardBg,
              borderRadius: '16px',
              padding: '14px',
              border: `1px solid ${cardBorder}`,
              backdropFilter: 'blur(10px)',
            }}
            onClick={() => onElementClick?.(section.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '18px' }}>{section.icon}</span>
              {section.title && (
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: textColor, margin: 0 }}>
                  {section.title}
                </h3>
              )}
            </div>
            {section.content && (
              <p style={{ fontSize: '11px', color: textMuted, margin: 0, lineHeight: 1.6 }}>
                {section.content}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Bottom CTA bar */}
      {content.callToAction && (
        <div
          style={{
            position: 'relative', zIndex: 1,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            borderRadius: '12px',
            padding: '10px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(245,158,11,0.4)',
          }}
          onClick={() => onElementClick?.('cta')}
        >
          <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px' }}>
            {content.callToAction}
          </span>
        </div>
      )}

      {/* Brand mark */}
      <div style={{ position: 'absolute', bottom: '8px', right: '16px', fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', fontWeight: 600 }}>
        INFOGRAPHIC AI
      </div>
    </div>
  );
};