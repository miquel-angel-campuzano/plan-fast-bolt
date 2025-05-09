import { useNavigate, Link } from 'react-router-dom';
import { UserMenu } from './UserMenu';
import React from 'react';

export function Header() {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/', { state: { scrollToHero: true } });
  };

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

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
