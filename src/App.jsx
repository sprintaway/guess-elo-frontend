import React, { useState, useEffect } from 'react';
import { GameModeSelector } from './components/GameModeSelector';
import GuessTheElo from './components/GuessTheElo';
import GuessTheEval from './components/GuessTheEval';

function App() {
  const [selectedMode, setSelectedMode] = useState(null); // null, 'elo', or 'eval'

  // ESC key to return to mode selector
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedMode) {
        if (window.confirm('Return to game mode selection?')) {
          setSelectedMode(null);
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedMode]);

  // Show mode selector if no mode selected
  if (!selectedMode) {
    return <GameModeSelector onSelectMode={setSelectedMode} />;
  }

  // Render selected game mode
  if (selectedMode === 'elo') {
    return <GuessTheElo onBack={() => setSelectedMode(null)} />;
  }

  if (selectedMode === 'eval') {
    return <GuessTheEval onBack={() => setSelectedMode(null)} />;
  }

  return null;
}

export default App;