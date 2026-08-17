export const PURPOSE_IDS = [
  "social-media",
  "presentation",
  "report",
  "education",
  "marketing",
  "other",
] as const;

export type Purpose = (typeof PURPOSE_IDS)[number];

export interface PurposeOption {
  id: Purpose;
  label: string;
  icon: string;
  desc: string;
}

export const PURPOSES: PurposeOption[] = [
  { id: "social-media", label: "Social Media", icon: "📱", desc: "Instagram, LinkedIn, Facebook" },
  { id: "presentation", label: "Presentation", icon: "📊", desc: "Slides, decks, meetings" },
  { id: "report", label: "Report", icon: "📄", desc: "Business & research reports" },
  { id: "education", label: "Education", icon: "📚", desc: "Learning materials" },
  { id: "marketing", label: "Marketing", icon: "📢", desc: "Ads & campaigns" },
  { id: "other", label: "Other", icon: "✨", desc: "Custom purpose" },
];
