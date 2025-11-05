export function Leaderboard({ leaderboard, currentPlayer }) {
  return (
    <div className="bg-slate-700 p-6 rounded-xl mb-6">
      <h3 className="text-2xl font-bold text-emerald-400 mb-4">🏆 Leaderboard</h3>
      <div className="space-y-2">
        {leaderboard.map((player, index) => (
          <div
            key={player.player}
            className={`flex justify-between items-center p-3 rounded-xl ${
              player.player === currentPlayer
                ? 'bg-emerald-900 border-2 border-emerald-500'
                : 'bg-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
              <div>
                <span className="text-lg text-white font-semibold block">{player.player}</span>
                <span className={`text-sm ${
                  player.currentRoundSubmitted ? 'text-emerald-400' : 'text-yellow-400'
                }`}>
                  {player.currentRoundSubmitted ? '✓ Submitted' : '⏳ Pending'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-emerald-400">{player.totalScore}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}