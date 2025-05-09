// components/UserMenu.tsx
import React, { useState } from 'react';
import { LogOut, User, BookMarked } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSupabaseUser } from '../hooks/useSupabaseUser';
import { AuthModal } from './AuthModal';
import { useNavigate } from 'react-router-dom';

export function UserMenu() {
  const { user, profile } = useSupabaseUser();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
  };

  // If not signed in, show “Sign In” pill
  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="
            inline-block px-3 py-1 
            bg-neutral-100/60 text-neutral-900 
            rounded-full backdrop-blur-sm
            hover:bg-neutral-100/80 transition-all
          "
        >
          Sign In
        </button>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode="sign_in"
        />
      </>
    );
  }

  // When signed in, show avatar in the same pill style
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          inline-flex items-center justify-center
          p-2 rounded-full
          bg-neutral-100/60 backdrop-blur-sm
          text-primary
          hover:bg-neutral-100/80
          transition-all
        "
      >
        {profile?.name ? (
          <span className="text-sm font-medium text-primary">
            {profile.name.charAt(0).toUpperCase()}
          </span>
        ) : (
          <User className="w-5 h-5 text-primary" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-neutral-100 rounded-lg shadow-lg py-1 border border-neutral-200">
          <div className="px-4 py-2 border-b border-neutral-200">
            <p className="text-sm font-medium text-neutral-700">
              {profile?.name || 'User'}
            </p>
            <p className="text-xs text-neutral-500">{user.email}</p>
          </div>
          
          <button
            onClick={() => {
              navigate('/saved-trips');
              setIsOpen(false);
            }}
            className="
              w-full px-4 py-2 text-left text-sm 
              text-neutral-700 hover:bg-neutral-200 
              flex items-center gap-2 transition-colors
            "
          >
            <BookMarked className="w-4 h-4 text-neutral-700" />
            Saved Trips
          </button>
          
          <button
            onClick={handleSignOut}
            className="
              w-full px-4 py-2 text-left text-sm 
              text-accent hover:bg-accent/10 
              flex items-center gap-2 transition-colors
            "
          >
            <LogOut className="w-4 h-4 text-accent" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
