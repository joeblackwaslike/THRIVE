import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  commandMenuOpen: boolean;
  activeView: 'table' | 'kanban' | 'calendar';

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleCommandMenu: () => void;
  setCommandMenuOpen: (open: boolean) => void;
  setActiveView: (view: 'table' | 'kanban' | 'calendar') => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        mobileMenuOpen: false,
        commandMenuOpen: false,
        activeView: 'table',

        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
        setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

        toggleCommandMenu: () => set((state) => ({ commandMenuOpen: !state.commandMenuOpen })),
        setCommandMenuOpen: (open) => set({ commandMenuOpen: open }),

        setActiveView: (view) => set({ activeView: view }),
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          activeView: state.activeView,
        }),
      },
    ),
    { name: 'UIStore' },
  ),
);
