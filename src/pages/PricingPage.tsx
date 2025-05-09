import React from 'react';
import { Header } from '../components/Header';
import { Check } from 'lucide-react';

export function PricingPage() {
  return (
    <div className="min-h-screen bg-neutral-200">
      <Header />
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-4xl font-bold text-neutral-700 mb-8 text-center">
          Choose Your Plan
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Tier */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-neutral-700 mb-2">Free</h2>
            <p className="text-3xl font-bold text-primary mb-6">$0</p>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-neutral-600">Basic features included</span>
              </div>
            </div>
          </div>

          {/* Premium Tier */}
          <div className="bg-white rounded-xl shadow-sm p-8 border-2 border-primary">
            <div className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              Popular
            </div>
            <h2 className="text-2xl font-bold text-neutral-700 mb-2">Premium</h2>
            <p className="text-3xl font-bold text-primary mb-6">Coming Soon</p>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-neutral-600">All free features included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}