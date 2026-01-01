import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Ship, ArrowLeft, Compass, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(2, 'Full name is required').max(100, 'Name is too long');

type ModuleType = 'boat' | 'activity';

// Sanitize string input
const sanitizeInput = (input: string): string => {
  return input.trim().slice(0, 100);
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedModules, setSelectedModules] = useState<ModuleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; modules?: string }>({});
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; name?: string; modules?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (!isLogin) {
      const nameResult = nameSchema.safeParse(fullName.trim());
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }

      if (selectedModules.length === 0) {
        newErrors.modules = 'Please select at least one business type';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleModuleToggle = (module: ModuleType) => {
    setSelectedModules(prev => 
      prev.includes(module) 
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
    setErrors(prev => ({ ...prev, modules: undefined }));
  };

  const createPartnerWithModules = async (userId: string, userEmail: string) => {
    const sanitizedName = sanitizeInput(fullName);
    const sanitizedCompany = sanitizeInput(companyName);
    const partnerName = sanitizedCompany || `${sanitizedName}'s Business`;

    const { data, error } = await supabase.rpc('create_partner_with_modules', {
      _user_id: userId,
      _partner_name: partnerName,
      _contact_name: sanitizedName,
      _contact_email: userEmail,
      _module_types: selectedModules,
    });

    if (error) throw error;
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Login failed',
            description: error.message === 'Invalid login credentials' 
              ? 'Invalid email or password. Please try again.'
              : error.message,
            variant: 'destructive',
          });
        } else {
          navigate('/select-module');
        }
      } else {
        const { error } = await signUp(email, password, sanitizeInput(fullName));
        if (error) {
          let message = error.message;
          if (error.message.includes('already registered')) {
            message = 'This email is already registered. Please sign in instead.';
          }
          toast({
            title: 'Sign up failed',
            description: message,
            variant: 'destructive',
          });
          return;
        }

        // Check if user is confirmed (depends on Supabase auth config)
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Email confirmation is likely required
          setShowEmailConfirmation(true);
          toast({
            title: 'Check your email!',
            description: 'Please confirm your email address to complete registration.',
          });
          return;
        }

        // User is confirmed, create partner + modules via RPC
        try {
          await createPartnerWithModules(user.id, email);
          toast({
            title: 'Account created!',
            description: 'Your partner account is pending approval. You will be notified once activated.',
          });
          navigate('/select-module');
        } catch (partnerError: any) {
          console.error('Error creating partner:', partnerError);
          toast({
            title: 'Setup incomplete',
            description: partnerError.message || 'There was an issue setting up your partner profile. Please contact support.',
            variant: 'destructive',
          });
          navigate('/select-module');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-ocean flex items-center justify-center">
              <Ship className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              Sri<span className="text-gradient-ocean">booking</span>
            </span>
          </div>

          {/* Email Confirmation Screen */}
          {showEmailConfirmation ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Check your email!
              </h1>
              <p className="text-muted-foreground mb-6">
                We've sent a confirmation link to <strong>{email}</strong>.<br />
                Click the link to complete your registration.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Once confirmed, your partner account will be created and pending admin approval.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailConfirmation(false);
                  setIsLogin(true);
                }}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground text-center mb-2">
                {isLogin ? 'Welcome back' : 'Partner Registration'}
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                {isLogin
                  ? 'Sign in to access your dashboard'
                  : 'Create your partner account to start selling'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setErrors(prev => ({ ...prev, name: undefined }));
                        }}
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name (optional)</Label>
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="Your company or business name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className={errors.password ? 'border-destructive' : ''}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                {/* Module Selection - Only for signup */}
                {!isLogin && (
                  <div className="space-y-3 pt-2">
                    <Label className="text-base font-semibold">Select your business type *</Label>
                    <p className="text-sm text-muted-foreground">Choose the services you provide. You can select both.</p>
                    
                    <div className="space-y-3">
                      {/* Boat Module */}
                      <div 
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedModules.includes('boat') 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-muted-foreground/50'
                        }`}
                        onClick={() => handleModuleToggle('boat')}
                      >
                        <Checkbox 
                          checked={selectedModules.includes('boat')}
                          onCheckedChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Ship className="w-5 h-5 text-primary" />
                            <span className="font-medium">Fastboat Provider</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Manage boat routes, schedules, and ticket sales
                          </p>
                        </div>
                      </div>

                      {/* Activity Module */}
                      <div 
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedModules.includes('activity') 
                            ? 'border-emerald-500 bg-emerald-500/5' 
                            : 'border-border hover:border-muted-foreground/50'
                        }`}
                        onClick={() => handleModuleToggle('activity')}
                      >
                        <Checkbox 
                          checked={selectedModules.includes('activity')}
                          onCheckedChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Compass className="w-5 h-5 text-emerald-500" />
                            <span className="font-medium">Activity Provider</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Manage tours, excursions, and experience bookings
                          </p>
                        </div>
                      </div>
                    </div>

                    {errors.modules && (
                      <p className="text-sm text-destructive">{errors.modules}</p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full mt-6"
                  disabled={loading}
                >
                  {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Partner Account'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                    setSelectedModules([]);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isLogin ? (
                    <>
                      Don't have an account?{' '}
                      <span className="text-primary font-medium">Register as Partner</span>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <span className="text-primary font-medium">Sign in</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
