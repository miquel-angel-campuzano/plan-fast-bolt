import { StrictMode, useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import { CitySelector } from './components/CitySelector';
import { ActivityPreferences } from './components/ActivityPreferences';
import { TravelPreferences } from './components/TravelPreferences';
import { ItineraryDisplay } from './components/ItineraryDisplay';
import { SavedTrips } from './pages/SavedTrips';
import { SavedTripView } from './pages/SavedTripView';
import { AboutPage } from './pages/AboutPage';
import { PricingPage } from './pages/PricingPage';
import { Header } from './components/Header';
import { LoadingTransition } from './components/LoadingTransition';
import { trackEvent } from './lib/analytics';
import React from 'react';

type Step = 'city' | 'activities' | 'preferences' | 'loading' | 'itinerary';

function PlannerApp() {
  const { state } = useLocation();
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>('city');
  const [travelStyle, setTravelStyle] = useState('');
  const [planningStarted, setPlanningStarted] = useState(false);

  useEffect(() => {
    trackEvent('landing_page_view');
  }, []);

  useEffect(() => {
    if (state?.scrollToHero) {
      setPlanningStarted(false);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
    }
  }, [state]);

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setCurrentStep('activities');
  };

  const handleActivityPreferencesComplete = (cats: string[]) => {
    setSelectedCategories(cats);
    setCurrentStep('preferences');
  };

  const handleTravelPreferencesComplete = (style: string) => {
    setTravelStyle(style);
    setCurrentStep('loading');
    setTimeout(() => {
      setCurrentStep('itinerary');
      trackEvent('itinerary_view', { city: selectedCity });
    }, 5000);
  };

  const goBack = () => {
    if (currentStep === 'activities') setCurrentStep('city');
    else if (currentStep === 'preferences') setCurrentStep('activities');
    else if (currentStep === 'itinerary') setCurrentStep('preferences');
  };

  const renderBackButton = () =>
    currentStep !== 'city' && currentStep !== 'loading' ? (
      <button
        onClick={goBack}
        className="absolute left-4 top-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
    ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Header />

    {/* Hero */}
{currentStep === 'city' && !planningStarted && (
  <section className="bg-white min-h-[85vh] px-4 pt-10 sm:pt-20 border-b border-gray-200 relative flex items-start">
    <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')] bg-cover bg-center opacity-100" />

    <div className="max-w-xl mx-auto text-center relative z-10">
      <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-2">
        Where would you like to go?
      </h1>
      <h2 className="text-base sm:text-lg md:text-xl text-gray-700 mb-10">
        Pick a city. Pick your preferences. Get your perfect plan.
      </h2>
      <CitySelector onCitySelect={handleCitySelect} />
    </div>
  </section>
)}

{/* Onboarding Stepper after city selection */}
{currentStep !== 'city' && currentStep !== 'loading' && currentStep !== 'itinerary' && (
  <section className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 bg-white">
    <div className="max-w-xl w-full mx-auto text-center">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
        {selectedCity ? `Your trip to ${selectedCity}` : ''}
      </h1>
      {currentStep === 'activities' && (
        <ActivityPreferences
          city={selectedCity}
          onComplete={handleActivityPreferencesComplete}
        />
      )}
      {currentStep === 'preferences' && (
        <TravelPreferences onComplete={handleTravelPreferencesComplete} />
      )}
    </div>
  </section>
)}

{currentStep === 'loading' && <LoadingTransition />}

{currentStep === 'itinerary' && (
  <ItineraryDisplay
    city={selectedCity}
    categories={selectedCategories}
    travelStyle={travelStyle}
  />
)}

{/* Main Content: Only show How PlanFast Works on initial city step */}
{currentStep === 'city' && !planningStarted && (
  <section
    id="city-selector"
    className="min-h-screen flex items-center justify-center px-4 py-24 bg-white"
  >
    <div className="max-w-3xl text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        How PlanFast Works
      </h2>
      <p className="text-gray-600 text-lg leading-relaxed">
        We use smart algorithms to match your vibe, preferences, and travel style
        with curated city experiences. Get instant plans with restaurants,
        activities, and hidden gems—no hours of research needed.
      </p>
      <img
        src="https://images.pexels.com/photos/1051075/pexels-photo-1051075.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
        alt="PlanFast illustration"
        className="mx-auto mt-10 rounded-xl shadow-md"
      />
    </div>
  </section>
)}
    </div>
  );
}

export function App() {
  return (
    <StrictMode>
      <Router>
        <Routes>
          <Route path="/" element={<PlannerApp />} />
          <Route path="/saved-trips" element={<SavedTrips />} />
          <Route path="/trips/:tripId" element={<SavedTripView />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </StrictMode>
  );
}

export default App;