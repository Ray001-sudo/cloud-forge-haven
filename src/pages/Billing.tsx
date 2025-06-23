
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Check, 
  X, 
  Zap, 
  Crown, 
  Star,
  Calendar,
  Receipt,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';

interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: PlanFeature[];
  popular?: boolean;
  current?: boolean;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  method: 'stripe' | 'paypal' | 'mpesa';
}

const Billing = () => {
  const { profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      date: '2024-01-15T10:30:00Z',
      description: 'Pro Plan - Monthly',
      amount: 19.99,
      status: 'completed',
      method: 'stripe'
    },
    {
      id: '2',
      date: '2024-01-01T08:15:00Z',
      description: 'Pro Plan - Monthly',
      amount: 19.99,
      status: 'completed',
      method: 'paypal'
    }
  ]);

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'forever',
      current: profile?.subscription_tier === 'free',
      features: [
        { name: 'Deploy Apps', included: true, limit: '1 project' },
        { name: 'RAM Memory', included: true, limit: '256MB' },
        { name: 'File Manager', included: true },
        { name: 'Basic Terminal', included: true },
        { name: 'Custom Domains', included: false },
        { name: 'Cron Jobs', included: false },
        { name: 'Webhook Tester', included: false },
        { name: 'Analytics', included: false },
        { name: 'Priority Support', included: false }
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19.99,
      interval: 'month',
      popular: true,
      current: profile?.subscription_tier === 'pro',
      features: [
        { name: 'Deploy Apps', included: true, limit: '10 projects' },
        { name: 'RAM Memory', included: true, limit: '1GB' },
        { name: 'File Manager', included: true },
        { name: 'Full Terminal', included: true },
        { name: 'Custom Domains', included: true },
        { name: 'Cron Jobs', included: true },
        { name: 'Webhook Tester', included: true },
        { name: 'Analytics', included: true },
        { name: 'Priority Support', included: false }
      ]
    },
    {
      id: 'elite',
      name: 'Elite',
      price: 49.99,
      interval: 'month',
      current: profile?.subscription_tier === 'elite',
      features: [
        { name: 'Deploy Apps', included: true, limit: '50 projects' },
        { name: 'RAM Memory', included: true, limit: '4GB' },
        { name: 'File Manager', included: true },
        { name: 'Full Terminal', included: true },
        { name: 'Custom Domains', included: true },
        { name: 'Cron Jobs', included: true },
        { name: 'Webhook Tester', included: true },
        { name: 'Analytics', included: true },
        { name: 'Priority Support', included: true }
      ]
    }
  ];

  const handleUpgrade = async (planId: string, paymentMethod: 'stripe' | 'paypal' | 'mpesa') => {
    setIsLoading(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock payment success - in production, this would be handled by webhooks
      toast.success(`Successfully upgraded to ${planId.toUpperCase()} plan!`);
      
      // Refresh profile to update subscription tier
      await refreshProfile();
      
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentMethod = (planId: string) => {
    // In production, this would open a payment method selector
    // For now, we'll simulate with Stripe
    handleUpgrade(planId, 'stripe');
  };

  const getCurrentUsage = () => {
    // Mock usage data based on current plan
    const planLimits = {
      free: { projects: 1, ram: 256 },
      pro: { projects: 10, ram: 1024 },
      elite: { projects: 50, ram: 4096 }
    };
    
    const limits = planLimits[profile?.subscription_tier as keyof typeof planLimits] || planLimits.free;
    
    return {
      projects: { used: 3, total: limits.projects },
      ram: { used: 512, total: limits.ram },
      storage: { used: 2.5, total: 10 }
    };
  };

  const usage = getCurrentUsage();

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'pro': return Zap;
      case 'elite': return Crown;
      default: return Star;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'pending': return 'bg-yellow-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'stripe': return CreditCard;
      case 'paypal': return Wallet;
      case 'mpesa': return Receipt;
      default: return CreditCard;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Billing & Subscription</h1>
          <p className="text-slate-400 mt-1">Manage your subscription and billing information</p>
        </div>

        {/* Current Plan & Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Current Plan</CardTitle>
              <CardDescription className="text-slate-400">
                Your active subscription and features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white capitalize">
                    {profile?.subscription_tier || 'Free'} Plan
                  </h3>
                  <p className="text-slate-400">
                    {profile?.subscription_tier === 'free' ? 'Free forever' : 
                     profile?.subscription_tier === 'pro' ? '$19.99/month' : 
                     '$49.99/month'}
                  </p>
                </div>
                <Badge className={`${
                  profile?.subscription_tier === 'pro' ? 'bg-sky-600' :
                  profile?.subscription_tier === 'elite' ? 'bg-purple-600' :
                  'bg-slate-600'
                } text-white`}>
                  {profile?.subscription_tier?.toUpperCase() || 'FREE'}
                </Badge>
              </div>
              
              {profile?.subscription_tier !== 'free' && (
                <div className="p-3 bg-slate-700 rounded-lg mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Next billing date</span>
                    <span className="text-white">February 15, 2024</span>
                  </div>
                </div>
              )}

              <Button
                onClick={() => handlePaymentMethod('pro')}
                className="w-full bg-sky-600 hover:bg-sky-700"
                disabled={profile?.subscription_tier !== 'free'}
              >
                {profile?.subscription_tier === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Usage Overview</CardTitle>
              <CardDescription className="text-slate-400">
                Current usage against your plan limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Projects</span>
                  <span className="text-slate-300">{usage.projects.used} / {usage.projects.total}</span>
                </div>
                <Progress 
                  value={(usage.projects.used / usage.projects.total) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">RAM Usage</span>
                  <span className="text-slate-300">{usage.ram.used} MB / {usage.ram.total} MB</span>
                </div>
                <Progress 
                  value={(usage.ram.used / usage.ram.total) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Storage</span>
                  <span className="text-slate-300">{usage.storage.used} GB / {usage.storage.total} GB</span>
                </div>
                <Progress 
                  value={(usage.storage.used / usage.storage.total) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Plans */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Subscription Plans</CardTitle>
            <CardDescription className="text-slate-400">
              Choose the plan that fits your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const Icon = getPlanIcon(plan.id);
                return (
                  <div
                    key={plan.id}
                    className={`relative p-6 rounded-lg border ${
                      plan.current ? 'border-sky-500 bg-sky-500/10' : 
                      plan.popular ? 'border-purple-500 bg-purple-500/10' : 
                      'border-slate-600 bg-slate-700/50'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-purple-600 text-white">Most Popular</Badge>
                      </div>
                    )}
                    
                    {plan.current && (
                      <div className="absolute -top-3 right-4">
                        <Badge className="bg-sky-600 text-white">Current Plan</Badge>
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <Icon className="h-8 w-8 mx-auto mb-2 text-sky-400" />
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-white">${plan.price}</span>
                        <span className="text-slate-400">/{plan.interval}</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-green-400 mr-2" />
                          ) : (
                            <X className="h-4 w-4 text-red-400 mr-2" />
                          )}
                          <span className={`text-sm ${feature.included ? 'text-white' : 'text-slate-400'}`}>
                            {feature.name}
                            {feature.limit && (
                              <span className="text-slate-400 ml-1">({feature.limit})</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handlePaymentMethod(plan.id)}
                      disabled={plan.current || isLoading}
                      className={`w-full ${
                        plan.current ? 'bg-slate-600' :
                        plan.popular ? 'bg-purple-600 hover:bg-purple-700' :
                        'bg-sky-600 hover:bg-sky-700'
                      }`}
                    >
                      {plan.current ? 'Current Plan' : 
                       isLoading ? 'Processing...' : 
                       `Upgrade to ${plan.name}`}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Transaction History</CardTitle>
            <CardDescription className="text-slate-400">
              Your recent billing transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const MethodIcon = getMethodIcon(transaction.method);
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <MethodIcon className="h-8 w-8 text-slate-400" />
                        <div>
                          <p className="text-white font-medium">{transaction.description}</p>
                          <p className="text-sm text-slate-400">
                            {new Date(transaction.date).toLocaleDateString()} • {transaction.method.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-white font-semibold">${transaction.amount}</span>
                        <Badge className={`${getStatusColor(transaction.status)} text-white`}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No transactions yet</h3>
                <p className="text-slate-400">Your billing history will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Billing;
