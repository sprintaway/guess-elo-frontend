export function StartScreen({ onSelectMode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-emerald-400 mb-4">GUESS THE ELO</h1>
        <p className="text-2xl text-gray-300 mb-12">Watch chess games and guess the average player rating</p>
        <div className="space-y-4">
          <button
            onClick={() => onSelectMode('single')}
            className="w-full px-12 py-6 bg-emerald-500 hover:bg-emerald-600 text-white text-2xl font-bold rounded-xl shadow-xl transform transition hover:scale-105"
          >
            Single Player
          </button>
          <button
            onClick={() => onSelectMode('multiplayer')}
            className="w-full px-12 py-6 bg-blue-500 hover:bg-blue-600 text-white text-2xl font-bold rounded-xl shadow-xl transform transition hover:scale-105"
          >
            Multiplayer
          </button>
        </div>
      </div>
    </div>
  );
}