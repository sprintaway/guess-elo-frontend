import React, { useState } from 'react';

export function GameOptionsSelector({ onSelect, showTimer = false }) {
  const [selectedGameCount, setSelectedGameCount] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [step, setStep] = useState('games'); // 'games' or 'timer'

  const gameOptions = [3, 5, 7, 10];
  
  const timerOptions = [
    { value: 60, label: '1 Minute', icon: '⚡', description: 'Quick & Fast' },
    { value: 120, label: '2 Minutes', icon: '⏱️', description: 'Balanced' },
    { value: 180, label: '3 Minutes', icon: '🕐', description: 'Thoughtful' }
  ];

  const handleGameCountSelect = (count) => {
    if (!showTimer) {
      // Single player mode - submit immediately
      onSelect(count);
    } else {
      // Multiplayer mode - go to timer selection
      setSelectedGameCount(count);
      setStep('timer');
    }
  };

  const handleTimerSelect = () => {
    onSelect(selectedGameCount, selectedDuration);
  };

  const handleBack = () => {
    setStep('games');
    setSelectedGameCount(null);
  };

  if (step === 'games') {
    return (
      <div className="min-h-screen bg-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <h2 className="text-5xl font-bold text-emerald-400 mb-12">
            How many games do you want to play?
          </h2>
          <div className="grid grid-cols-2 gap-6">
            {gameOptions.map(num => (
              <button
                key={num}
                onClick={() => handleGameCountSelect(num)}
                className="px-12 py-8 bg-slate-700 hover:bg-slate-600 text-white text-4xl font-bold rounded-xl shadow-xl transform transition hover:scale-105"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Timer selection step (only for multiplayer)
  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center p-4">
      <div className="text-center max-w-4xl w-full">
        <button
          onClick={handleBack}
          className="mb-6 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white text-lg font-bold rounded-xl transition"
        >
          ← Back
        </button>
        
        <h2 className="text-5xl font-bold text-emerald-400 mb-4">
          Select Round Timer
        </h2>
        <p className="text-gray-300 text-xl mb-8">
          Playing {selectedGameCount} games - How much time per round?
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {timerOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedDuration(option.value)}
              className={`p-8 rounded-xl font-bold text-xl transition transform hover:scale-105 ${
                selectedDuration === option.value
                  ? 'bg-emerald-500 text-white shadow-xl ring-4 ring-emerald-300'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              <div className="text-5xl mb-3">{option.icon}</div>
              <div className="text-2xl mb-2">{option.label}</div>
              <div className="text-sm opacity-80">{option.description}</div>
            </button>
          ))}
        </div>

        <button
          onClick={handleTimerSelect}
          className="w-full max-w-md mx-auto block px-8 py-5 bg-emerald-500 hover:bg-emerald-600 text-white text-3xl font-bold rounded-xl shadow-xl transform transition hover:scale-105"
        >
          Create Room →
        </button>
      </div>
    </div>
  );
}