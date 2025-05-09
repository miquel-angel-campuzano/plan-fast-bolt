import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingTransition() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
        <Loader2 className="w-16 h-16 text-primary animate-spin relative" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-semibold text-neutral-700">
          Looking for the best activities
        </h3>
        <p className="text-neutral-500">
          Finding the perfect activities that match your preferences...
        </p>
      </div>
    </div>
  );
}