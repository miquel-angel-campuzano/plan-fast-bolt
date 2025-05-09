import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

type AuthFormProps = {
  mode: 'sign_in' | 'sign_up';
  onSuccess: () => void;
};

export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'sign_up') {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ name })
            .eq('id', authData.user.id);
          if (profileError) throw profileError;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-accent/10 border border-accent/20 text-accent px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {mode === 'sign_up' && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="
              w-full px-3 py-2
              bg-neutral-100 border border-neutral-200
              rounded-md shadow-sm
              text-neutral-700 placeholder-neutral-500 text-sm
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
            "
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="
            w-full px-3 py-2
            bg-neutral-100 border border-neutral-200
            rounded-md shadow-sm
            text-neutral-700 placeholder-neutral-500 text-sm
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          "
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="
            w-full px-3 py-2
            bg-neutral-100 border border-neutral-200
            rounded-md shadow-sm
            text-neutral-700 placeholder-neutral-500 text-sm
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          "
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`
          w-full flex justify-center py-2 px-4
          border border-transparent rounded-md shadow-sm text-sm font-medium
          ${loading
            ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
            : 'bg-primary text-neutral-100 hover:bg-primary-light'}
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
          transition-colors
        `}
      >
        {loading ? (
          <Loader2 className="animate-spin h-5 w-5 text-neutral-100" />
        ) : mode === 'sign_up' ? (
          'Sign Up'
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}