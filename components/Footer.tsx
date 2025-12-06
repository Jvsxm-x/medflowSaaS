import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Twitter, Linkedin, Github } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-white">
            <Activity className="text-teal-400" size={24} />
            <span className="text-xl font-bold">Dawini SaaS</span>
          </div>
          <p className="text-sm text-slate-400">
            Revolutionizing healthcare management with AI-driven insights and seamless patient-doctor connectivity.
          </p>
          <div className="flex gap-4">
            <Twitter size={20} className="hover:text-white cursor-pointer" />
            <Linkedin size={20} className="hover:text-white cursor-pointer" />
            <Github size={20} className="hover:text-white cursor-pointer" />
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/features" className="hover:text-teal-400">Features</Link></li>
            <li><Link to="/pricing" className="hover:text-teal-400">Pricing</Link></li>
            <li><Link to="/security" className="hover:text-teal-400">Security</Link></li>
            <li><Link to="/roadmap" className="hover:text-teal-400">Roadmap</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-teal-400">About Us</Link></li>
            <li><Link to="/careers" className="hover:text-teal-400">Careers</Link></li>
            <li><Link to="/blog" className="hover:text-teal-400">Blog</Link></li>
            <li><Link to="/contact" className="hover:text-teal-400">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/privacy" className="hover:text-teal-400">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-teal-400">Terms of Service</Link></li>
            <li><Link to="/compliance" className="hover:text-teal-400">HIPAA Compliance</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Dawini Digital Health. All rights reserved.
      </div>
    </footer>
  );
};