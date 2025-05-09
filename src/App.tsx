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

type Step = 'city' | 'activities' | 'preferences' | 'loading' | 'itinerary';

function PlannerApp() {
  const { state } = useLocation<{ scrollToHero?: boolean }>();
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

  const scrollToSelector = () => {
    document
      .getElementById('city-selector')
      ?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => setPlanningStarted(true), 1000);
    trackEvent('start_planning_click');
  };

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
  <section className="bg-white py-24 px-4 border-b border-gray-200 relative overflow-hidden">
    <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3278215/pexels-photo-3278215.jpeg')] bg-cover bg-center')] bg-cover bg-center opacity-100" />

    <div className="max-w-xl mx-auto text-center bg-white/80 backdrop-blur-md p-10 rounded-3xl shadow-lg">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
        Where would you like to go?
      </h1>
      <CitySelector onCitySelect={handleCitySelect} />
    </div>

    <button
      onClick={() =>
        document
          .getElementById('city-selector')
          ?.scrollIntoView({ behavior: 'smooth' })
      }
      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-500 hover:text-gray-800 transition-colors animate-bounce"
      aria-label="Scroll down"
    >
      <ChevronDown className="w-8 h-8" />
    </button>
  </section>
)}


{/* Step Flow (Activity / Preferences / Loading / Itinerary) */}
{currentStep !== 'city' && currentStep !== 'loading' && (
  <div className="relative max-w-2xl w-full mx-auto mt-16 bg-white/90 backdrop-blur-sm shadow-md border border-gray-200 rounded-2xl p-8">
    {renderBackButton()}

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
)}

{currentStep === 'loading' && <LoadingTransition />}

{currentStep === 'itinerary' && (
  <ItineraryDisplay
    city={selectedCity}
    categories={selectedCategories}
    travelStyle={travelStyle}
  />
)}


      {/* Main Content */}
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