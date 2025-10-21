import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sidebar } from '@/components/layout/Sidebar';
import { ROUTES } from '@/config/routes';

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <Card>
            <CardContent className="p-12 text-center">
              <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                {title}
              </h1>
              <p className="mb-8 text-lg text-gray-600 dark:text-gray-400" data-testid="text-page-description">
                {description}
              </p>
              <Button
                onClick={() => setLocation(ROUTES.HOME)}
                data-testid="button-back-home"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
