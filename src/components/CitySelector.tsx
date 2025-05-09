import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

type CitySelectorProps = {
  onCitySelect: (city: string) => void;
};

export function CitySelector({ onCitySelect }: CitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.rpc('get_distinct_cities');
        if (error) throw error;
        const uniqueCities = (data as string[]).filter(Boolean).sort();
        setCities(uniqueCities);
        setFilteredCities(uniqueCities);
      } catch {
        // fallback
        const { data: fallbackData, error: fbErr } = await supabase
          .from('places')
          .select('city')
          .order('city');
        if (!fbErr) {
          const uniq = Array.from(new Set(fallbackData.map((i) => i.city)))
            .filter(Boolean)
            .sort();
          setCities(uniq);
          setFilteredCities(uniq);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    setFilteredCities(
      cities.filter((c) =>
        c.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, cities]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCitySelect = (city: string) => {
    setSearchTerm(city);
    onCitySelect(city);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 w-5 h-5"
        />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for a city..."
          className="
            w-full pl-10 pr-4 py-3 
            bg-neutral-100 border border-neutral-200 
            rounded-lg 
            text-neutral-700 placeholder-neutral-500
            focus:outline-none 
            focus:ring-2 focus:ring-primary 
            focus:border-primary
          "
        />
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="
            absolute z-50 w-full mt-1 
            bg-neutral-100 border border-neutral-200 
            rounded-lg shadow-lg 
            overflow-auto max-h-[300px]
          "
          style={{ scrollbarWidth: 'thin' }}
        >
          {isLoading ? (
            <div className="px-4 py-2 text-neutral-500">
              Loading cities...
            </div>
          ) : filteredCities.length > 0 ? (
            <div className="py-1">
              {filteredCities.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className="
                    w-full px-4 py-2 text-left 
                    text-neutral-700
                    hover:bg-neutral-200 
                    focus:bg-neutral-200 
                    focus:outline-none 
                    transition-colors
                  "
                >
                  {city}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-2 text-neutral-500">
              No cities found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
