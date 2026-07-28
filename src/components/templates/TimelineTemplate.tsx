"use client";

import React from "react";
import { TemplateProps } from "@/lib/types";
import { getSpacingValue } from "@/services/template/templateEngine";

export const TimelineTemplate: React.FC<TemplateProps> = ({
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
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${spacing * 2}px ${spacing * 2}px ${spacing}px`,
          borderBottom: `3px solid ${theme.colors.accent}`,
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 800,
            color: theme.colors.accent,
            margin: 0,
            lineHeight: 1.1,
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
            }}
          >
            {content.subtitle}
          </p>
        )}
      </div>

      {/* Timeline */}
      <div
        style={{
          flex: 1,
          padding: `${spacing}px ${spacing * 2}px`,
          overflow: "auto",
          position: "relative",
        }}
      >
        {/* Vertical Line */}
        <div
          style={{
            position: "absolute",
            left: "40px",
            top: "0",
            bottom: "0",
            width: "3px",
            background: `linear-gradient(180deg, ${theme.colors.accent}, ${theme.colors.accentLight})`,
            borderRadius: "2px",
          }}
        />

        {content.timeline.length > 0
          ? content.timeline.map((event, index) => (
              <div
                key={event.id}
                style={{
                  display: "flex",
                  gap: `${spacing}px`,
                  marginBottom: `${spacing * 1.5}px`,
                  position: "relative",
                  paddingLeft: "60px",
                }}
                onClick={() => onElementClick?.(`timeline-${event.id}`)}
              >
                {/* Dot */}
                <div
                  style={{
                    position: "absolute",
                    left: "32px",
                    top: "4px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: theme.colors.accent,
                    border: `3px solid ${theme.colors.background}`,
                    boxShadow: `0 0 0 2px ${theme.colors.accent}`,
                    zIndex: 1,
                  }}
                />
                {/* Content */}
                <div
                  style={{
                    flex: 1,
                    background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                    borderRadius: "12px",
                    padding: `${spacing}px ${spacing * 1.5}px`,
                    border: `1px solid ${theme.colors.border}`,
                    borderLeft: `4px solid ${theme.colors.accent}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: theme.colors.accent,
                      marginBottom: "2px",
                    }}
                  >
                    {event.date}
                  </div>
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: theme.colors.text,
                      marginBottom: "4px",
                    }}
                  >
                    {event.icon} {event.title}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: theme.colors.textSecondary,
                      lineHeight: 1.5,
                    }}
                  >
                    {event.description}
                  </div>
                </div>
              </div>
            ))
          : content.sections.slice(0, 4).map((section, index) => (
              <div
                key={section.id}
                style={{
                  display: "flex",
                  gap: `${spacing}px`,
                  marginBottom: `${spacing * 1.5}px`,
                  position: "relative",
                  paddingLeft: "60px",
                }}
                onClick={() => onElementClick?.(section.id)}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "32px",
                    top: "4px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: theme.colors.accent,
                    border: `3px solid ${theme.colors.background}`,
                    boxShadow: `0 0 0 2px ${theme.colors.accent}`,
                    zIndex: 1,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    background: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                    borderRadius: "12px",
                    padding: `${spacing}px ${spacing * 1.5}px`,
                    border: `1px solid ${theme.colors.border}`,
                    borderLeft: `4px solid ${theme.colors.accent}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: theme.colors.accent,
                      marginBottom: "4px",
                    }}
                  >
                    Step {index + 1}: {section.title}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: theme.colors.textSecondary,
                      lineHeight: 1.5,
                    }}
                  >
                    {section.content}
                  </div>
                </div>
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
            background: theme.colors.backgroundSecondary,
          }}
          onClick={() => onElementClick?.("cta")}
        >
          <span
            style={{
              display: "inline-block",
              padding: "10px 28px",
              background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentLight})`,
              color: "#fff",
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
