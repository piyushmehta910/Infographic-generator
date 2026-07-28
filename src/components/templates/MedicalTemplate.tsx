"use client";

import React from "react";
import { TemplateProps } from "@/lib/types";
import { getSpacingValue } from "@/services/template/templateEngine";

export const MedicalTemplate: React.FC<TemplateProps> = ({
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
        width: "100%",
        height: "100%",
        background: isDark ? "#0c1a1a" : "#f0fafc",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Inter', 'Roboto', system-ui, sans-serif",
      }}
    >
      {/* Header with medical cross accent */}
      <div
        style={{
          padding: `${spacing * 1.5}px ${spacing * 2}px ${spacing}px`,
          borderBottom: `4px solid ${theme.colors.accent}`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "20px",
            top: "10px",
            fontSize: "40px",
            opacity: 0.1,
            color: theme.colors.accent,
            lineHeight: 1,
          }}
        >
          +
        </div>
        <h1
          style={{
            fontSize: aspectRatio.width > aspectRatio.height ? "32px" : "24px",
            fontWeight: 800,
            color: theme.colors.text,
            margin: 0,
            lineHeight: 1.15,
          }}
          onClick={() => onElementClick?.("title")}
        >
          {content.title}
        </h1>
        {content.subtitle && (
          <p
            style={{
              fontSize: "14px",
              color: theme.colors.textSecondary,
              marginTop: "4px",
              fontWeight: 500,
            }}
          >
            {content.subtitle}
          </p>
        )}
      </div>

      {/* Medical Stats */}
      {content.statistics.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(content.statistics.length, 3)}, 1fr)`,
            gap: "10px",
            padding: `${spacing}px ${spacing * 2}px`,
          }}
        >
          {content.statistics.slice(0, 3).map((stat) => (
            <div
              key={stat.id}
              onClick={() => onElementClick?.(`stat-${stat.id}`)}
              style={{
                background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                borderRadius: "12px",
                padding: `${spacing * 0.8}px ${spacing}px`,
                textAlign: "center",
                border: `1px solid ${theme.colors.border}`,
                boxShadow: `0 2px 8px ${theme.colors.shadow}`,
              }}
            >
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 700,
                  color: theme.colors.accent,
                }}
              >
                {stat.prefix}
                {stat.value}
                {stat.suffix}
              </div>
              <div
                style={{
                  fontSize: "11px",
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

      {/* Info Sections */}
      <div
        style={{
          flex: 1,
          padding: `0 ${spacing * 2}px ${spacing * 1.5}px`,
          display: "flex",
          flexDirection: "column",
          gap: `${spacing}px`,
          overflow: "auto",
        }}
      >
        {content.sections.slice(0, 4).map((section, index) => (
          <div
            key={section.id}
            onClick={() => onElementClick?.(section.id)}
            style={{
              background: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
              borderRadius: "10px",
              padding: `${spacing}px ${spacing * 1.2}px`,
              border: `1px solid ${theme.colors.border}`,
              borderLeft: `4px solid ${index % 2 === 0 ? theme.colors.accent : theme.colors.accentLight}`,
            }}
          >
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: theme.colors.text,
                margin: "0 0 4px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {section.icon && <span>{section.icon}</span>}
              {section.title}
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: theme.colors.textSecondary,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {section.content}
            </p>
            {section.bullets && section.bullets.length > 0 && (
              <ul
                style={{
                  paddingLeft: "16px",
                  margin: "4px 0 0",
                  fontSize: "11px",
                  color: theme.colors.textSecondary,
                  lineHeight: 1.5,
                }}
              >
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
            padding: `${spacing}px ${spacing * 2}px`,
            borderTop: `1px solid ${theme.colors.border}`,
            textAlign: "center",
            background: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
            cursor: "pointer",
          }}
          onClick={() => onElementClick?.("cta")}
        >
          <span
            style={{
              display: "inline-block",
              padding: "10px 28px",
              background: theme.colors.accent,
              color: "#ffffff",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            {content.callToAction}
          </span>
        </div>
      )}
    </div>
  );
};
