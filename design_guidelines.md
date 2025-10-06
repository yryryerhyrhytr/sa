# Design Guidelines: Coaching Center Management System

## Design Approach: shadcn/ui Design System
This application follows the **shadcn/ui design system** (Radix UI + Tailwind CSS), optimized for educational management with a professional, utility-focused interface.

**Rationale**: Educational management platforms require clarity, efficiency, and data density. The shadcn/ui system provides accessible components perfect for dashboards, forms, and data tables essential for coaching operations.

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Background: 0 0% 100% (white)
- Foreground: 222 47% 11% (slate-900)
- Card: 0 0% 100%
- Primary: 221 83% 53% (education blue)
- Secondary: 210 40% 96% (slate-50)
- Accent: 210 40% 96%
- Border: 214 32% 91%
- Muted: 210 40% 96%

**Dark Mode:**
- Background: 222 47% 11% (slate-900)
- Foreground: 210 40% 98%
- Card: 217 33% 17% (slate-800)
- Primary: 217 91% 60%
- Secondary: 217 33% 17%
- Accent: 217 33% 17%
- Border: 217 33% 24%
- Muted: 217 33% 17%

**Semantic Colors:**
- Success: 142 76% 36% (green-600)
- Warning: 38 92% 50% (amber-500)
- Destructive: 0 84% 60% (red-500)
- Info: 199 89% 48% (blue-500)

### B. Typography

**Font Stack:**
- Primary: "Inter", system-ui, -apple-system, sans-serif
- Monospace: "JetBrains Mono", monospace (for data/codes)

**Type Scale:**
- Headings: font-semibold to font-bold
- H1: text-4xl (36px) - Dashboard titles
- H2: text-3xl (30px) - Section headers
- H3: text-2xl (24px) - Card headers
- H4: text-xl (20px) - Subsections
- Body: text-base (16px) - Default text
- Small: text-sm (14px) - Labels, captions
- Tiny: text-xs (12px) - Metadata

### C. Layout System

**Spacing Primitives:** Use Tailwind units 4, 6, 8, 12, 16, 24
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4
- Page margins: mx-4 md:mx-6 lg:mx-8

**Grid System:**
- Dashboard: 12-column responsive grid
- Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Forms: max-w-2xl single column
- Tables: full-width with horizontal scroll

**Container Widths:**
- Landing pages: max-w-7xl
- Dashboards: max-w-screen-2xl
- Forms: max-w-2xl
- Modals: max-w-lg to max-w-xl

### D. Component Library

**Dashboard Components:**
- Stats Cards: Rounded borders, shadow-sm, with icons (lucide-react)
- Data Tables: Striped rows, sortable headers, pagination
- Charts: Recharts with primary color scheme
- Action Buttons: Primary (solid), Secondary (outline), Ghost (text)

**Form Components:**
- Input fields: Radix UI with consistent border-radius-md
- Select dropdowns: Radix Select with search capability
- Date pickers: react-day-picker integration
- File uploads: Drag-and-drop zones with progress indicators

**Navigation:**
- Sidebar: Fixed left, collapsible on mobile
- Top bar: Fixed header with user menu, notifications
- Breadcrumbs: For deep navigation paths
- Tabs: For content switching within pages

**Feedback Components:**
- Toast notifications: Bottom-right placement
- Alert dialogs: Centered modals with backdrop blur
- Loading states: Skeleton screens, not spinners
- Empty states: Illustrations with helpful messages

### E. Animations
Minimal, purposeful animations using Framer Motion:
- Page transitions: Fade with subtle slide (duration: 200ms)
- Card hover: Slight lift (scale: 1.02, shadow increase)
- Button interactions: Built-in Radix/shadcn states
- Modal entry: Scale from 95% to 100% with fade

## Application-Specific Design

### Landing Page (Static/Marketing)
**Layout Structure:**
1. **Hero Section** (h-screen): 
   - Large heading with coaching center name
   - Teacher credentials and contact (01762602056)
   - Subject badges (Mathematics & Science)
   - Primary CTA: "Enroll Now" button
   - Background: Gradient from primary to primary-foreground with education-themed illustration/image

2. **Features Grid** (3 columns):
   - Student Management
   - Fee Collection
   - AI Question Generation
   - Each with icon, title, description

3. **About Section**:
   - Teacher profile with photo
   - Qualifications and experience
   - Teaching philosophy

4. **Contact Section** (2 columns):
   - Contact form (left)
   - Location map + contact details (right)

**Visual Treatment:**
- Use education-themed imagery (students, books, learning)
- Professional photography or illustrations
- Moderate use of primary color for CTAs and accents
- Clean, trustworthy aesthetic

### Teacher Dashboard
**Layout:**
- Left sidebar navigation (Students, Batches, Fees, Reports, Settings)
- Main content area with page header and breadcrumbs
- Grid of stat cards at top (Total Students, Active Batches, Pending Fees, etc.)
- Data tables below with filtering and search

**Key Screens:**
1. **Student Management**: Table with columns (Roll, Name, Batch, Fees Status, Actions)
2. **Batch Management**: Calendar view + list view toggle
3. **Fee Collection**: Transaction history table with export
4. **AI Question Generator**: Form interface with subject/topic selection
5. **Reports**: Charts showing attendance, performance trends

### Design Patterns
- **Consistent card styling**: All cards use border, rounded-lg, shadow-sm
- **Action patterns**: Dropdown menus for bulk actions, inline edit buttons
- **Status indicators**: Badge components with color coding
- **Form validation**: Inline error messages below inputs
- **Responsive tables**: Collapse to cards on mobile viewports

### Images
**Required Images:**
1. **Hero Section**: Wide landscape image (1920x800px) showing students learning or classroom environment - should convey trust and professionalism
2. **Teacher Profile**: Professional headshot (400x400px) of Golam Sarowar Sir
3. **Feature Icons**: Use lucide-react icon library throughout
4. **Empty States**: Custom illustrations for "no students," "no batches" states

**Image Treatment:**
- Hero images: Subtle overlay (opacity-20 to opacity-40) for text readability
- Profile images: Circular crop with border
- Feature sections: Use icons instead of images for performance
- Background patterns: Subtle dot grid or gradient meshes where appropriate