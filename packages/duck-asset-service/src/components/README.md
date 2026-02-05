# Duck Engine Web Core - Component Library

This UI follows **Atomic Design** principles with **Neobrutalism** styling using Tailwind CSS.

## Structure

```
src/components/
├── atoms/          # Basic building blocks
├── molecules/      # Simple combinations of atoms
├── organisms/      # Complex UI components
└── index.ts        # Centralized exports
```

## Atomic Design Layers

### Atoms (Basic UI Elements)
- **Button**: Primary/secondary/destructive variants with neobrutalism shadow effects
- **Badge**: Status indicators (draft, published, deprecated)
- **Input**: Form input with border and shadow styling
- **Select**: Dropdown selector
- **Label**: Form labels
- **Tag**: Small tags for metadata

### Molecules (Simple Component Groups)
- **Card**: Content container with header, title, and content sections
- **StatCard**: Dashboard statistic display
- **FormGroup**: Label + Input/Select combination
- **FilterBar**: Search and filter controls for asset lists

### Organisms (Complex Sections)
- **Sidebar**: Navigation sidebar with menu items
- **Table**: Data table with header/body/rows/cells
- **AdminLayout**: Full page layout with sidebar and main content
- **PageHeader**: Page title with optional actions

## Neobrutalism Design System

### Colors
- **main**: `#88aaee` - Primary brand color
- **mainAccent**: `#4d80e6` - Darker accent
- **bg**: `#dfe5f2` - Background
- **border**: `#000` - Black borders (characteristic of neobrutalism)
- **darkBg**: `#1a1a1a` - Dark backgrounds
- **text**: `#000` - Text color

### Shadows
- **base**: `4px 4px 0px 0px rgba(0,0,0,1)` - Standard shadow
- **base-hover**: `6px 6px 0px 0px rgba(0,0,0,1)` - Hover shadow

### Key Features
- **Bold 2px borders** on all interactive elements
- **Hard box shadows** for depth (no blur)
- **Button hover effects** with shadow translation
- **Rounded corners** using `border-radius: 5px`

## Usage Examples

### Import Components
```tsx
import { Button, Badge, Input } from '@/components/atoms';
import { Card, StatCard, FilterBar } from '@/components/molecules';
import { Table, PageHeader, AdminLayout } from '@/components/organisms';
```

### Button Variants
```tsx
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small Button</Button>
```

### Card with Content
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

### Table Structure
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column 1</TableHead>
      <TableHead>Column 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data 1</TableCell>
      <TableCell>Data 2</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

## Utility Functions

### `cn()` - Class Name Utility
Combines `clsx` and `tailwind-merge` for conditional Tailwind classes:

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  condition && 'conditional-class',
  className // from props
)} />
```

## Customization

All components use the `cn()` utility, allowing className overrides:

```tsx
<Button className="w-full">Full Width Button</Button>
<Card className="bg-red-100 border-red-800">Error Card</Card>
```

## Tailwind Configuration

See `tailwind.config.js` for theme customization including:
- Custom colors
- Shadow definitions
- Border radius
- Font weights

## References

- [Neobrutalism.dev](https://www.neobrutalism.dev/) - Design system inspiration
- [Shadcn/ui](https://ui.shadcn.com/) - Component architecture basis
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
