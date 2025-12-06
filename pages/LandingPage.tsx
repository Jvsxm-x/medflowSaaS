import React from 'react';
import { PublicNavbar } from '../components/PublicNavbar';
import { Footer } from '../components/Footer';
import { Button } from '../components/Button';
import { ROUTES } from '../constants';
import { Link } from 'react-router-dom';
import { BrainCircuit, ShieldCheck, Activity, Users, ArrowRight, Star } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 lg:pt-32">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-50 via-white to-white opacity-70 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 text-teal-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8 animate-fade-in-up">
            <Star size={14} className="fill-teal-700" />
            <span>Trusted by over 500+ Clinics</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-6">
            The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">Digital Health</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
            Streamline patient care with AI-powered diagnostics, seamless appointment scheduling, and secure medical record management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={ROUTES.REGISTER}>
              <Button className="px-8 py-4 text-lg h-auto shadow-xl shadow-teal-500/20">Start Free Trial</Button>
            </Link>
            <Link to={ROUTES.LOGIN}>
               <Button variant="secondary" className="px-8 py-4 text-lg h-auto">View Demo</Button>
            </Link>
          </div>
          
          <div className="mt-16 relative mx-auto max-w-5xl">
             <div className="bg-slate-900 rounded-xl p-2 shadow-2xl ring-1 ring-slate-900/10">
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
                  alt="App Dashboard Preview" 
                  className="rounded-lg w-full h-auto opacity-90"
                />
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything you need to manage your practice</h2>
            <p className="text-slate-500 text-lg">Powerful tools designed for modern healthcare providers and patients.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={BrainCircuit}
              title="AI Diagnostics"
              desc="Leverage machine learning to predict potential health risks based on patient vitals and history."
            />
            <FeatureCard 
              icon={ShieldCheck}
              title="Secure Records"
              desc="HIPAA-compliant encrypted storage for all medical documents, lab results, and history."
            />
             <FeatureCard 
              icon={Activity}
              title="Real-time Vitals"
              desc="Monitor patient health trends with interactive charts and automated alert systems."
            />
             <FeatureCard 
              icon={Users}
              title="Patient Portal"
              desc="Empower patients to book appointments, view results, and communicate with doctors."
            />
             <FeatureCard 
              icon={Star}
              title="Telemedicine"
              desc="Integrated video calls for remote consultations and follow-ups."
            />
             <FeatureCard 
              icon={ArrowRight}
              title="Smart Scheduling"
              desc="Automated appointment booking system that reduces no-shows and optimizes time."
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-teal-900 text-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
               <StatItem value="10k+" label="Active Patients" />
               <StatItem value="500+" label="Medical Professionals" />
               <StatItem value="99.9%" label="Uptime Guarantee" />
               <StatItem value="24/7" label="Support Available" />
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to transform your healthcare experience?</h2>
          <p className="text-xl text-slate-500 mb-10">Join thousands of doctors and patients using Dawini today.</p>
          <Link to={ROUTES.REGISTER}>
            <Button className="px-10 py-4 text-lg h-auto rounded-full">Get Started for Free</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }: any) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-6">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{desc}</p>
  </div>
);

const StatItem = ({ value, label }: any) => (
  <div>
    <div className="text-4xl md:text-5xl font-bold mb-2 text-teal-300">{value}</div>
    <div className="text-teal-100 font-medium">{label}</div>
  </div>
);