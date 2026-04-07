import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useInspectionStore } from '@/store/inspectionStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000; // 1 minute lockout

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

function sanitizeAuthError(message: string): string {
  console.warn('[Auth] Raw error message:', message);
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid password') || lower.includes('invalid credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  if (lower.includes('email not confirmed') || lower.includes('not confirmed')) {
    return 'Please verify your email before signing in.';
  }
  if (lower.includes('already registered') || lower.includes('already been registered') || lower.includes('user already exists')) {
    return 'An account with this email may already exist. Try signing in instead.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  if (lower.includes('expired') || lower.includes('token')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (lower.includes('provider') || lower.includes('oauth')) {
    return 'Google sign-in failed. Please try again or use email/password.';
  }
  // Show a trimmed version of the real message for unknown errors
  return message.length > 0 && message.length < 120 ? message : 'Authentication failed. Please try again.';
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { error: authError, clearError } = useAuth();
  const resetStore = useInspectionStore((s) => s.resetStore);

  useEffect(() => {
    if (authError) {
      toast({
        title: 'Authentication Error',
        description: sanitizeAuthError(authError.message),
        variant: 'destructive',
        duration: 8000
      });
      // Clear error after showing so it doesn't persist across re-renders
      clearError();
    }
  }, [authError]);
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Rate limiting state
  const attemptCount = useRef(0);
  const lockoutUntil = useRef(0);

  const isLockedOut = () => Date.now() < lockoutUntil.current;

  const recordAttempt = () => {
    attemptCount.current += 1;
    if (attemptCount.current >= MAX_ATTEMPTS) {
      lockoutUntil.current = Date.now() + LOCKOUT_MS;
      attemptCount.current = 0;
    }
  };

  const resetAttempts = () => {
    attemptCount.current = 0;
  };

  const validatePassword = (pw: string): string | null => {
    if (pw.length < PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }
    if (!PASSWORD_REGEX.test(pw)) {
      return 'Password must include uppercase, lowercase, and a number.';
    }
    return null;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLockedOut()) {
      toast({ title: 'Too many attempts', description: 'Please wait a minute before trying again.', variant: 'destructive' });
      return;
    }

    // Validate password strength on sign-up
    if (isSignUp) {
      const pwError = validatePassword(password);
      if (pwError) {
        setPasswordError(pwError);
        return;
      }
      if (displayName.trim().length < 2) {
        toast({ title: 'Invalid Name', description: 'Please enter a display name (minimum 2 characters).', variant: 'destructive' });
        return;
      }
    }
    setPasswordError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: displayName.trim() }
          },
        });
        if (error) throw error;
        resetAttempts();
        if (data.session) {
          navigate('/');
        } else {
          toast({
            title: 'Check your email',
            description: 'We sent you a confirmation link. Please check your inbox and spam folder.',
            duration: 6000,
          });
        }
      } else {
        // Reset store (memory + localStorage) before switching accounts
        resetStore();
        await supabase.auth.signOut({ scope: 'local' });

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        resetAttempts();
        navigate('/');
      }
    } catch (err: unknown) {
      recordAttempt();
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      toast({ title: 'Error', description: sanitizeAuthError(message), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLockedOut()) {
      toast({ title: 'Too many attempts', description: 'Please wait a minute before trying again.', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      // Ensure clean state before Google redirect
      await supabase.auth.signOut({ scope: 'local' });
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          skipBrowserRedirect: false,
        },
      });
      
      if (error) {
        console.error('[Auth] Google Sign-In error:', error);
        recordAttempt();
        toast({ title: 'Error', description: sanitizeAuthError(error.message), variant: 'destructive' });
      }
    } catch (err) {
      console.error('[Auth] Unexpected error during Google Sign-In:', err);
      recordAttempt();
      toast({ title: 'Error', description: 'An unexpected error occurred during sign in.', variant: 'destructive' });
    } finally {
      // Note: Loading state usually persists until redirect happens
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight">Kuppam Tech</h1>
          <p className="text-muted-foreground mt-1">{isSignUp ? 'Create an account' : 'Sign in to continue'}</p>
        </div>

        {/* Google */}
        <Button
          variant="outline"
          className="w-full h-12 text-base font-semibold"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                required={isSignUp}
                minLength={2}
                className="h-12"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
              placeholder="••••••••"
              required
              minLength={PASSWORD_MIN_LENGTH}
              className="h-12"
            />
            {passwordError && (
              <p className="text-xs text-destructive">{passwordError}</p>
            )}
            {isSignUp && !passwordError && (
              <p className="text-xs text-muted-foreground">Min 8 chars, with uppercase, lowercase, and a number.</p>
            )}
          </div>
          <Button type="submit" className="w-full h-12 text-base font-bold" disabled={loading}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary font-semibold underline-offset-2 hover:underline"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  );
}
