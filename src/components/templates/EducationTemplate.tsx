"use client";

import React from "react";
import { TemplateProps } from "@/lib/types";
import { getSpacingValue } from "@/services/template/templateEngine";

export const EducationTemplate: React.FC<TemplateProps> = ({
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
        background: theme.colors.background,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Nunito', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header with colored background */}
      <div
        style={{
          background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentLight})`,
          padding: `${spacing * 2}px ${spacing * 2}px ${spacing * 1.5}px`,
          color: "#ffffff",
        }}
      >
        <h1
          style={{
            fontSize: aspectRatio.width > aspectRatio.height ? "34px" : "26px",
            fontWeight: 800,
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
              fontSize: "15px",
              opacity: 0.9,
              marginTop: "6px",
              fontWeight: 500,
            }}
          >
            {content.subtitle}
          </p>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: `${spacing * 1.5}px ${spacing * 2}px`,
          display: "flex",
          flexDirection: "column",
          gap: `${spacing}px`,
          overflow: "auto",
        }}
      >
        {/* Key Facts / Statistics */}
        {content.statistics.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: `${spacing}px`,
              flexWrap: "wrap",
            }}
          >
            {content.statistics.slice(0, 3).map((stat) => (
              <div
                key={stat.id}
                style={{
                  flex: 1,
                  minWidth: "80px",
                  background: isDark ? "rgba(255,255,255,0.05)" : "#e8f5e9",
                  borderRadius: "12px",
                  padding: `${spacing}px`,
                  textAlign: "center",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#c8e6c9"}`,
                }}
                onClick={() => onElementClick?.(`stat-${stat.id}`)}
              >
                <div
                  style={{
                    fontSize: "24px",
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
                    marginTop: "2px",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Learning Sections */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              aspectRatio.width > aspectRatio.height ? "1fr 1fr" : "1fr",
            gap: `${spacing}px`,
          }}
        >
          {content.sections.slice(0, 4).map((section, index) => (
            <div
              key={section.id}
              onClick={() => onElementClick?.(section.id)}
              style={{
                background: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                borderRadius: "12px",
                padding: `${spacing * 1.2}px`,
                border: `1px solid ${theme.colors.border}`,
                borderLeft: `4px solid ${theme.colors.accent}`,
                boxShadow: `0 2px 4px ${theme.colors.shadow}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: theme.colors.accent,
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </span>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: theme.colors.text,
                    margin: 0,
                  }}
                >
                  {section.icon} {section.title}
                </h3>
              </div>
              {section.content && (
                <p
                  style={{
                    fontSize: "12px",
                    color: theme.colors.textSecondary,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {section.content}
                </p>
              )}
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
      </div>

      {/* CTA */}
      {content.callToAction && (
        <div
          style={{
            textAlign: "center",
            padding: `${spacing}px ${spacing * 2}px`,
            borderTop: `1px solid ${theme.colors.border}`,
            background: theme.colors.backgroundSecondary,
            cursor: "pointer",
          }}
          onClick={() => onElementClick?.("cta")}
        >
          <span
            style={{
              display: "inline-block",
              padding: "8px 24px",
              background: theme.colors.accent,
              color: "#ffffff",
              borderRadius: "20px",
              fontSize: "13px",
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
