export function FinalResultsScreen({ scores, onRestart, isMultiplayer = false, leaderboard = null, playerName = null, gameType = "elo" }) {
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const avgDifference = scores.length > 0 
    ? scores.reduce((sum, s) => sum + (s.difference || 0), 0) / scores.length 
    : 0;
  
  // Format average difference based on game type
  const formatAvgDifference = () => {
    if (gameType === "eval") {
      return avgDifference.toFixed(2);
    }
    return Math.round(avgDifference);
  };

  // Check if player submitted a guess for this game
  const hasGuess = (score) => {
    if (gameType === "eval") {
      return score.guessedEval !== undefined && score.guessedEval !== null;
    }
    return score.guessedElo !== undefined && score.guessedElo !== null;
  };

  // Format the guess details
  const formatGuessDetails = (score) => {
    if (gameType === "eval") {
      const formatEval = (val) => val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
      return (
        <p>
          Actual: {formatEval(score.actualEval)} | Your Guess: {formatEval(score.guessedEval)} | Diff: {score.difference.toFixed(2)}
        </p>
      );
    }
    return (
      <p>
        Actual: {Math.round(score.actualElo)} | Your Guess: {score.guessedElo} | Diff: {score.difference}
      </p>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold text-emerald-400 mb-8 text-center">FINAL RESULTS</h1>
        
        {isMultiplayer && leaderboard && (
          <div className="bg-slate-700 p-6 rounded-xl mb-6">
            <h3 className="text-2xl font-bold text-emerald-400 mb-4">🏆 Final Standings</h3>
            <div className="space-y-2">
              {leaderboard.map((player, index) => (
                <div
                  key={player.player}
                  className={`flex justify-between items-center p-4 rounded-xl ${
                    player.player === playerName
                      ? 'bg-emerald-900 border-2 border-emerald-500'
                      : 'bg-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-gray-400">#{index + 1}</span>
                    <span className="text-xl text-white font-semibold">{player.player}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-emerald-400">{player.totalScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="bg-slate-700 p-8 rounded-xl mb-6">
          <div className="text-center mb-6">
            <p className="text-3xl text-gray-300 mb-2">Your Total Score</p>
            <p className="text-7xl font-bold text-emerald-400">{totalScore}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-600 p-4 rounded-xl text-center">
              <p className="text-gray-400 mb-1">Games Played</p>
              <p className="text-3xl font-bold text-white">{scores.length}</p>
            </div>
            <div className="bg-slate-600 p-4 rounded-xl text-center">
              <p className="text-gray-400 mb-1">Avg Difference</p>
              <p className="text-3xl font-bold text-white">{formatAvgDifference()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-700 p-6 rounded-xl mb-6">
          <h3 className="text-2xl font-bold text-white mb-4">Game Breakdown</h3>
          <div className="space-y-3">
            {scores.map((score, index) => (
              <div key={index} className="bg-slate-600 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg text-white font-semibold">
                    {gameType === "eval" ? "Position" : "Game"} {score.gameNum || index + 1}
                  </span>
                  <span className="text-xl font-bold text-emerald-400">+{score.score}</span>
                </div>
                <div className="text-sm text-gray-300">
                  {hasGuess(score) ? (
                    formatGuessDetails(score)
                  ) : (
                    <p className="text-red-400">No guess submitted (Time's up)</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <button
          onClick={onRestart}
          className="w-full px-12 py-6 bg-emerald-500 hover:bg-emerald-600 text-white text-2xl font-bold rounded-xl shadow-xl transform transition hover:scale-105"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}