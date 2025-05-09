import React from 'react';
import { Header } from '../components/Header';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-200">
      <Header />
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-4xl font-bold text-neutral-700 mb-8">About PlanFast</h1>
        <div className="bg-white rounded-xl shadow-sm p-8">
          <p className="text-lg text-neutral-600 mb-6">
            PlanFast is your intelligent travel companion, designed to create personalized
            city experiences that match your unique interests and preferences.
          </p>
          <p className="text-lg text-neutral-600 mb-6">
            Our mission is to make travel planning effortless and enjoyable, helping you
            discover the perfect blend of attractions, activities, and hidden gems in
            your chosen destination.
          </p>
          <p className="text-lg text-neutral-600">
            Whether you're a culture enthusiast, foodie, or adventure seeker, PlanFast
            crafts tailored itineraries that bring your dream trip to life.
          </p>
        </div>
      </div>
    </div>
  );
}