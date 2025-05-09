import { useNavigate, Link } from 'react-router-dom';
import { UserMenu } from './UserMenu';
import React from 'react';
import { useSupabaseUser } from '../hooks/useSupabaseUser';
import { Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthModal } from './AuthModal';

export function Header() {
  const navigate = useNavigate();
  const { user } = useSupabaseUser();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [pendingAuthModal, setPendingAuthModal] = React.useState(false);

  const handleLogoClick = () => {
    navigate('/', { state: { scrollToHero: true } });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMobileOpen(false);
  };

  // Open AuthModal after menu closes if requested
  React.useEffect(() => {
    if (!mobileOpen && pendingAuthModal) {
      setShowAuthModal(true);
      setPendingAuthModal(false);
    }
  }, [mobileOpen, pendingAuthModal]);

  return (
    <header className="relative top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={handleLogoClick}
            className="flex items-center focus:outline-none cursor-pointer"
          >
            <img
              src="https://eojfvcrnuvzzwayvfzvq.supabase.co/storage/v1/object/sign/images/ChatGPT%20Image%20May%202,%202025,%2006_45_09%20PM.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJpbWFnZXMvQ2hhdEdQVCBJbWFnZSBNYXkgMiwgMjAyNSwgMDZfNDVfMDkgUE0ucG5nIiwiaWF0IjoxNzQ2MjA0MzI0LCJleHAiOjE3NTQ4NDQzMjR9.ZmvV5eVZzKjTZ7CKfQobFjof7Ca4fPZJXAHeG_SVNhQ"
              alt="PlanFast"
              className="h-10 w-auto"
            />
          </button>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/saved-trips"
              className="text-neutral-500 hover:text-primary transition-colors"
            >
              My Saved Trips
            </Link>
            <Link
              to="/pricing"
              className="text-neutral-500 hover:text-primary transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/about"
              className="text-neutral-500 hover:text-primary transition-colors"
            >
              About Us
            </Link>
          </nav>

          <div className="hidden md:block">
            <UserMenu />
          </div>

          <button
            className="md:hidden p-2 text-neutral-700 hover:text-primary focus:outline-none"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Open menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex md:hidden items-end justify-end">
          <div className="bg-white h-full w-80 max-w-full shadow-xl p-6 flex flex-col right-0 animate-slide-in-right" style={{ transition: 'transform 0.3s', transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)' }}>
            <button
              className="self-end mb-6 p-2 text-neutral-700 hover:text-primary focus:outline-none"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
            <nav className="flex flex-col space-y-4 mb-8">
              <Link
                to="/saved-trips"
                className="text-neutral-700 hover:text-primary text-lg font-medium"
                onClick={() => setMobileOpen(false)}
              >
                My Saved Trips
              </Link>
              <Link
                to="/pricing"
                className="text-neutral-700 hover:text-primary text-lg font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/about"
                className="text-neutral-700 hover:text-primary text-lg font-medium"
                onClick={() => setMobileOpen(false)}
              >
                About Us
              </Link>
            </nav>
            <div className="mt-auto">
              {user ? (
                <div className="border-t border-neutral-200 pt-4">
                  <div className="mb-2 text-sm text-neutral-700 font-medium truncate">{user.email}</div>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (mobileOpen) {
                        setPendingAuthModal(true);
                        setMobileOpen(false);
                      } else {
                        setShowAuthModal(true);
                      }
                    }}
                    className="w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AuthModal rendered at the root, not inside the menu or overlay */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {}}
        mode="sign_in"
      />

    </header>
  );
}
