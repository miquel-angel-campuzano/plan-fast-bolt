import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type ActivityPreferencesProps = {
  city: string;
  onComplete: (categories: string[]) => void;
};

export function ActivityPreferences({ city, onComplete }: ActivityPreferencesProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const excludedCategories = ['Other', 'Food & Drink', 'Accommodation'];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('places')
          .select('umbrella_category')
          .eq('city', city)
          .order('umbrella_category');

        if (error) throw error;

        const uniqueCategories = Array.from(new Set(data.map(item => item.umbrella_category)))
          .filter(category => category && !excludedCategories.includes(category))
          .sort();

        setCategories(uniqueCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [city]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleComplete = () => {
    onComplete(selectedCategories);
  };

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-neutral-500">
          Loading activities...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-700 mb-4">
          What kinds of attractions interest you?
        </h2>
        <p className="text-neutral-500 mb-6">
          Select the categories that match your interests for {city}
        </p>

        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const isSelected = selectedCategories.includes(category);
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${isSelected
                    ? 'bg-primary/10 text-primary border border-primary hover:bg-primary/20'
                    : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                  }
                `}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleComplete}
        disabled={selectedCategories.length === 0}
        className="
          w-full px-6 py-3 
          bg-primary text-neutral-100 
          rounded-lg font-medium
          hover:bg-primary-light 
          transition-colors
          disabled:bg-neutral-300 
          disabled:text-neutral-500 
          disabled:cursor-not-allowed
        "
      >
        Continue
      </button>
    </div>
  );
}
