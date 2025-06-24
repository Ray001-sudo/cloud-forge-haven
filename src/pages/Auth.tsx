
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Cloud, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const Auth = () => {
  const { signIn, signUp, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '', 
    username: '' 
  });
  const [resetEmail, setResetEmail] = useState('');

  // Validation states
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validateSignUp = () => {
    const newErrors: {[key: string]: string} = {};

    if (!signUpData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(signUpData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!signUpData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(signUpData.password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!signUpData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (signUpData.password !== signUpData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!signUpData.username) {
      newErrors.username = 'Username is required';
    } else if (signUpData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignIn = () => {
    const newErrors: {[key: string]: string} = {};

    if (!signInData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(signInData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!signInData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignIn()) return;

    setIsLoading(true);
    try {
      const { error } = await signIn(signInData.email, signInData.password);
      if (!error) {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignUp()) return;

    setIsLoading(true);
    try {
      const { error } = await signUp(signUpData.email, signUpData.password, signUpData.username);
      if (!error) {
        toast.success('Account created! Please check your email to verify your account.');
        setSignUpData({ email: '', password: '', confirmPassword: '', username: '' });
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setErrors({ email: 'Email is required' });
      return;
    }
    if (!validateEmail(resetEmail)) {
      setErrors({ email: 'Please enter a valid email' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resetPassword(resetEmail);
      if (!error) {
        setResetEmail('');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#38BDF8]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Cloud className="h-12 w-12 text-[#38BDF8]" />
          </div>
          <h1 className="text-3xl font-bold text-[#F8FAFC]">CloudForge</h1>
          <p className="text-slate-400 mt-2">Deploy, manage, and scale your applications</p>
        </div>

        <Card className="bg-[#1E293B] border-slate-700">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800">
              <TabsTrigger value="signin" className="data-[state=active]:bg-[#38BDF8] data-[state=active]:text-white">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-[#38BDF8] data-[state=active]:text-white">
                Sign Up
              </TabsTrigger>
              <TabsTrigger value="reset" className="data-[state=active]:bg-[#38BDF8] data-[state=active]:text-white">
                Reset
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">Sign in to your account</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-[#F8FAFC]">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInData.email}
                      onChange={(e) => {
                        setSignInData(prev => ({ ...prev, email: e.target.value }));
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      className="bg-slate-700 border-slate-600 text-[#F8FAFC] placeholder:text-slate-400 focus:border-[#38BDF8] focus:ring-[#38BDF8]"
                      disabled={isLoading}
                    />
                    {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-[#F8FAFC]">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={signInData.password}
                        onChange={(e) => {
                          setSignInData(prev => ({ ...prev, password: e.target.value }));
                          if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                        }}
                        className="bg-slate-700 border-slate-600 text-[#F8FAFC] placeholder:text-slate-400 focus:border-[#38BDF8] focus:ring-[#38BDF8] pr-10"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                    {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#38BDF8] hover:bg-[#0EA5E9] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="signup">
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">Create your account</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username" className="text-[#F8FAFC]">Username</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="Choose a username"
                      value={signUpData.username}
                      onChange={(e) => {
                        setSignUpData(prev => ({ ...prev, username: e.target.value }));
                        if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
                      }}
                      className="bg-slate-700 border-slate-600 text-[#F8FAFC] placeholder:text-slate-400 focus:border-[#38BDF8] focus:ring-[#38BDF8]"
                      disabled={isLoading}
                    />
                    {errors.username && <p className="text-red-400 text-sm">{errors.username}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-[#F8FAFC]">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpData.email}
                      onChange={(e) => {
                        setSignUpData(prev => ({ ...prev, email: e.target.value }));
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      className="bg-slate-700 border-slate-600 text-[#F8FAFC] placeholder:text-slate-400 focus:border-[#38BDF8] focus:ring-[#38BDF8]"
                      disabled={isLoading}
                    />
                    {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-[#F8FAFC]">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={signUpData.password}
                        onChange={(e) => {
                          setSignUpData(prev => ({ ...prev, password: e.target.value }));
                          if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                        }}
                        className="bg-slate-700 border-slate-600 text-[#F8FAFC] placeholder:text-slate-400 focus:border-[#38BDF8] focus:ring-[#38BDF8] pr-10"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                    {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-[#F8FAFC]">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={signUpData.confirmPassword}
                        onChange={(e) => {
                          setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }));
                          if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }}
                        className="bg-slate-700 border-slate-600 text-[#F8FAFC] placeholder:text-slate-400 focus:border-[#38BDF8] focus:ring-[#38BDF8] pr-10"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-400 text-sm">{errors.confirmPassword}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#38BDF8] hover:bg-[#0EA5E9] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="reset">
              <CardHeader>
                <CardTitle className="text-[#F8FAFC]">Reset your password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-[#F8FAFC]">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      className="bg-slate-700 border-slate-600 text-[#F8FAFC] placeholder:text-slate-400 focus:border-[#38BDF8] focus:ring-[#38BDF8]"
                      disabled={isLoading}
                    />
                    {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#38BDF8] hover:bg-[#0EA5E9] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending reset email...
                      </>
                    ) : (
                      'Send Reset Email'
                    )}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="text-center mt-6">
          <p className="text-slate-400 text-sm">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
