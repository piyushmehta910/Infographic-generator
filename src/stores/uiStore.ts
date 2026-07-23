import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { UIState, Toast } from '@/lib/types';

interface UIStore extends UIState {
  toggleSidebar: () => void;
  toggleTemplateGallery: () => void;
  togglePropertiesPanel: () => void;
  toggleExportPanel: () => void;
  toggleAIPromptPanel: () => void;
  setActiveTab: (tab: string) => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: () => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      sidebarOpen: true,
      templateGalleryOpen: false,
      propertiesPanelOpen: true,
      exportPanelOpen: false,
      aiPromptPanelOpen: false,
      activeTab: 'generate',
      toast: null,

      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      toggleTemplateGallery: () =>
        set((state) => ({
          templateGalleryOpen: !state.templateGalleryOpen,
        })),

      togglePropertiesPanel: () =>
        set((state) => ({
          propertiesPanelOpen: !state.propertiesPanelOpen,
        })),

      toggleExportPanel: () =>
        set((state) => ({ exportPanelOpen: !state.exportPanelOpen })),

      toggleAIPromptPanel: () =>
        set((state) => ({
          aiPromptPanelOpen: !state.aiPromptPanelOpen,
        })),

      setActiveTab: (tab) => set({ activeTab: tab }),

      showToast: (toastData) => {
        const id = crypto.randomUUID();
        set({ toast: { id, ...toastData } });
        const duration = toastData.duration || 4000;
        setTimeout(() => {
          set((state) => {
            if (state.toast?.id === id) return { toast: null };
            return state;
          });
        }, duration);
      },

      dismissToast: () => set({ toast: null }),
    }),
    { name: 'ui-store' }
  )
);