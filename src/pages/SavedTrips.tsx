// pages/SavedTrips.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSupabaseUser } from '../hooks/useSupabaseUser';
import { Header } from '../components/Header';
import { MapPin, Calendar, ChevronRight, Loader2 } from 'lucide-react';

type SavedTrip = {
  id: string;
  name: string;
  city: string;
  created_at: string;
};

export function SavedTrips() {
  const { user } = useSupabaseUser();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('saved_trips')
          .select('id, name, city, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setTrips(data);
      } catch (err) {
        console.error('Error fetching saved trips:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrips();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-200 flex flex-col items-center justify-center">
        <Header />
        <div className="flex items-center gap-3 mt-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-neutral-500">Loading your trips...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-200 py-12 px-4">
      <Header />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-700 mb-8">
          Your Saved Trips
        </h1>

        {trips.length === 0 ? (
          <div className="bg-neutral-100 rounded-xl shadow-sm border border-neutral-200 p-8 text-center">
            <p className="text-neutral-500 mb-6">
              You haven't saved any trips yet.
            </p>
            <button
              onClick={() => navigate('/')}
              className="
                px-6 py-2 
                bg-primary text-neutral-100 
                rounded-lg font-medium
                hover:bg-primary-light 
                transition-colors
              "
            >
              Plan Your First Trip
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                to={`/trips/${trip.id}`}
                className="
                  block
                  bg-neutral-100 rounded-xl shadow-sm 
                  border border-neutral-200 p-6
                  hover:shadow-md transition-shadow
                  cursor-pointer
                "
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-700 mb-2">
                      {trip.name}
                    </h2>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-neutral-500">
                        <MapPin className="w-4 h-4 text-neutral-500" />
                        <span>{trip.city}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-500">
                        <Calendar className="w-4 h-4 text-neutral-500" />
                        <span>
                          {new Date(trip.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
