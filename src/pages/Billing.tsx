
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Check, 
  Star,
  Crown,
  Zap,
  Calendar,
  DollarSign,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  plan_name: string;
  created_at: string;
  billing_period_start?: string;
  billing_period_end?: string;
}

interface Profile {
  subscription_tier: string;
  credits: number;
}

const Billing = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'forever',
      icon: Zap,
      color: 'text-slate-400',
      bgColor: 'bg-slate-100',
      features: [
        '1 Project',
        '100 MB Storage',
        '0.5 CPU Core',
        '256 MB RAM',
        'Basic Support'
      ],
      limits: {
        projects: 1,
        storage: 100, // MB
        cpu: 0.5,
        ram: 256
      }
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19,
      period: 'month',
      icon: Star,
      color: 'text-blue-400',
      bgColor: 'bg-blue-100',
      popular: true,
      features: [
        '10 Projects',
        '10 GB Storage',
        '2 CPU Cores',
        '2 GB RAM',
        'Priority Support',
        'Custom Domains',
        'SSL Certificates'
      ],
      limits: {
        projects: 10,
        storage: 10240, // MB
        cpu: 2,
        ram: 2048
      }
    },
    {
      id: 'elite',
      name: 'Elite',
      price: 49,
      period: 'month',
      icon: Crown,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-100',
      features: [
        'Unlimited Projects',
        '100 GB Storage',
        '8 CPU Cores',
        '8 GB RAM',
        '24/7 Support',
        'Custom Domains',
        'SSL Certificates',
        'Advanced Monitoring',
        'Priority Deployment'
      ],
      limits: {
        projects: -1, // unlimited
        storage: 102400, // MB
        cpu: 8,
        ram: 8192
      }
    }
  ];

  useEffect(() => {
    if (user) {
      loadUserData();
      loadPaymentHistory();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, credits')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load user profile');
    }
  };

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!user || !profile) return;

    setUpgrading(planId);

    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ subscription_tier: planId })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          amount: plan.price,
          currency: 'USD',
          payment_method: 'stripe',
          status: 'completed',
          plan_name: plan.name,
          billing_period_start: new Date().toISOString(),
          billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: { plan_id: planId }
        });

      if (paymentError) throw paymentError;

      // Create billing history record
      const { error: historyError } = await supabase
        .from('billing_history')
        .insert({
          user_id: user.id,
          plan: plan.name,
          amount: plan.price,
          currency: 'USD',
          payment_method: 'stripe',
          payment_status: 'completed',
          processed_at: new Date().toISOString()
        });

      if (historyError) throw historyError;

      toast.success(`Successfully upgraded to ${plan.name} plan!`);
      loadUserData();
      loadPaymentHistory();
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast.error('Failed to upgrade plan');
    } finally {
      setUpgrading(null);
    }
  };

  const currentPlan = plans.find(p => p.id === profile?.subscription_tier) || plans[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Billing & Subscription</h1>
          <p className="text-slate-400 mt-1">
            Manage your subscription and payment methods
          </p>
        </div>

        {/* Current Plan */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${currentPlan.bgColor}`}>
                  <currentPlan.icon className={`h-6 w-6 ${currentPlan.color}`} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{currentPlan.name}</h3>
                  <p className="text-slate-400">
                    {currentPlan.price === 0 ? 'Free forever' : `$${currentPlan.price}/${currentPlan.period}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Credits Available</p>
                <p className="text-2xl font-bold text-white">{profile?.credits || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.id === profile?.subscription_tier;
            const isUpgrade = plans.findIndex(p => p.id === plan.id) > plans.findIndex(p => p.id === profile?.subscription_tier);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative bg-slate-800 border-slate-700 ${
                  plan.popular ? 'border-blue-500 border-2' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className={`w-12 h-12 rounded-lg ${plan.bgColor} mx-auto flex items-center justify-center mb-4`}>
                    <plan.icon className={`h-6 w-6 ${plan.color}`} />
                  </div>
                  <CardTitle className="text-white">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-white">
                    ${plan.price}
                    {plan.price > 0 && <span className="text-lg text-slate-400">/{plan.period}</span>}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-slate-300">
                        <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent || upgrading === plan.id}
                    className={`w-full ${
                      isCurrent 
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                        : isUpgrade
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-slate-600 hover:bg-slate-700'
                    }`}
                  >
                    {upgrading === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      'Current Plan'
                    ) : isUpgrade ? (
                      'Upgrade'
                    ) : (
                      'Downgrade'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment History */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No payment history found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-700 rounded-lg">
                        <Calendar className="h-4 w-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{payment.plan_name} Plan</p>
                        <p className="text-sm text-slate-400">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">
                        ${payment.amount.toFixed(2)} {payment.currency}
                      </p>
                      <Badge 
                        variant={payment.status === 'completed' ? 'default' : 'secondary'}
                        className={payment.status === 'completed' ? 'bg-green-600' : ''}
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
