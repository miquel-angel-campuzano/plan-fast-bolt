import React from 'react';
import { useSupabaseUser } from '../hooks/useSupabaseUser';

type AvatarProps = {
  size?: 'sm' | 'md' | 'lg';
};

export function Avatar({ size = 'md' }: AvatarProps) {
  const { user, profile } = useSupabaseUser();
  
  const getSize = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8';
      case 'lg': return 'h-12 w-12';
      default: return 'h-10 w-10';
    }
  };

  // If no avatar URL, use initials
  const initials = user?.email?.charAt(0).toUpperCase() ?? '?';
  const avatarUrl = profile?.avatar_url;
  
  return (
    <div
      className={`
        ${getSize()} rounded-full 
        bg-primary/10 flex items-center justify-center 
        overflow-hidden font-medium 
        ${avatarUrl ? '' : 'text-primary'}
      `}
    >
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={profile?.username || user?.email || 'User avatar'} 
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-primary">{initials}</span>
      )}
    </div>
  );
}
