import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail, Lock } from 'lucide-react';

const PasswordRecovery = () => {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { resetPassword, updatePassword, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if this is a password reset link (contains access_token or type=recovery)
    const type = searchParams.get('type');
    const accessToken = searchParams.get('access_token');
    
    if (type === 'recovery' || accessToken) {
      setStep('reset');
    }
  }, [searchParams]);

  useEffect(() => {
    // If user is already authenticated after password reset, redirect to dashboard
    if (user && step === 'reset') {
      toast({
        title: 'Password updated successfully',
        description: 'You have been logged in with your new password.',
      });
      navigate('/dashboard');
    }
  }, [user, step, navigate, toast]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      toast({
        title: 'Password reset failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password reset email sent',
        description: 'Check your email for a link to reset your password.',
      });
      setEmail(''); // Clear the form
    }

    setIsLoading(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both password fields are identical.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    const { error } = await updatePassword(password);

    if (error) {
      toast({
        title: 'Password update failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password updated successfully',
        description: 'Your password has been updated. You are now logged in.',
      });
      navigate('/dashboard');
    }

    setIsLoading(false);
  };

  const handleBackToLogin = () => {
    navigate('/auth');
  };

  if (step === 'request') {
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
            <p className="text-muted-foreground">Reset your password</p>
          </div>

          <Card className="card-cyber border-primary/20">
            <CardHeader>
              <CardTitle className="text-center text-foreground flex items-center justify-center gap-2">
                <Mail className="h-5 w-5" />
                Reset Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-card/50 border-border/50 focus:border-primary/50"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  variant="cyber-primary"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Send Reset Link
                </Button>
              </form>

              <Button
                variant="ghost"
                className="w-full"
                onClick={handleBackToLogin}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <p className="text-muted-foreground">Create your new password</p>
        </div>

        <Card className="card-cyber border-primary/20">
          <CardHeader>
            <CardTitle className="text-center text-foreground flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" />
              New Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-card/50 border-border/50 focus:border-primary/50"
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-card/50 border-border/50 focus:border-primary/50"
                  minLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters long.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                variant="cyber-primary"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Update Password
              </Button>
            </form>

            <Button
              variant="ghost"
              className="w-full"
              onClick={handleBackToLogin}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasswordRecovery;
