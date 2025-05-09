// components/ItineraryDisplay.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  MapPin,
  Clock,
  Info,
  Globe,
  Map,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { SaveTripButton } from './SaveTripButton';

export type Place = {
  id: string;
  name: string;
  description: string;
  umbrella_category: string;
  duration: string | null;
  local_tip: string | null;
  maps_url: string | null;
  website: string | null;
  price_level: string | null;
};

type ItineraryDisplayProps = {
  city: string;
  categories: string[];
  travelStyle: string;
  isSaved?: boolean;
};

function mapUrl(place: Place) {
  if (!place.maps_url) return null;
  const m = place.maps_url.match(/place_id:([^&]+)/);
  if (m && m[1]) {
    const id = m[1];
    const name = encodeURIComponent(place.name || '');
    return `https://www.google.com/maps/search/?api=1&query=${name}&query_place_id=${id}`;
  }
  return place.maps_url;
}

export function ItineraryDisplay({
  city,
  categories,
  travelStyle,
  isSaved = false
}: ItineraryDisplayProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        let q = supabase
          .from<Place>('places')
          .select('*')
          .eq('city', city)
          .in('umbrella_category', categories)
          .order('popularity_score', { ascending: false });
        if (travelStyle === 'free') q = q.eq('price_level', 'free');
        const { data, error } = await q.limit(15);
        if (error) throw error;
        setPlaces(data || []);
      } catch {
        setError('Failed to load itinerary. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [city, categories, travelStyle]);

  const toggle = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      prev.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const priceLabel = (lvl: string | null) => (lvl === 'free' ? 'Free' : 'Paid');
  const priceColor = (lvl: string | null) => {
    switch (lvl) {
      case 'free': return 'bg-green-50 text-green-700';
      case 'low': return 'bg-primary-light text-primary';
      case 'medium': return 'bg-yellow-50 text-yellow-700';
      case 'high': return 'bg-red-50 text-red-700';
      default: return 'bg-neutral-200 text-black';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-8 bg-red-50 rounded-lg text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="mb-16 mt-4 sm:mt-8 px-4 lg:px-8">
      {/* Header & Description */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold">
          Perfect activities for you in {city}
        </h2>
        <p className="mt-2 text-neutral-700">
          {travelStyle === 'free'
            ? 'Focusing on free activities'
            : 'Including both free and paid activities'}
        </p>
      </div>

      {/* One card per place */}
      <div className="space-y-6">
        {places.map((place, i) => (
          <div
            key={place.id}
            className="bg-white rounded-xl border border-neutral-200 p-6 shadow hover:shadow-lg transition"
          >
            {/* Number & Title */}
            <div className="flex items-center gap-4">
              <span
                className="
                  flex-shrink-0
                  h-10 w-10
                  flex items-center justify-center
                  rounded-full
                  bg-primary text-white font-semibold
                "
              >
                {i + 1}
              </span>
              <h3 className="text-lg font-semibold">{place.name}</h3>
            </div>

            {/* Metadata Badges */}
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {place.umbrella_category && (
                <div className="flex items-center gap-1.5 bg-neutral-200 px-3 py-1 rounded-full">
                  <MapPin className="w-4 h-4" />
                  {place.umbrella_category}
                </div>
              )}
              {place.duration && (
                <div className="flex items-center gap-1.5 bg-neutral-200 px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4" />
                  {place.duration}
                </div>
              )}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${priceColor(
                  place.price_level
                )}`}
              >
                <DollarSign className="w-4 h-4" />
                {priceLabel(place.price_level)}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              {place.maps_url && (
                <a
                  href={mapUrl(place) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-1.5 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition text-sm"
                >
                  <Map className="w-4 h-4" /> View on Maps
                </a>
              )}
              {place.website && (
                <a
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-1.5 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition text-sm"
                >
                  <Globe className="w-4 h-4" /> Visit Website
                </a>
              )}
              <button
                onClick={() => toggle(place.id)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-neutral-200 text-neutral-800 rounded-lg hover:bg-neutral-300 transition text-sm"
              >
                {expanded.has(place.id) ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                {expanded.has(place.id) ? 'Hide Details' : 'View Details'}
              </button>
            </div>

            {/* Details */}
            {expanded.has(place.id) && (
              <div className="mt-4 pt-4 border-t border-neutral-200 space-y-4">
                <p className="text-neutral-700">{place.description}</p>
                {place.local_tip && (
                  <div className="bg-primary-light/30 p-4 rounded-lg border border-primary-light">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-primary" />
                      <div>
                        <span className="font-medium text-primary">
                          Local Tip:
                        </span>
                        <p className="mt-1 text-primary-dark">{place.local_tip}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save Trip FAB */}
      {!isSaved && places.length > 0 && (
        <SaveTripButton
          city={city}
          categories={categories}
          travelStyle={travelStyle}
          places={places}
          isVisible
        />
      )}
    </div>
  );
}
