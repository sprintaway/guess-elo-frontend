import React, { useState } from 'react';

export function MultiplayerLobby({ onCreateRoom, onJoinRoom }) {
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    onCreateRoom(playerName.trim());
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!joinCode.trim()) {
      setError('Please enter room code');
      return;
    }
    onJoinRoom(joinCode.trim().toUpperCase(), playerName.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-2xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-emerald-400 mb-6 sm:mb-8 text-center">
          MULTIPLAYER
        </h1>

        {/* Create Room Section */}
        <div className="bg-slate-700 p-5 sm:p-6 md:p-8 rounded-xl mb-5 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Your Name</h3>
          <input
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              setError('');
            }}
            placeholder="Enter your name"
            className="w-full px-4 sm:px-5 py-3 sm:py-4 text-lg sm:text-xl bg-slate-600 text-white rounded-xl mb-5 sm:mb-6 focus:outline-none focus:ring-4 focus:ring-emerald-500"
          />
          <button
            onClick={handleCreate}
            className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-lg sm:text-2xl font-bold rounded-xl shadow-xl transform transition hover:scale-105"
          >
            Create New Room
          </button>
        </div>

        {/* Join Room Section */}
        <div className="bg-slate-700 p-5 sm:p-6 md:p-8 rounded-xl mb-5 sm:mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
            Join Existing Room
          </h3>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value.toUpperCase());
              setError('');
            }}
            placeholder="Enter room code"
            className="w-full px-4 sm:px-5 py-3 sm:py-4 text-lg sm:text-xl bg-slate-600 text-white rounded-xl mb-5 sm:mb-6 focus:outline-none focus:ring-4 focus:ring-blue-500 uppercase"
            maxLength={6}
          />
          <button
            onClick={handleJoin}
            className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-blue-500 hover:bg-blue-600 text-white text-lg sm:text-2xl font-bold rounded-xl shadow-xl transform transition hover:scale-105"
          >
            Join Room
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 sm:p-4 bg-red-500 text-white rounded-xl text-center text-base sm:text-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
