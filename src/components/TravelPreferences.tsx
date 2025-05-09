import React, { useState } from 'react';
import { DollarSign, Ban } from 'lucide-react';

type TravelPreferencesProps = {
  onComplete: (includePaid: string) => void;
};

export function TravelPreferences({ onComplete }: TravelPreferencesProps) {
  const [includePaid, setIncludePaid] = useState<string>('');

  const options = [
    { id: 'all', label: 'Include paid activities', icon: DollarSign },
    { id: 'free', label: 'Only free activities', icon: Ban },
  ];

  const handleComplete = () => {
    if (includePaid) {
      onComplete(includePaid);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-700 mb-4">
          Would you like to include paid activities?
        </h2>
        <p className="text-neutral-500 mb-6">
          Choose whether to include activities that require admission fees
        </p>

        <div className="grid grid-cols-2 gap-4">
          {options.map(({ id, label, icon: Icon }) => {
            const isSelected = includePaid === id;
            return (
              <button
                key={id}
                onClick={() => setIncludePaid(id)}
                className={`
                  p-6 rounded-lg border-2 transition-all
                  ${isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-neutral-200 hover:border-neutral-300'}
                `}
              >
                <div className="flex flex-col items-center space-y-3">
                  <Icon
                    className={`
                      w-8 h-8 
                      ${isSelected ? 'text-primary' : 'text-neutral-500'}
                    `}
                  />
                  <span
                    className={`
                      text-sm font-medium text-center
                      ${isSelected ? 'text-primary' : 'text-neutral-700'}
                    `}
                  >
                    {label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleComplete}
        disabled={!includePaid}
        className={`
          w-full px-6 py-3 
          rounded-lg font-medium
          transition-colors
          ${includePaid
            ? 'bg-primary text-neutral-100 hover:bg-primary-light'
            : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'}
        `}
      >
        Continue
      </button>
    </div>
  );
}
