"use client";

import React from "react";
import { TemplateProps } from "@/lib/types";
import {
  getSpacingValue,
  getAlignmentStyle,
} from "@/services/template/templateEngine";

export const ComparisonTemplate: React.FC<TemplateProps> = ({
  content,
  theme,
  aspectRatio,
  settings,
  onElementClick,
}) => {
  const spacing = getSpacingValue(settings.spacing);
  const align = getAlignmentStyle(settings.alignment);
  const isDark = theme.isDark;

  // Split sections into left and right for comparison
  const mid = Math.ceil(content.sections.length / 2);
  const leftSections = content.sections.slice(0, mid);
  const rightSections = content.sections.slice(mid, mid * 2);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: theme.colors.background,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${spacing * 2}px ${spacing * 2}px ${spacing}px`,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: aspectRatio.width > aspectRatio.height ? "36px" : "28px",
            fontWeight: 800,
            color: theme.colors.accent,
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
              marginTop: "6px",
            }}
          >
            {content.subtitle}
          </p>
        )}
      </div>

      {/* Comparison Columns */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: `${spacing}px`,
          padding: `0 ${spacing * 2}px ${spacing * 2}px`,
        }}
      >
        {/* Left Column */}
        <div
          style={{
            background: isDark ? "rgba(255,255,255,0.03)" : "#f0f7ff",
            borderRadius: "16px",
            padding: `${spacing * 1.5}px`,
            border: `2px solid ${theme.colors.accent}`,
            borderTop: `4px solid ${theme.colors.accent}`,
            display: "flex",
            flexDirection: "column",
            gap: `${spacing}px`,
          }}
        >
          {leftSections.length > 0 && (
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: theme.colors.accent,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {leftSections[0].title || "Option A"}
            </div>
          )}
          {leftSections.map((section) => (
            <div
              key={section.id}
              onClick={() => onElementClick?.(section.id)}
              style={{
                background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                borderRadius: "10px",
                padding: `${spacing}px`,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              {section.content && (
                <p
                  style={{
                    fontSize: "13px",
                    color: theme.colors.text,
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
                    margin: "6px 0 0",
                    fontSize: "12px",
                    color: theme.colors.textSecondary,
                    lineHeight: 1.6,
                  }}
                >
                  {section.bullets.map((bullet, i) => (
                    <li key={i} style={{ marginBottom: "2px" }}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div
          style={{
            background: isDark ? "rgba(255,255,255,0.03)" : "#faf5ff",
            borderRadius: "16px",
            padding: `${spacing * 1.5}px`,
            border: `2px solid ${theme.colors.accentLight}`,
            borderTop: `4px solid ${theme.colors.accentLight}`,
            display: "flex",
            flexDirection: "column",
            gap: `${spacing}px`,
          }}
        >
          {rightSections.length > 0 && (
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: theme.colors.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {rightSections[0].title || "Option B"}
            </div>
          )}
          {rightSections.map((section) => (
            <div
              key={section.id}
              onClick={() => onElementClick?.(section.id)}
              style={{
                background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                borderRadius: "10px",
                padding: `${spacing}px`,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              {section.content && (
                <p
                  style={{
                    fontSize: "13px",
                    color: theme.colors.text,
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
                    margin: "6px 0 0",
                    fontSize: "12px",
                    color: theme.colors.textSecondary,
                    lineHeight: 1.6,
                  }}
                >
                  {section.bullets.map((bullet, i) => (
                    <li key={i} style={{ marginBottom: "2px" }}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Statistics Row */}
      {content.statistics.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: `${spacing * 2}px`,
            padding: `${spacing}px ${spacing * 2}px`,
            borderTop: `1px solid ${theme.colors.border}`,
            background: theme.colors.backgroundSecondary,
          }}
        >
          {content.statistics.slice(0, 4).map((stat) => (
            <div
              key={stat.id}
              style={{ textAlign: "center" }}
              onClick={() => onElementClick?.(`stat-${stat.id}`)}
            >
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: theme.colors.accent,
                }}
              >
                {stat.prefix}
                {stat.value}
                {stat.suffix}
              </div>
              <div
                style={{ fontSize: "11px", color: theme.colors.textSecondary }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      {content.callToAction && (
        <div
          style={{
            textAlign: "center",
            padding: `${spacing}px`,
            cursor: "pointer",
          }}
          onClick={() => onElementClick?.("cta")}
        >
          <span
            style={{
              display: "inline-block",
              padding: "10px 32px",
              background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentLight})`,
              color: "#ffffff",
              borderRadius: "8px",
              fontSize: "14px",
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
