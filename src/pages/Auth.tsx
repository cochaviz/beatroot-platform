import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  const [signInData, setSignInData] = useState({ email: '', password: '' });

  const { signIn, signInWithDiscord, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(signInData.email, signInData.password);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
    }

    setIsLoading(false);
  };

  const handleDiscordSignIn = async () => {
    setIsDiscordLoading(true);

    const { error } = await signInWithDiscord();

    if (error) {
      toast({
        title: 'Discord sign in failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsDiscordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <img
              src="/circle_and_hashtag.png"
              alt="Beatroot Academy Logo"
              className="h-16 w-16"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-white">beat</span><span className="text-primary">root</span>
          </h1>
          <p className="text-muted-foreground">Access your Beatroot Academy learning platform</p>
        </div>

        <Card className="card-cyber border-primary/20">
          <CardHeader>
            <CardTitle className="text-center text-foreground">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={signInData.email}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                  className="bg-card/50 border-border/50 focus:border-primary/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={signInData.password}
                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                  className="bg-card/50 border-border/50 focus:border-primary/50"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                variant="cyber-primary"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Sign In
              </Button>

              <div className="text-center">
                <Link
                  to="/password-recovery"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              variant="cyber-secondary"
              className="w-full"
              onClick={handleDiscordSignIn}
              disabled={isDiscordLoading}
            >
              {isDiscordLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Continue with Discord
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;