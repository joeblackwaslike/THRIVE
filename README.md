# Thrive - Job Application Tracker 🎯

**Target, Hunt, Reach, Interview, Validate, Employ**

A comprehensive, accessible, and performant job application tracking system built with modern web technologies. Manage your entire job search journey from application to offer, with powerful analytics, interview preparation tools, and document management.

![Status](https://img.shields.io/badge/status-deployed-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)

🌐 **Live Demo**: [https://adriandarian.github.io/thrive/](https://adriandarian.github.io/thrive/)

## ✨ Features

### � Application Management
- **Multiple Views**: Switch between table and kanban board views
- **Status Tracking**: Track applications through 10 different statuses
- **Smart Filters**: Filter by status, company, date, and more
- **Quick Actions**: Add, edit, delete applications with ease
- **Notes & Tags**: Add detailed notes and tags to each application

### 💼 Interview Preparation
- **Question Bank**: 100+ common, technical, and behavioral questions
- **STAR Method**: Practice behavioral questions with STAR format
- **Interview Calendar**: Schedule and track upcoming interviews
- **Preparation Checklist**: Step-by-step interview preparation guide

### 🏢 Company Research
- **Company Profiles**: Store research notes, culture insights, benefits
- **Interview Process**: Document typical interview stages and tips
- **Recent News**: Track company announcements and updates
- **Rating System**: Rate companies based on your research

### 📄 Document Management
- **Multiple Formats**: Upload resumes, cover letters, portfolios
- **Version Control**: Track document versions over time
- **Link to Applications**: Associate documents with specific applications
- **Tagging System**: Organize documents with custom tags

### � Analytics & Insights
- **Application Funnel**: Visualize conversion rates at each stage
- **Success Metrics**: Track response rate, interview rate, offer rate
- **Timeline Charts**: See application volume over time
- **Company Comparison**: Compare response rates by company
- **Custom Filters**: Filter analytics by date range, status, company

### 🌙 UI & Accessibility
- **Dark Mode**: Beautiful light and dark themes
- **Fully Accessible**: WCAG 2.1 AA compliant
- **Keyboard Navigation**: Complete keyboard support
- **Screen Reader**: Optimized for screen readers
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Cross-Browser**: Tested on Chrome, Firefox, Safari, Edge

### 📤 Data Export
- **CSV Export**: For spreadsheet analysis
- **JSON Export**: Complete data backup
- **PDF Reports**: Formatted, printable reports
- **Flexible Selection**: Export all or specific data

## 🚀 Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Run linting
pnpm run lint

# Type checking
pnpm run type-check
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests with UI
pnpm run test:ui

# Run tests with coverage
pnpm run test:coverage

# Run integration tests only
pnpm run test:integration
```

See [TESTING.md](./TESTING.md) for detailed testing documentation.

### Deployment

```bash
# Deploy to GitHub Pages
pnpm run deploy

# Or push to main branch for automatic deployment via GitHub Actions
git push origin main
```

See the [Wiki](https://github.com/adriandarian/thrive/wiki) for detailed instructions.

## 📋 Project Status

**Status**: 🚀 Deployed to Production

All phases complete:
- ✅ Phase 0-12: Core features, advanced features, testing
- ✅ Phase 13: Polish, accessibility, documentation
- ✅ Phase 13.5: Production deployment with CI/CD

**Live Site**: [https://adriandarian.github.io/thrive/](https://adriandarian.github.io/thrive/)

## 📚 Documentation

📖 **[Full Documentation Site](https://adriandarian.github.io/thrive/docs/)** - Beautiful VitePress documentation with search, dark mode, and more!

### Quick Links

- 🚀 **[Quick Start](https://adriandarian.github.io/thrive/docs/getting-started/quick-start)** - Get up and running in 5 minutes
- 👥 **[User Guide](https://adriandarian.github.io/thrive/docs/user-guide/overview)** - Complete user manual
- 💻 **[Developer Guide](https://adriandarian.github.io/thrive/docs/developer-guide/overview)** - Technical documentation
- 📖 **[API Reference](https://adriandarian.github.io/thrive/docs/api-reference/complete-api)** - Complete API docs
- 🚀 **[Deployment](https://adriandarian.github.io/thrive/docs/deployment/github-pages)** - Deploy to production
- 🔧 **[Troubleshooting](https://adriandarian.github.io/thrive/docs/troubleshooting/common-issues)** - Common issues & fixes

> **Note**: Documentation is also available on the [GitHub Wiki](https://github.com/adriandarian/thrive/wiki)

## 🎯 Key Features Detail

### Application Tracking
Track your applications through these statuses:
- 📝 Wishlist - Jobs you're interested in
- 📤 Applied - Application submitted
- � Screening - Initial screening
- 📞 Phone Interview - Phone/video screen
- 💼 Interview - Technical/onsite interview
- 📋 Assessment - Take-home projects
- 🤝 Offer - Job offer received
- ✅ Accepted - Offer accepted
- ❌ Rejected - Application declined
- 🔄 Withdrawn - You withdrew

### Analytics Dashboard
- **Application Funnel**: Visual funnel chart showing conversion rates
- **Status Distribution**: Pie chart of applications by status
- **Applications Over Time**: Line chart showing application pace
- **Response Rates**: Bar chart comparing company response rates
- **Interview Success**: Track interview-to-offer conversion
- **Custom Date Ranges**: Filter by last 7/30/90 days or custom range

### Interview Preparation
- **100+ Questions**: Common, technical, and behavioral questions
- **STAR Framework**: Practice behavioral interview responses
- **Category Filters**: Filter by question type and difficulty
- **Answer Guidance**: Suggested approaches and key points
- **Interview Calendar**: Track scheduled interviews

### Document Management
- **Upload & Store**: Resumes, cover letters, portfolios, certificates
- **Version Tracking**: Maintain document version history
- **Link to Applications**: Associate documents with applications
- **Preview & Download**: View documents before downloading

## 🛠️ Tech Stack

### Core
- **React 19** with **TypeScript**
- **pnpm** - Package manager
- **Vite** - Build tool

### UI & Styling
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Re-usable component library
- **Radix UI** - Accessible primitives
- **Framer Motion** - Animations

### State & Data
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Server state
- **TanStack Form** - Form management
- **TanStack Table** - Headless tables
- **TanStack Virtual** - Virtual scrolling
- **Zustand** - Client state
- **Zod** - Schema validation

### Developer Tools
- **Biome** - Linter & formatter
- **Vitest** - Unit testing
- **Playwright** - E2E testing
- **Storybook** - Component docs
- **Husky** - Git hooks

## 📁 Project Structure

```
thrive/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # shadcn components
│   │   └── layout/      # Layout components
│   ├── features/        # Feature-based modules
│   │   ├── applications/
│   │   ├── documents/
│   │   └── dashboard/
│   ├── lib/             # Utilities and helpers
│   ├── hooks/           # Custom React hooks
│   ├── stores/          # Zustand stores
│   ├── types/           # TypeScript types
│   ├── routes/          # Route components
│   └── assets/          # Static assets
├── public/              # Public assets
└── tests/               # Test files
```

## 📝 Development Phases

1. ✅ **Phase 0**: Project Setup & Configuration
2. **Phase 1**: Core UI Foundation (Tailwind, shadcn)
3. **Phase 2**: Routing & Navigation
4. **Phase 3**: State Management & Data Layer
5. **Phase 4**: Applications Dashboard
6. **Phase 5**: Application Forms
7. **Phase 6**: Documents Management
8. **Phase 7**: Virtual Scrolling & Performance
9. **Phase 8**: Animations & UX Polish
10. **Phase 9**: Testing Setup
11. **Phase 10**: Storybook & Component Library
12. **Phase 11**: CI/CD & Quality Gates
13. **Phase 12**: Advanced Features

See [PROJECT_PLAN.md](./docs/PROJECT_PLAN.md) for detailed breakdown.

## 🤝 Contributing

This is a personal project, but suggestions and ideas are welcome!

## 📄 License

MIT
