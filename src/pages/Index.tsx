
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Terminal,
  Rocket,
  Bot,
  Monitor,
  Globe,
  CreditCard,
  ArrowRight,
  CheckCircle,
  Star,
  Zap
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: Rocket,
      title: 'Instant Deployment',
      description: 'Deploy apps from GitHub, ZIP files, or natural language prompts with real-time build logs.'
    },
    {
      icon: Bot,
      title: 'Bot Hosting',
      description: 'Host Telegram, Discord, Slack, and WhatsApp bots with automatic keep-alive and monitoring.'
    },
    {
      icon: Terminal,
      title: 'Linux Environment',
      description: 'Full Linux-based containers with terminal access, file management, and cron jobs.'
    },
    {
      icon: Monitor,
      title: 'Real-time Monitoring',
      description: 'Track CPU, RAM, uptime, and request counts with detailed analytics and alerts.'
    },
    {
      icon: Globe,
      title: 'Custom Domains',
      description: 'Connect your own domains and get SSL certificates automatically for professional apps.'
    },
    {
      icon: CreditCard,
      title: 'Flexible Billing',
      description: 'Pay with Stripe, PayPal, or M-PESA. Scale resources based on your needs.'
    }
  ];

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '1 project',
        '256MB RAM',
        'Community support',
        'Basic monitoring',
        'Shared domain'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Pro',
      price: '$9',
      period: 'month',
      description: 'For professional developers',
      features: [
        '10 projects',
        '1GB RAM',
        'Custom domains',
        'Advanced monitoring',
        'Priority support',
        'Webhook tools'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Elite',
      price: '$29',
      period: 'month',
      description: 'For teams and enterprises',
      features: [
        '50+ projects',
        '4GB RAM',
        'Auto-scaling',
        'Full logs',
        'Premium support',
        'SLA guarantee'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Terminal className="h-8 w-8 text-sky-400" />
              <span className="text-2xl font-bold text-white">CloudForge</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-sky-600 hover:bg-sky-700"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/auth')}
                    className="text-slate-300 hover:text-white"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="bg-sky-600 hover:bg-sky-700"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Deploy Apps Like a
            <span className="text-sky-400"> Pro</span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
            Full-stack cloud platform for hosting web apps, bots, and services. 
            Real Linux environments, instant deployments, and production-ready scaling.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-sky-600 hover:bg-sky-700 text-lg px-8 py-6"
            >
              Start Building Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8 py-6"
            >
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything you need to deploy
            </h2>
            <p className="text-xl text-slate-400">
              Production-ready infrastructure with developer-friendly tools
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-sky-600/10 rounded-lg">
                      <feature.icon className="h-6 w-6 text-sky-400" />
                    </div>
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-slate-400">
              Start free, scale as you grow
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative bg-slate-800 border-slate-700 ${
                  plan.popular ? 'border-sky-500 ring-1 ring-sky-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-sky-600 text-white px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-400 ml-2">/{plan.period}</span>
                  </div>
                  <CardDescription className="text-slate-400">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-3" />
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-sky-600 hover:bg-sky-700' 
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                    onClick={() => navigate('/auth')}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to deploy your next project?
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Join thousands of developers who trust CloudForge with their deployments
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="bg-sky-600 hover:bg-sky-700 text-lg px-8 py-6"
          >
            <Zap className="mr-2 h-5 w-5" />
            Start Building Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Terminal className="h-6 w-6 text-sky-400" />
              <span className="text-lg font-bold text-white">CloudForge</span>
            </div>
            <div className="flex space-x-6 text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
              <a href="#" className="hover:text-white transition-colors">Docs</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-700 text-center text-slate-400">
            <p>&copy; 2024 CloudForge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
