"use client";

import React from "react";
import { TemplateProps } from "@/lib/types";

export const CustomDesignTemplate: React.FC<TemplateProps> = ({
  content,
  aspectRatio,
  onElementClick,
}) => {
  const isWide = aspectRatio.width > aspectRatio.height;

  // Dynamic gradient based on content colors
  const primaryColor = content.colors?.[0] || "#6366f1";
  const secondaryColor = content.colors?.[1] || "#ec4899";
  const tertiaryColor = content.colors?.[2] || "#f59e0b";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, ${primaryColor}22, ${secondaryColor}11)`,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Hero section with large accent shape */}
      <div
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          padding: "32px 28px 24px",
          position: "relative",
          clipPath: isWide ? "none" : "ellipse(120% 85% at 50% 15%)",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-40px",
            left: "-30px",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontSize: "24px" }}>
              {content.icons?.[0] || "✨"}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "rgba(255,255,255,0.8)",
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              AI Generated Design
            </span>
          </div>
          <h1
            style={{
              fontSize: isWide ? "38px" : "32px",
              fontWeight: 800,
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.15,
              marginBottom: "8px",
              textShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
            onClick={() => onElementClick?.("title")}
          >
            {content.title}
          </h1>
          {content.subtitle && (
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.85)",
                margin: 0,
                lineHeight: 1.4,
                fontWeight: 400,
              }}
            >
              {content.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Stats with unique styling */}
      {content.statistics.length > 0 && (
        <div style={{ display: "flex", gap: "8px", padding: "16px 20px" }}>
          {content.statistics.slice(0, 3).map((stat, i) => (
            <div
              key={stat.id}
              style={{
                flex: 1,
                background: "#ffffff",
                borderRadius: "16px",
                padding: "12px 8px",
                textAlign: "center",
                boxShadow: `0 4px 15px ${primaryColor}15`,
                borderTop: `3px solid ${[primaryColor, secondaryColor, tertiaryColor][i]}`,
              }}
              onClick={() => onElementClick?.(`stat-${stat.id}`)}
            >
              <div style={{ fontSize: "18px", marginBottom: "2px" }}>
                {stat.icon}
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: [primaryColor, secondaryColor, tertiaryColor][i],
                  lineHeight: 1,
                }}
              >
                {stat.prefix}
                {stat.value}
                {stat.suffix}
              </div>
              <div
                style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500 }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content sections with unique card styling */}
      <div
        style={{
          flex: 1,
          padding: "0 20px 16px",
          display: "grid",
          gridTemplateColumns:
            isWide && content.sections.length > 1 ? "1fr 1fr" : "1fr",
          gap: "10px",
        }}
      >
        {content.sections.slice(0, 4).map((section, i) => (
          <div
            key={section.id}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "14px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              border: `1px solid ${primaryColor}15`,
              position: "relative",
              overflow: "hidden",
            }}
            onClick={() => onElementClick?.(section.id)}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "4px",
                height: "100%",
                background: `linear-gradient(${[primaryColor, secondaryColor, tertiaryColor][i % 3]}, ${[secondaryColor, tertiaryColor, primaryColor][i % 3]})`,
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
                paddingLeft: "4px",
              }}
            >
              <span style={{ fontSize: "18px" }}>{section.icon}</span>
              {section.title && (
                <h3
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#1f2937",
                    margin: 0,
                  }}
                >
                  {section.title}
                </h3>
              )}
            </div>
            {section.content && (
              <p
                style={{
                  fontSize: "11px",
                  color: "#4b5563",
                  margin: 0,
                  lineHeight: 1.6,
                  paddingLeft: "4px",
                }}
              >
                {section.content}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Unique gradient CTA */}
      {content.callToAction && (
        <div
          style={{
            padding: "10px 20px 16px",
            cursor: "pointer",
          }}
          onClick={() => onElementClick?.("cta")}
        >
          <div
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              borderRadius: "14px",
              padding: "12px 20px",
              textAlign: "center",
              boxShadow: `0 6px 20px ${primaryColor}30`,
            }}
          >
            <span
              style={{
                color: "#fff",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.3px",
              }}
            >
              {content.callToAction}
            </span>
          </div>
        </div>
      )}

      {/* Brand */}
      <div
        style={{
          position: "absolute",
          bottom: "6px",
          right: "12px",
          fontSize: "7px",
          color: "rgba(0,0,0,0.15)",
          letterSpacing: "1.5px",
          fontWeight: 600,
        }}
      >
        AI DESIGN
      </div>
    </div>
  );
};
