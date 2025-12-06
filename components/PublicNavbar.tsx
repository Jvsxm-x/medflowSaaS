import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { ROUTES } from '../constants';
import { Activity } from 'lucide-react';

export const PublicNavbar = () => {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to={ROUTES.LANDING} className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-teal-500 to-teal-700 text-white p-2 rounded-lg">
              <Activity size={20} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-slate-800">
              Dawini SaaS
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to={ROUTES.LANDING} className="text-slate-600 hover:text-teal-600 font-medium transition-colors">
              Features
            </Link>
            <Link to={ROUTES.PRICING} className="text-slate-600 hover:text-teal-600 font-medium transition-colors">
              Pricing
            </Link>
            <a href="#testimonials" className="text-slate-600 hover:text-teal-600 font-medium transition-colors">
              Testimonials
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link to={ROUTES.LOGIN} className="text-slate-600 hover:text-slate-900 font-medium hidden sm:block">
              Log in
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};