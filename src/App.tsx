import { useState } from 'react';
import { MainLayout, PageHeader } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SentryErrorBoundary } from '@/components/error-handling/SentryErrorBoundary';

function App() {
  const [count, setCount] = useState(0);

  return (
    <SentryErrorBoundary>
      <MainLayout>
        <PageHeader
          title="Welcome to THRIVE! 🎯"
          description="Target, Hunt, Reach, Interview, Validate, Employ"
        />

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <CardTitle>Phase 1 Complete! �</CardTitle>
              <CardDescription>
                Your job application tracking system with shadcn/ui components and dark mode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Phase 1 is now complete! We have Tailwind CSS v4, shadcn/ui components, layout
                system, and dark mode fully working.
              </p>

              {/* Counter Demo */}
              <div className="flex items-center gap-3">
                <Button onClick={() => setCount((count) => count + 1)}>Count: {count}</Button>
                <Button variant="secondary" onClick={() => setCount(0)}>
                  Reset
                </Button>
                <Button variant="outline" size="sm">
                  Small
                </Button>
                <Button variant="ghost" size="icon">
                  ⚙️
                </Button>
              </div>

              <Separator />

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Phase 0: Complete</Badge>
                <Badge variant="default">Phase 1: Complete</Badge>
                <Badge variant="secondary">Next: Phase 2</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Component Showcase */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">✅ Tailwind CSS v4</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Modern utility-first CSS framework with Lightning CSS
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🎨 shadcn/ui</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  13 components installed and ready to use
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">♿ Radix UI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Accessible primitives for building high-quality UIs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🌙 Dark Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Toggle dark mode with the button in the top-right corner!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Installed Components List */}
          <Card>
            <CardHeader>
              <CardTitle>Installed Components</CardTitle>
              <CardDescription>13 shadcn/ui components ready to use</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  'Button',
                  'Card',
                  'Badge',
                  'Input',
                  'Label',
                  'Select',
                  'Dropdown Menu',
                  'Dialog',
                  'Sheet',
                  'Table',
                  'Separator',
                  'Avatar',
                  'Tooltip',
                ].map((component) => (
                  <Badge key={component} variant="secondary">
                    {component}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </SentryErrorBoundary>
  );
}

export default App;
