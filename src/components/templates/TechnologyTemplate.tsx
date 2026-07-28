"use client";

import React from "react";
import { TemplateProps } from "@/lib/types";
import { getSpacingValue } from "@/services/template/templateEngine";

export const TechnologyTemplate: React.FC<TemplateProps> = ({
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
        background: isDark ? "#0a0f1e" : "#f8fafc",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Inter', 'Poppins', system-ui, sans-serif",
      }}
    >
      {/* Header with tech-style gradient */}
      <div
        style={{
          padding: `${spacing * 2}px ${spacing * 2}px ${spacing * 1.2}px`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid background pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.05,
            backgroundImage: `
              linear-gradient(${theme.colors.accent} 1px, transparent 1px),
              linear-gradient(90deg, ${theme.colors.accent} 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />
        <h1
          style={{
            fontSize: aspectRatio.width > aspectRatio.height ? "34px" : "26px",
            fontWeight: 800,
            color: theme.colors.accent,
            margin: 0,
            lineHeight: 1.1,
            position: "relative",
            zIndex: 1,
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
              position: "relative",
              zIndex: 1,
            }}
          >
            {content.subtitle}
          </p>
        )}
      </div>

      {/* Tech Statistics */}
      {content.statistics.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "0",
            padding: `0 ${spacing * 1.5}px`,
            marginBottom: `${spacing}px`,
          }}
        >
          {content.statistics.slice(0, 4).map((stat, idx) => (
            <div
              key={stat.id}
              onClick={() => onElementClick?.(`stat-${stat.id}`)}
              style={{
                flex: 1,
                textAlign: "center",
                padding: `${spacing * 0.6}px`,
                borderRight:
                  idx < Math.min(content.statistics.length, 4) - 1
                    ? `1px solid ${theme.colors.border}`
                    : "none",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: theme.colors.accent,
                }}
              >
                {stat.prefix}
                {stat.value}
                {stat.suffix}
              </div>
              <div
                style={{ fontSize: "10px", color: theme.colors.textSecondary }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area - Code-like cards */}
      <div
        style={{
          flex: 1,
          padding: `0 ${spacing * 1.5}px ${spacing * 1.5}px`,
          display: "grid",
          gridTemplateColumns:
            aspectRatio.width > aspectRatio.height ? "1fr 1fr" : "1fr",
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
              borderRadius: "8px",
              padding: `${spacing}px`,
              border: `1px solid ${theme.colors.border}`,
              boxShadow: isDark ? "none" : `0 1px 3px ${theme.colors.shadow}`,
              position: "relative",
            }}
          >
            {/* Terminal dot indicator */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#ef4444",
                }}
              />
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#f59e0b",
                }}
              />
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10b981",
                }}
              />
            </div>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: theme.colors.accent,
                margin: "0 0 4px",
                fontFamily: "'Fira Code', 'Consolas', monospace",
              }}
            >
              {">"} {section.icon} {section.title}
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
              <div
                style={{
                  fontSize: "11px",
                  color: theme.colors.textSecondary,
                  marginTop: "4px",
                  lineHeight: 1.5,
                }}
              >
                {section.bullets.map((bullet, i) => (
                  <div key={i} style={{ paddingLeft: "12px" }}>
                    • {bullet}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      {content.callToAction && (
        <div
          style={{
            padding: `${spacing * 0.8}px ${spacing * 1.5}px`,
            borderTop: `1px solid ${theme.colors.border}`,
            textAlign: "center",
            cursor: "pointer",
          }}
          onClick={() => onElementClick?.("cta")}
        >
          <span
            style={{
              display: "inline-block",
              padding: "8px 24px",
              background: `linear-gradient(135deg, ${theme.colors.accent}, #8b5cf6)`,
              color: "#ffffff",
              borderRadius: "6px",
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
