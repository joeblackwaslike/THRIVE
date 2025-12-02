import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || 'test-service-role';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

// Simple console mock that doesn't interfere with test output
const originalConsole = { ...console };
global.console = {
  ...console,
  log: (...args: any[]) => originalConsole.log(...args),
  debug: (...args: any[]) => originalConsole.debug(...args),
  info: (...args: any[]) => originalConsole.info(...args),
  warn: (...args: any[]) => originalConsole.warn(...args),
  error: (...args: any[]) => originalConsole.error(...args),
};
