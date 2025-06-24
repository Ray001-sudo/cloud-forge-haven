
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Check, 
  Crown, 
  Zap, 
  Star,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface BillingRecord {
  id: string;
  plan: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  processed_at: string | null;
}

interface PlanFeatures {
  projects: number;
  storage: string;
  bandwidth: string;
  terminal: boolean;
  webhooks: boolean;
  cron: boolean;
  analytics: boolean;
  support: string;
}

const plans = {
  free: {
    name: 'Free',
    price: 0,
    icon: <Star className="h-6 w-6" />,
    color: 'text-gray-400',
    features: {
      projects: 1,
      storage: '256MB',
      bandwidth: '1GB',
      terminal: false,
      webhooks: false,
      cron: false,
      analytics: false,
      support: 'Community'
    }
  },
  pro: {
    name: 'Pro',
    price: 15,
    icon: <Zap className="h-6 w-6" />,
    color: 'text-blue-400',
    features: {
      projects: 10,
      storage: '1GB',
      bandwidth: '10GB',
      terminal: true,
      webhooks: true,
      cron: true,
      analytics: false,
      support: 'Email'
    }
  },
  elite: {
    name: 'Elite',
    price: 50,
    icon: <Crown className="h-6 w-6" />,
    color: 'text-yellow-400',
    features: {
      projects: 50,
      storage: '4GB',
      bandwidth: '50GB',
      terminal: true,
      webhooks: true,
      cron: true,
      analytics: true,
      support: 'Priority'
    }
  }
};

const Billing = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadBillingData();
      loadProjectCount();
    }
  }, [user]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBillingHistory(data || []);
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast.error('Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  const loadProjectCount = async () => {
    try {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      if (error) throw error;
      setProjectCount(count || 0);
    } catch (error) {
      console.error('Error loading project count:', error);
    }
  };

  const handleUpgrade = async (planName: string, paymentMethod: 'stripe' | 'paypal' | 'mpesa') => {
    const plan = plans[planName as keyof typeof plans];
    if (!plan) return;

    try {
      setUpgrading(planName);

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create billing record
      const { error: billingError } = await supabase
        .from('billing_history')
        .insert({
          user_id: user?.id,
          plan: planName,
          amount: plan.price,
          currency: 'USD',
          payment_method: paymentMethod,
          payment_status: 'completed',
          processed_at: new Date().toISOString()
        });

      if (billingError) throw billingError;

      // Update user subscription tier
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ subscription_tier: planName })
        .eq('user_id', user?.id);

      if (profileError) throw profileError;

      toast.success(`Successfully upgraded to ${plan.name} plan!`);
      await refreshProfile();
      loadBillingData();
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast.error('Failed to upgrade plan. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  const simulateStripePayment = (planName: string) => {
    toast.info('Redirecting to Stripe...');
    setTimeout(() => {
      handleUpgrade(planName, 'stripe');
    }, 1000);
  };

  const simulatePayPalPayment = (planName: string) => {
    toast.info('Redirecting to PayPal...');
    setTimeout(() => {
      handleUpgrade(planName, 'paypal');
    }, 1000);
  };

  const simulateMpesaPayment = (planName: string) => {
    const phoneNumber = prompt('Enter your M-PESA phone number:');
    if (phoneNumber) {
      toast.info('M-PESA STK push sent to your phone...');
      setTimeout(() => {
        handleUpgrade(planName, 'mpesa');
      }, 3000);
    }
  };

  const currentPlan = plans[profile?.subscription_tier as keyof typeof plans] || plans.free;
  const currentPlanKey = profile?.subscription_tier || 'free';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'pending': return 'bg-yellow-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#38BDF8]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Billing & Plans</h1>
          <p className="text-slate-400 mt-1">Manage your subscription and billing information</p>
        </div>

        {/* Current Plan Status */}
        <Card className="bg-[#1E293B] border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={currentPlan.color}>
                  {currentPlan.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{currentPlan.name}</h3>
                  <p className="text-slate-400">
                    ${currentPlan.price}/month {currentPlan.price === 0 && '(Free forever)'}
                  </p>
                </div>
              </div>
              {currentPlanKey !== 'elite' && (
                <Badge className="bg-green-600 text-white">
                  Upgrade Available
                </Badge>
              )}
            </div>

            {/* Usage Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Projects</div>
                <div className="text-white text-lg font-semibold">
                  {projectCount} / {currentPlan.features.projects}
                </div>
                <Progress 
                  value={(projectCount / currentPlan.features.projects) * 100} 
                  className="mt-2 h-2"
                />
              </div>
              
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Storage</div>
                <div className="text-white text-lg font-semibold">{currentPlan.features.storage}</div>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Bandwidth</div>
                <div className="text-white text-lg font-semibold">{currentPlan.features.bandwidth}</div>
              </div>
              
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Support</div>
                <div className="text-white text-lg font-semibold">{currentPlan.features.support}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800">
            <TabsTrigger value="plans" className="data-[state=active]:bg-[#38BDF8] data-[state=active]:text-white">
              Available Plans
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-[#38BDF8] data-[state=active]:text-white">
              Billing History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(plans).map(([key, plan]) => (
                <Card 
                  key={key} 
                  className={`bg-[#1E293B] border-slate-700 relative ${
                    currentPlanKey === key ? 'ring-2 ring-[#38BDF8]' : ''
                  }`}
                >
                  {currentPlanKey === key && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-[#38BDF8]">
                      Current Plan
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className={`mx-auto mb-2 ${plan.color}`}>
                      {plan.icon}
                    </div>
                    <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold text-white">
                      ${plan.price}
                      <span className="text-lg font-normal text-slate-400">/month</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Projects</span>
                        <span className="text-white font-semibold">{plan.features.projects}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Storage</span>
                        <span className="text-white font-semibold">{plan.features.storage}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Bandwidth</span>
                        <span className="text-white font-semibold">{plan.features.bandwidth}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Terminal Access</span>
                        <span className="text-white">
                          {plan.features.terminal ? <Check className="h-4 w-4 text-green-400" /> : '❌'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Webhooks</span>
                        <span className="text-white">
                          {plan.features.webhooks ? <Check className="h-4 w-4 text-green-400" /> : '❌'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Cron Jobs</span>
                        <span className="text-white">
                          {plan.features.cron ? <Check className="h-4 w-4 text-green-400" /> : '❌'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Analytics</span>
                        <span className="text-white">
                          {plan.features.analytics ? <Check className="h-4 w-4 text-green-400" /> : '❌'}
                        </span>
                      </div>
                    </div>

                    {currentPlanKey !== key && plan.price > 0 && (
                      <div className="space-y-2 pt-4">
                        <Button
                          onClick={() => simulateStripePayment(key)}
                          disabled={upgrading === key}
                          className="w-full bg-[#6B73FF] hover:bg-[#5A61FF]"
                        >
                          {upgrading === key ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-2" />
                          )}
                          Pay with Stripe
                        </Button>
                        
                        <Button
                          onClick={() => simulatePayPalPayment(key)}
                          disabled={upgrading === key}
                          className="w-full bg-[#0070BA] hover:bg-[#005A9B]"
                        >
                          {upgrading === key ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <DollarSign className="h-4 w-4 mr-2" />
                          )}
                          Pay with PayPal
                        </Button>
                        
                        <Button
                          onClick={() => simulateMpesaPayment(key)}
                          disabled={upgrading === key}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {upgrading === key ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <DollarSign className="h-4 w-4 mr-2" />
                          )}
                          Pay with M-PESA
                        </Button>
                      </div>
                    )}
                    
                    {currentPlanKey === key && (
                      <Button disabled className="w-full" variant="outline">
                        Current Plan
                      </Button>
                    )}
                    
                    {key === 'free' && currentPlanKey !== 'free' && (
                      <Button
                        variant="outline"
                        className="w-full border-slate-600"
                        onClick={() => {
                          if (confirm('Are you sure you want to downgrade to the free plan?')) {
                            handleUpgrade('free', 'stripe');
                          }
                        }}
                      >
                        Downgrade to Free
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-[#1E293B] border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Billing History</CardTitle>
              </CardHeader>
              <CardContent>
                {billingHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400">No billing history yet</p>
                    <p className="text-slate-500 text-sm">Your payment history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {billingHistory.map((record) => (
                      <div 
                        key={record.id} 
                        className="flex items-center justify-between p-4 bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getStatusColor(record.payment_status)} text-white`}>
                              {record.payment_status}
                            </Badge>
                            <span className="text-white font-medium capitalize">
                              {record.plan} Plan
                            </span>
                          </div>
                          <span className="text-slate-400 text-sm">
                            via {record.payment_method}
                          </span>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-white font-semibold">
                            ${record.amount} {record.currency}
                          </div>
                          <div className="text-slate-400 text-sm">
                            {new Date(record.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Billing Notice */}
        <Card className="bg-yellow-900/20 border-yellow-600">
          <CardContent className="flex items-start space-x-3 pt-6">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div>
              <h4 className="text-yellow-400 font-medium">Test Mode</h4>
              <p className="text-yellow-200 text-sm">
                All payments are currently in test mode. No real charges will be made. 
                In production, replace the mock API keys with real payment processor credentials.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
