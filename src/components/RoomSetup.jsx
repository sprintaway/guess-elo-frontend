import React, { useState, useEffect } from 'react';

export function RoomSetup({ roomCode, playerName, onStartGame, isHost = false, socket, initialPlayers = [] }) {
  const [players, setPlayers] = useState(initialPlayers);
  const shareUrl = `${window.location.origin}?room=${roomCode}`;
  
  useEffect(() => {
    if (!socket) return;

    // Listen for player joined events
    const handlePlayerJoined = (data) => {
      console.log('👤 Player joined:', data);
      if (data.players) {
        setPlayers(data.players);
      }
    };

    // Listen for game started event (for non-host players)
    const handleGameStarted = (data) => {
      console.log('🎮 Game started:', data);
      onStartGame();
    };

    // Listen for player left events (optional)
    const handlePlayerLeft = (data) => {
      console.log('👋 Player left:', data);
      if (data.players) {
        setPlayers(data.players);
      }
    };

    // Register event listeners
    socket.on('player_joined', handlePlayerJoined);
    socket.on('game_started', handleGameStarted);
    socket.on('player_left', handlePlayerLeft);

    // Cleanup listeners on unmount
    return () => {
      socket.off('player_joined', handlePlayerJoined);
      socket.off('game_started', handleGameStarted);
      socket.off('player_left', handlePlayerLeft);
    };
  }, [socket, onStartGame]);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Room link copied to clipboard!');
  };

  const handleStartGame = () => {
    // Host starts the game via WebSocket
    if (socket && isHost) {
      socket.emit('start_game', {
        roomCode,
        playerName
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-6xl font-bold text-emerald-400 mb-8">
          {isHost ? 'ROOM CREATED!' : 'JOINED ROOM!'}
        </h1>
        
        <div className="bg-slate-700 p-8 rounded-xl mb-6">
          <p className="text-gray-300 text-xl mb-4">
            {isHost ? 'Share this code with your friends:' : 'Room Code:'}
          </p>
          <div className="text-6xl font-bold text-white mb-6 tracking-widest bg-slate-600 py-6 rounded-xl">
            {roomCode}
          </div>
          
          {isHost && (
            <>
              <button
                onClick={copyToClipboard}
                className="w-full px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold rounded-xl mb-4 transition"
              >
                📋 Copy Room Link
              </button>
              
              <p className="text-gray-400 text-sm mb-4 break-all">{shareUrl}</p>
            </>
          )}

          <div className="mt-6">
            <h3 className="text-2xl font-bold text-emerald-400 mb-4">
              Players in Room ({players.length})
            </h3>
            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={player}
                  className={`flex items-center justify-between p-4 rounded-xl transition ${
                    player === playerName 
                      ? 'bg-emerald-900 border-2 border-emerald-500' 
                      : 'bg-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👤</span>
                    <span className="text-xl text-white font-semibold">{player}</span>
                    {player === playerName && (
                      <span className="text-sm text-emerald-400">(You)</span>
                    )}
                  </div>
                  {index === 0 && (
                    <span className="px-3 py-1 bg-yellow-600 text-white text-sm font-bold rounded-full">
                      HOST
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {players.length === 0 && (
              <div className="text-gray-400 text-lg py-8">
                <p>Waiting for players to join...</p>
              </div>
            )}
          </div>
        </div>

        {isHost ? (
          <>
            <button
              onClick={handleStartGame}
              disabled={players.length < 1}
              className={`w-full px-12 py-6 text-2xl font-bold rounded-xl shadow-xl transform transition ${
                players.length < 1
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105'
              }`}
            >
              Start Game
            </button>
            {players.length < 2 && (
              <p className="text-yellow-400 mt-4 text-lg">
                💡 Tip: You can start solo or wait for more players!
              </p>
            )}
          </>
        ) : (
          <div className="bg-slate-600 p-6 rounded-xl animate-pulse">
            <p className="text-xl text-gray-300">
              ⏳ Waiting for host to start the game...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}