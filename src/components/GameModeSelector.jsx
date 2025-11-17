import React from 'react';

export function GameModeSelector({ onSelectMode }) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-4xl">
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold text-emerald-400 mb-4 drop-shadow-lg">
          CHESS GAMES
        </h1>
        <p className="text-xl sm:text-2xl text-gray-300 mb-12">
          Choose your game mode
        </p>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Guess The Elo */}
          <button
            onClick={() => onSelectMode('elo')}
            className="group relative bg-slate-800 hover:bg-slate-700 p-8 sm:p-12 rounded-2xl shadow-2xl transform transition hover:scale-105 hover:shadow-emerald-500/50 border-2 border-slate-700 hover:border-emerald-500"
          >
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 group-hover:text-emerald-400 transition">
              Guess The Elo
            </h2>
            <p className="text-gray-400 text-base sm:text-lg mb-4">
              Watch chess games and guess the players' rating
            </p>
            <div className="text-sm text-gray-500">
              • Single Player & Multiplayer<br/>
              • Guess average Elo rating<br/>
              • Score based on accuracy
            </div>
          </button>

          {/* Guess The Eval */}
          <button
            onClick={() => onSelectMode('eval')}
            className="group relative bg-slate-800 hover:bg-slate-700 p-8 sm:p-12 rounded-2xl shadow-2xl transform transition hover:scale-105 hover:shadow-blue-500/50 border-2 border-slate-700 hover:border-blue-500"
          >
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 group-hover:text-blue-400 transition">
              Guess The Eval
            </h2>
            <p className="text-gray-400 text-base sm:text-lg mb-4">
              Analyze positions and guess the engine evaluation
            </p>
            <div className="text-sm text-gray-500">
              • Single Player & Multiplayer<br/>
              • Guess position evaluation<br/>
              • Test your chess understanding
            </div>
          </button>
        </div>

        <div className="mt-12 text-gray-500 text-sm">
          Press ESC to return to this menu
        </div>
      </div>
    </div>
  );
}