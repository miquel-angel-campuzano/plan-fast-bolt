import { supabase } from './supabase';
import { useSupabaseUser } from '../hooks/useSupabaseUser';

type EventName = 'landing_page_view' | 'start_planning_click' | 'itinerary_view' | 'save_trip';

type EventProperties = {
  city?: string;
  trip_name?: string;
};

export async function trackEvent(eventName: EventName, properties: EventProperties = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('user_events').insert({
      event_name: eventName,
      user_id: user?.id || null,
      properties
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}