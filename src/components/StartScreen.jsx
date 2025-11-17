export function StartScreen({ onSelectMode, gameType }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-8">
      <div className="text-center">
        {/* App Logo */}
        <img
          src="/smallnobglogo.png"
          alt="App Logo"
          className="mx-auto mb-6 h-[20vh] sm:h-[25vh] md:h-[30vh] lg:h-[35vh] xl:h-[40vh] object-contain"
        />

        {/* Title / Description */}
        <h1 className="text-5xl sm:text-6xl font-bold text-emerald-400 mb-4">
          {gameType === 'elo' ? 'GUESS THE ELO' : 'GUESS THE EVAL'}
        </h1>
        <p className="text-2xl text-gray-300 mb-12">
          {gameType === 'elo'
            ? 'Watch chess games and guess the average player rating'
            : 'Watch chess games and guess the evaluation of positions'}
        </p>

        {/* Buttons */}
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
