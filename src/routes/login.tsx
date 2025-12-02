import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';

export const Route = createFileRoute('/login')({
  component: LoginPage,
}) as any;

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/login' }) as { redirect?: string };
  const { login, register, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const redirectTo = search?.redirect || '/dashboard';

  const onSuccess = () => {
    navigate({ to: redirectTo });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-sm space-y-6 p-8 border rounded-lg shadow-lg bg-card">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to THRIVE</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in to continue</p>
        </div>
        <div className="space-y-4">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={loading}
            onClick={async () => {
              await login(email, password);
              onSuccess();
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={loading}
            onClick={async () => {
              await register(email, password);
              onSuccess();
            }}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </div>
      </div>
    </div>
  );
}
