import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  TemplateConfig,
  TemplateCategory,
  AspectRatioId,
  ThemeId,
  FontId,
} from '@/lib/types';

interface TemplateStore {
  // State
  templates: TemplateConfig[];
  selectedTemplate: TemplateConfig | null;
  selectedCategory: string;
  selectedAspectRatio: AspectRatioId;
  selectedTheme: ThemeId;
  selectedFont: FontId;
  isLoading: boolean;

  // Actions
  setTemplates: (templates: TemplateConfig[]) => void;
  selectTemplate: (template: TemplateConfig | null) => void;
  setCategory: (category: string) => void;
  setAspectRatio: (ratio: AspectRatioId) => void;
  setTheme: (theme: ThemeId) => void;
  setFont: (font: FontId) => void;
  setLoading: (loading: boolean) => void;
  getFilteredTemplates: () => TemplateConfig[];
}

export const useTemplateStore = create<TemplateStore>()(
  devtools(
    (set, get) => ({
      templates: [],
      selectedTemplate: null,
      selectedCategory: 'all',
      selectedAspectRatio: '1:1',
      selectedTheme: 'light',
      selectedFont: 'inter',
      isLoading: false,

      setTemplates: (templates) => set({ templates }),

      selectTemplate: (template) => set({ selectedTemplate: template }),

      setCategory: (category) => set({ selectedCategory: category }),

      setAspectRatio: (ratio) => set({ selectedAspectRatio: ratio }),

      setTheme: (theme) => set({ selectedTheme: theme }),

      setFont: (font) => set({ selectedFont: font }),

      setLoading: (loading) => set({ isLoading: loading }),

      getFilteredTemplates: () => {
        const { templates, selectedCategory } = get();
        if (selectedCategory === 'all') return templates;
        return templates.filter(
          (t) => t.category === selectedCategory
        );
      },
    }),
    { name: 'template-store' }
  )
);