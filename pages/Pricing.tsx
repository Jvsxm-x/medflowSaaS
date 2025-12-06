
import React, { useState } from 'react';
import { PublicNavbar } from '../components/PublicNavbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/Button';
import { Check, CreditCard, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES, STRIPE_PUBLIC_KEY } from '../constants';

export const Pricing = () => {
  const [annual, setAnnual] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubscribe = async (planName: string, priceId: string) => {
    if (planName === 'Patient Basic') {
      navigate(ROUTES.REGISTER);
      return;
    }

    setProcessingPlan(planName);

    try {
      // 1. Simulation: Call Backend to Create Checkout Session
      // In Django: 
      // stripe.checkout.Session.create(
      //   payment_method_types=['card'],
      //   line_items=[{'price': priceId, 'quantity': 1}],
      //   mode='subscription',
      //   success_url='https://dawini.com/payment/success?session_id={CHECKOUT_SESSION_ID}',
      //   cancel_url='https://dawini.com/pricing',
      // )
      
      console.log(`Creating Checkout Session for ${planName} (${priceId})...`);
      
      // Simulate API Network Latency
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      // 2. Simulation: Backend returns a URL to Stripe Hosted Checkout
      // For this demo, we simulate the "Success" flow directly since we can't redirect to real Stripe without backend keys.
      
      const simulatedStripeUrl = `${window.location.origin}/#${ROUTES.PAYMENT_SUCCESS}?session_id=cs_test_simulated_123&plan=${encodeURIComponent(planName)}`;
      
      // Simulate the redirect that window.location.href = response.url would do
      window.location.href = simulatedStripeUrl;
      
    } catch (error: any) {
      console.error("Payment Error:", error);
      alert("Payment service unavailable. Please try again.");
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <PublicNavbar />
      
      <section className="py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-slate-50 to-white -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
            Simple, transparent billing
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
            Secure payments via Stripe. Support for Credit Cards, Apple Pay, and Google Pay. Cancel anytime.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-16 bg-white w-fit mx-auto px-2 py-2 rounded-full shadow-sm border border-slate-200">
            <button 
              onClick={() => setAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${!annual ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${annual ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Yearly <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <PricingCard 
              title="Patient Basic"
              price="0"
              description="For individuals tracking their own health."
              features={[
                "Personal Health Dashboard",
                "Basic Vital Tracking",
                "Appointment Booking",
                "Secure Document Storage (1GB)"
              ]}
              cta="Sign Up Free"
              onSubscribe={() => handleSubscribe('Patient Basic', 'price_free')}
            />

            {/* Pro Plan */}
            <PricingCard 
              title="Professional"
              price={annual ? "49" : "59"}
              highlight
              description="For independent doctors and specialists."
              features={[
                "Everything in Basic",
                "Patient Management System",
                "AI Health Analysis",
                "Lab Order Management",
                "Unlimited Document Storage",
                "Priority Support"
              ]}
              cta="Start Pro Trial"
              isLoading={processingPlan === 'Professional'}
              onSubscribe={() => handleSubscribe('Professional', annual ? 'price_pro_yearly' : 'price_pro_monthly')}
            />

            {/* Enterprise */}
            <PricingCard 
              title="Clinic / Hospital"
              price={annual ? "199" : "249"}
              description="For clinics requiring multi-user access."
              features={[
                "Everything in Professional",
                "Multi-Doctor Accounts",
                "Admin Dashboard & Analytics",
                "API Access",
                "Custom Branding",
                "Dedicated Account Manager"
              ]}
              cta="Contact Sales"
              variant="outline"
              isLoading={processingPlan === 'Clinic / Hospital'}
              onSubscribe={() => handleSubscribe('Clinic / Hospital', annual ? 'price_enterprise_yearly' : 'price_enterprise_monthly')}
            />
          </div>
          
          <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-8 text-slate-400">
             <div className="flex items-center gap-2">
                 <ShieldCheck size={20} className="text-teal-500" />
                 <span>Secure 256-bit SSL Encryption</span>
             </div>
             <div className="flex items-center gap-2">
                 <CreditCard size={20} className="text-teal-500" />
                 <span>Powered by <strong>Stripe Billing</strong></span>
             </div>
             <div className="flex items-center gap-2">
                 <Zap size={20} className="text-teal-500" />
                 <span>Instant Access</span>
             </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const PricingCard = ({ title, price, description, features, cta, highlight, variant, onSubscribe, isLoading }: any) => (
  <div className={`bg-white rounded-2xl p-8 flex flex-col relative transition-all duration-300 ${highlight ? 'shadow-2xl shadow-teal-900/10 border-2 border-teal-500 scale-105 z-10' : 'shadow-lg border border-slate-100 hover:shadow-xl'}`}>
    {highlight && (
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-teal-500 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide shadow-lg">
        Most Popular
      </div>
    )}
    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
    <div className="flex items-baseline gap-1 mb-4">
      <span className="text-5xl font-extrabold text-slate-900">${price}</span>
      <span className="text-slate-500 font-medium">/mo</span>
    </div>
    <p className="text-slate-500 text-sm mb-8">{description}</p>
    
    <div className="flex-1 space-y-4 mb-8">
      {features.map((feat: string, i: number) => (
        <div key={i} className="flex items-start gap-3">
          <div className="p-0.5 bg-teal-50 rounded-full mt-0.5">
            <Check size={14} className="text-teal-600 shrink-0" />
          </div>
          <span className="text-slate-600 text-sm font-medium">{feat}</span>
        </div>
      ))}
    </div>
    
    <Button 
      variant={highlight ? 'primary' : 'secondary'} 
      className={`w-full justify-center py-4 text-base ${highlight ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
      onClick={onSubscribe}
      isLoading={isLoading}
      disabled={isLoading}
    >
      {isLoading ? 'Redirecting to Stripe...' : cta}
    </Button>
  </div>
);
