export const CHANGELOG = [
  {
    version: '1.0.0',
    date: '2025-01-18',
    changes: [
      {
        type: 'feature' as const,
        description: 'Initial release of Thrive job application tracker',
      },
      {
        type: 'feature' as const,
        description: 'Complete application management with status tracking',
      },
      {
        type: 'feature' as const,
        description: 'Interview scheduling and management system',
      },
      {
        type: 'feature' as const,
        description: 'Document storage and organization',
      },
      {
        type: 'feature' as const,
        description: 'Analytics dashboard with visualizations',
      },
      {
        type: 'feature' as const,
        description: 'Kanban board for visual status management',
      },
      {
        type: 'feature' as const,
        description: 'CSV and JSON import/export functionality',
      },
      {
        type: 'feature' as const,
        description: 'Automatic backup system with scheduling',
      },
      {
        type: 'feature' as const,
        description: 'Comprehensive settings and customization options',
      },
      {
        type: 'feature' as const,
        description: 'Dark mode support with system theme detection',
      },
      {
        type: 'feature' as const,
        description: 'Multi-language support (EN, ES, FR, DE)',
      },
      {
        type: 'feature' as const,
        description: 'Smooth animations and transitions',
      },
      {
        type: 'feature' as const,
        description: 'Offline-first architecture with IndexedDB',
      },
    ],
  },
];

export const KEYBOARD_SHORTCUTS = [
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Quick search' },
      { keys: ['Alt', '1'], description: 'Go to Dashboard' },
      { keys: ['Alt', '2'], description: 'Go to Applications' },
      { keys: ['Alt', '3'], description: 'Go to Interviews' },
      { keys: ['Alt', '4'], description: 'Go to Documents' },
      { keys: ['Alt', '5'], description: 'Go to Analytics' },
      { keys: ['Alt', 'S'], description: 'Go to Settings' },
    ],
  },
  {
    category: 'Applications',
    shortcuts: [
      { keys: ['N'], description: 'New application' },
      { keys: ['E'], description: 'Edit selected' },
      { keys: ['Del'], description: 'Delete selected' },
      { keys: ['Ctrl', 'A'], description: 'Select all' },
      { keys: ['Escape'], description: 'Clear selection' },
      { keys: ['Ctrl', 'F'], description: 'Focus search' },
    ],
  },
  {
    category: 'Data Management',
    shortcuts: [
      { keys: ['Ctrl', 'I'], description: 'Import data' },
      { keys: ['Ctrl', 'E'], description: 'Export data' },
      { keys: ['Ctrl', 'B'], description: 'Create backup' },
      { keys: ['Ctrl', 'S'], description: 'Save (auto-save enabled)' },
    ],
  },
  {
    category: 'Views',
    shortcuts: [
      { keys: ['V', 'T'], description: 'Switch to table view' },
      { keys: ['V', 'K'], description: 'Switch to kanban view' },
      { keys: ['Ctrl', '+'], description: 'Zoom in' },
      { keys: ['Ctrl', '-'], description: 'Zoom out' },
      { keys: ['Ctrl', '0'], description: 'Reset zoom' },
    ],
  },
  {
    category: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Ctrl', ','], description: 'Open settings' },
      { keys: ['Ctrl', 'T'], description: 'Toggle theme' },
      { keys: ['Ctrl', 'R'], description: 'Refresh data' },
    ],
  },
];

export const HELP_RESOURCES = [
  {
    title: 'Getting Started',
    icon: 'BookOpen',
    description: 'Learn the basics of using Thrive to track your job applications',
    link: '#',
  },
  {
    title: 'User Guide',
    icon: 'Book',
    description: 'Comprehensive guide covering all features and functionality',
    link: '#',
  },
  {
    title: 'Video Tutorials',
    icon: 'Video',
    description: 'Watch step-by-step video tutorials',
    link: '#',
  },
  {
    title: 'FAQ',
    icon: 'HelpCircle',
    description: 'Frequently asked questions and answers',
    link: 'https://github.com/orgs/Prosperis/discussions/categories/q-a',
  },
  {
    title: 'Report a Bug',
    icon: 'Bug',
    description: 'Found an issue? Let us know',
    link: 'https://github.com/adriandarian/thrive/issues',
  },
  {
    title: 'Feature Requests',
    icon: 'Lightbulb',
    description: 'Suggest new features or improvements',
    link: 'https://github.com/adriandarian/thrive/discussions',
  },
];

export const CREDITS = [
  {
    category: 'Libraries & Frameworks',
    items: [
      {
        name: 'React',
        description: 'UI Framework',
        url: 'https://github.com/facebook/react',
        licenseUrl: 'https://github.com/facebook/react/blob/main/LICENSE',
      },
      {
        name: 'TypeScript',
        description: 'Type-safe JavaScript',
        url: 'https://github.com/microsoft/TypeScript',
        licenseUrl: 'https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt',
      },
      {
        name: 'Vite',
        description: 'Build tool',
        url: 'https://github.com/vitejs/vite',
        licenseUrl: 'https://github.com/vitejs/vite/blob/main/LICENSE',
      },
      {
        name: 'TanStack',
        description: 'High-quality open-source tools (Router, Table, Query)',
        url: 'https://tanstack.com',
        licenseUrl: 'https://github.com/TanStack/router/blob/main/LICENSE',
      },
      {
        name: 'Zustand',
        description: 'State management',
        url: 'https://github.com/pmndrs/zustand',
        licenseUrl: 'https://github.com/pmndrs/zustand/blob/main/LICENSE',
      },
      {
        name: 'Framer Motion',
        description: 'Animation library',
        url: 'https://github.com/framer/motion',
        licenseUrl: 'https://github.com/framer/motion/blob/main/LICENSE',
      },
      {
        name: 'Tailwind CSS',
        description: 'Utility-first CSS framework',
        url: 'https://github.com/tailwindlabs/tailwindcss',
        licenseUrl: 'https://github.com/tailwindlabs/tailwindcss/blob/master/LICENSE',
      },
      {
        name: 'Zod',
        description: 'TypeScript-first schema validation',
        url: 'https://github.com/colinhacks/zod',
        licenseUrl: 'https://github.com/colinhacks/zod/blob/master/LICENSE',
      },
      {
        name: 'React Hook Form',
        description: 'Performant form handling',
        url: 'https://github.com/react-hook-form/react-hook-form',
        licenseUrl: 'https://github.com/react-hook-form/react-hook-form/blob/master/LICENSE',
      },
    ],
  },
  {
    category: 'UI Components',
    items: [
      {
        name: 'Radix UI',
        description: 'Accessible components',
        url: 'https://github.com/radix-ui/primitives',
        licenseUrl: 'https://github.com/radix-ui/primitives/blob/main/LICENSE',
      },
      {
        name: 'Shadcn/ui',
        description: 'Component collection',
        url: 'https://github.com/shadcn-ui/ui',
        licenseUrl: 'https://github.com/shadcn-ui/ui/blob/main/LICENSE.md',
      },
      {
        name: 'Lucide Icons',
        description: 'Icon library',
        url: 'https://github.com/lucide-icons/lucide',
        licenseUrl: 'https://github.com/lucide-icons/lucide/blob/main/LICENSE',
      },
      {
        name: 'Sonner',
        description: 'Toast notifications',
        url: 'https://github.com/emilkowalski/sonner',
        licenseUrl: 'https://github.com/emilkowalski/sonner/blob/main/LICENSE',
      },
      {
        name: 'Recharts',
        description: 'Charting library',
        url: 'https://github.com/recharts/recharts',
        licenseUrl: 'https://github.com/recharts/recharts/blob/master/LICENSE',
      },
    ],
  },
  {
    category: 'Development Tools',
    items: [
      {
        name: 'Pnpm',
        description: 'JavaScript package manager',
        url: 'https://github.com/pnpm/pnpm',
        licenseUrl: 'https://github.com/pnpm/pnpm/blob/main/LICENSE',
      },
      {
        name: 'Biome',
        description: 'Linter and formatter',
        url: 'https://github.com/biomejs/biome',
        licenseUrl: 'https://github.com/biomejs/biome/blob/main/LICENSE-MIT',
      },
      {
        name: '@dnd-kit',
        description: 'Drag and drop',
        url: 'https://github.com/clauderic/dnd-kit',
        licenseUrl: 'https://github.com/clauderic/dnd-kit/blob/master/LICENSE',
      },
    ],
  },
  {
    category: 'Utilities',
    items: [
      {
        name: 'jsPDF',
        description: 'PDF document generation',
        url: 'https://github.com/parallax/jsPDF',
        licenseUrl: 'https://github.com/parallax/jsPDF/blob/master/LICENSE',
      },
      {
        name: 'date-fns',
        description: 'Modern date utility library',
        url: 'https://github.com/date-fns/date-fns',
        licenseUrl: 'https://github.com/date-fns/date-fns/blob/main/LICENSE.md',
      },
      {
        name: 'React Markdown',
        description: 'Markdown component for React',
        url: 'https://github.com/remarkjs/react-markdown',
        licenseUrl: 'https://github.com/remarkjs/react-markdown/blob/main/license',
      },
    ],
  },
];
