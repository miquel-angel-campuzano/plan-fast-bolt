import React, { useState } from 'react';
import { X } from 'lucide-react';
import { AuthForm } from './AuthForm';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'sign_in' | 'sign_up';
  message?: string;
};

export function AuthModal({ 
  isOpen, 
  onClose,
  onSuccess,
  mode: initialMode = 'sign_in',
  message = 'Create an account to save your trip'
}: AuthModalProps) {
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>(initialMode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-100 rounded-xl shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="
            absolute right-4 top-4 
            text-neutral-500 hover:text-neutral-700 
            transition-colors
          "
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold text-neutral-700 mb-2 text-center">
            {mode === 'sign_in' ? 'Welcome Back' : 'Create Account'}
          </h2>
          
          <p className="text-neutral-500 text-center mb-6">
            {message}
          </p>
          
          <AuthForm
            mode={mode}
            onSuccess={onSuccess}
          />
          
          <div className="mt-4 text-center text-sm">
            <span className="text-neutral-500">
              {mode === 'sign_in' 
                ? "Don't have an account? " 
                : 'Already have an account? '}
            </span>
            <button
              onClick={() => setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in')}
              className="
                text-primary 
                hover:text-primary-light 
                font-medium 
                transition-colors
              "
            >
              {mode === 'sign_in' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}