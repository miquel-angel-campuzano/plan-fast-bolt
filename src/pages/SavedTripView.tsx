// pages/SavedTripView.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSupabaseUser } from '../hooks/useSupabaseUser';
import { ItineraryDisplay } from '../components/ItineraryDisplay';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Header } from '../components/Header';

type SavedTrip = {
  id: string;
  name: string;
  city: string;
  categories: string[];
  travel_style: string;
  places: any[];
};

export function SavedTripView() {
  const { tripId } = useParams();
  const { user } = useSupabaseUser();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<SavedTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrip = async () => {
      if (!user || !tripId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('saved_trips')
          .select('*')
          .eq('id', tripId)
          .eq('user_id', user.id)
          .single();
        if (error) throw error;
        if (!data) throw new Error('Trip not found');
        setTrip(data);
      } catch (err) {
        console.error('Error fetching trip:', err);
        setError("Trip not found or you don't have permission to view it.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrip();
  }, [tripId, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-200 flex flex-col items-center justify-center">
        <Header />
        <div className="flex items-center gap-3 mt-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-neutral-500">Loading trip details...</span>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-neutral-200 p-8">
        <Header />
        <div className="max-w-2xl mx-auto text-center mt-8">
          <h1 className="text-2xl font-bold text-neutral-700 mb-4">
            {error || 'Trip not found'}
          </h1>
          <button
            type="button"
            onClick={() => navigate('/saved-trips')}
            className="
              inline-flex items-center gap-2 
              px-6 py-2 
              bg-primary text-neutral-100 
              rounded-lg font-medium 
              hover:bg-primary-light 
              transition-colors
            "
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Saved Trips
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-200">
      <Header />
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => navigate('/saved-trips')}
            aria-label="Back to saved trips"
            className="
              relative z-50 
              p-2 
              text-neutral-500 
              hover:text-neutral-700 
              hover:bg-neutral-100 
              rounded-full 
              transition-colors
            "
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-neutral-700">{trip.name}</h1>
        </div>

        <ItineraryDisplay
          city={trip.city}
          categories={trip.categories}
          travelStyle={trip.travel_style}
          isSaved={true}
        />
      </div>
    </div>
  );
}
