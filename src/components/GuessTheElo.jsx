import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js'; 
import io from 'socket.io-client';
import { StartScreen } from './StartScreen'; 
import { ChessBoardDisplay } from './ChessBoard'; 
import { GameOptionsSelector } from './GameOptionsSelector'; 
import { LoadingScreen } from './LoadingScreen'; 
import { FinalResultsScreen } from './Results';
import { MultiplayerLobby } from './MultiplayerLobby';
import { RoomSetup } from './RoomSetup';
import { Leaderboard } from './Leaderboard';

// WebSocket connection
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const IS_DEV = import.meta.env.VITE_ENV === 'development';


if (IS_DEV) {
  console.log('🔧 Development Mode');
  console.log('API URL:', API_URL);
  console.log('Socket URL:', SOCKET_URL);
}

export default function GuessTheElo() {
  const [gameState, setGameState] = useState('title');
  const [gameMode, setGameMode] = useState('single');
  const [totalGames, setTotalGames] = useState(0);
  const [currentGameNum, setCurrentGameNum] = useState(0);
  const [currentGame, setCurrentGame] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [preloadedGames, setPreloadedGames] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [roundDuration, setRoundDuration] = useState(60);
  const [roundStarted, setRoundStarted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [roomPlayers, setRoomPlayers] = useState([]);
  
  // WebSocket ref
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;
  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [moves, setMoves] = useState([]);
  const [guess, setGuess] = useState('');
  const [scores, setScores] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (gameMode === 'multiplayer') {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      const socket = socketRef.current;

      socket.on('connected', (data) => {
        console.log('✅ Connected to server:', data);
      });

      socket.on('error', (data) => {
        console.error('❌ Socket error:', data);
        // Only show alert for unexpected errors
        if (data.message !== 'Only host can start the game' || isHost) {
          alert('Error: ' + data.message);
        }
      });

      socket.on('player_joined', (data) => {
        console.log('👤 Player joined:', data);
        if (data.players) {
          setRoomPlayers(data.players);
        }
      });

      socket.on('joined_room', (data) => {
        console.log('✅ Successfully joined room:', data);
        if (data.players) {
          setRoomPlayers(data.players);
        }
      });

      socket.on('game_started', (data) => {
        console.log('🎮 Game started');
        setRoundStarted(true);
        setRoundDuration(data.roundDuration);
        setCurrentGameNum(1);
        startClientTimer(data.roundStartTime, data.roundDuration);
        setGameState('playing');
      });

      socket.on('round_started', (data) => {
        console.log('🔄 Round started:', data.currentRound);
        setCurrentGameNum(data.currentRound + 1);
        setRoundStarted(true);
        startClientTimer(data.roundStartTime, data.roundDuration);
        setShowAnswer(false);
        setHasSubmitted(false);
      });

      socket.on('leaderboard_update', (data) => {
        console.log('📊 Leaderboard updated:', data);
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
        
        // Debug logging
        if (data.roundReset) {
          console.log('✅ Round reset - submissions cleared');
        }
        if (data.gameStart) {
          console.log('✅ Game start - scores reset');
        }
        if (data.playerSubmitted) {
          console.log(`✅ ${data.playerSubmitted} submitted their guess`);
        }
      });

      socket.on('all_submitted', () => {
        console.log('✅ All players submitted');
        if (!showAnswer) {
          setShowAnswer(true);
        }
      });

      socket.on('time_up', (data) => {
        console.log('⏰ Time is up!', data);
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
        if (!showAnswer) {
          setShowAnswer(true);
        }
      });

      socket.on('game_over', (data) => {
        console.log('🏁 Game over:', data);
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
        setGameState('final');
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [gameMode]);

  useEffect(() => {
    if (gameState === 'playing' && 
        gameMode === 'multiplayer' && 
        preloadedGames.length > 0 && 
        currentGameNum > 0) {
      
      const gameIndex = currentGameNum - 1;
      console.log(`🎯 Loading game ${currentGameNum} (index ${gameIndex})`);
      
      if (preloadedGames[gameIndex]) {
        loadMultiplayerGame(preloadedGames[gameIndex]);
      } else {
        console.error('❌ Game not found at index:', gameIndex);
      }
    }
  }, [gameState, currentGameNum, preloadedGames, gameMode]);

  // Client-side timer (synced with server)
  const startClientTimer = (startTime, duration) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const updateTimer = () => {
      const elapsed = (Date.now() / 1000) - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setTimeRemaining(Math.ceil(remaining));

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        if (!showAnswer) {
          setShowAnswer(true);
        }
      }
    };

    // Update immediately
    updateTimer();
    
    // Then update every 100ms for smooth countdown
    timerRef.current = setInterval(updateTimer, 100);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setGameState('lobby');
      setGameMode('multiplayer');
    }
  }, []);

  // Auto-play effect
  useEffect(() => {
    if (isAutoPlaying && currentMoveIndex < moves.length) {
      const timer = setTimeout(() => {
        playNextMove();
      }, 500);
      return () => clearTimeout(timer);
    } else if (isAutoPlaying && currentMoveIndex >= moves.length) {
      setIsAutoPlaying(false);
    }
  }, [isAutoPlaying, currentMoveIndex, moves.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (gameState !== 'playing' || isAutoPlaying) return;
      if (event.key === 'ArrowRight') {
        playNextMove();
      } else if (event.key === 'ArrowLeft') {
        playPrevMove();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isAutoPlaying, currentMoveIndex, moves]);

  const parseMoves = (movesString) => {
    let cleaned = movesString.replace(/\{[^}]*\}/g, '').replace(/\[[^\]]*\]/g, '');
    cleaned = cleaned.replace(/\s*(1-0|0-1|1\/2-1\/2)\s*$/g, '');
    cleaned = cleaned.replace(/\d+\.\.\./g, '');
    const movePattern = /\d+\.\s*([^\s]+)(?:\s+([^\s]+))?/g;
    const allMoves = [];
    let match;
    while ((match = movePattern.exec(cleaned)) !== null) {
      if (match[1]) {
        let whiteMove = match[1].replace(/[?!]+$/g, '').trim();
        if (whiteMove && whiteMove !== '1-0' && whiteMove !== '0-1' && whiteMove !== '1/2-1/2') {
          allMoves.push(whiteMove);
        }
      }
      if (match[2]) {
        let blackMove = match[2].replace(/[?!]+$/g, '').trim();
        if (blackMove && blackMove !== '1-0' && blackMove !== '0-1' && blackMove !== '1/2-1/2') {
          allMoves.push(blackMove);
        }
      }
    }
    return allMoves;
  };

  const loadGame = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/random-game`);
      const data = await response.json();
      if (data.error) {
        alert('Error loading game: ' + data.error);
        setIsLoading(false);
        return;
      }
      chessGame.reset();
      const movesArray = parseMoves(data.game.Moves);
      setCurrentGame(data);
      setChessPosition(chessGame.fen());
      setMoves(movesArray);
      setCurrentMoveIndex(0);
      setGuess('');
      setShowAnswer(false);
      setHasSubmitted(false);
    } catch (error) {
      alert('Error connecting to server: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMultiplayerGame = (gameData) => {
    if (!gameData?.game?.Moves) {
      console.error('❌ Invalid game data:', gameData);
      return;
    }
    
    try {
      chessGame.reset();
      const movesArray = parseMoves(gameData.game.Moves);
      setCurrentGame(gameData);
      setChessPosition(chessGame.fen());
      setMoves(movesArray);
      setCurrentMoveIndex(0);
      setGuess('');
      setShowAnswer(false);
      setHasSubmitted(false);
      setRoundStarted(false);
      console.log('✅ Game loaded successfully');
    } catch (error) {
      console.error('❌ Error loading game:', error);
    }
  };

  const startSinglePlayerGame = async (numGames) => {
    setTotalGames(numGames);
    setCurrentGameNum(1);
    setScores([]);
    setGameState('playing');
    await loadGame();
  };

  const createRoom = async (name) => {
    setPlayerName(name);
    setIsHost(true);
    setGameState('select');
  };

  const startMultiplayerAsHost = async (numGames, timerDuration = 60) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          numGames, 
          playerName,
          roundDuration: timerDuration
        })
      });
      const data = await response.json();
      if (data.error) {
        alert('Error creating room: ' + data.error);
        setIsLoading(false);
        return;
      }
      setRoomCode(data.roomCode);
      setPreloadedGames(data.games);
      setTotalGames(numGames);
      setRoundDuration(data.roundDuration);
      setRoomPlayers(data.players || [playerName]);  // UPDATE: Set initial players
      
      // Join the WebSocket room
      if (socketRef.current) {
        socketRef.current.emit('join_room', {
          roomCode: data.roomCode,
          playerName
        });
      }
      
      setGameState('roomSetup');
    } catch (error) {
      alert('Error creating room: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async (code, name) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/join-room/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: name })
      });
      const data = await response.json();
      if (data.error) {
        alert('Error joining room: ' + data.error);
        setIsLoading(false);
        return;
      }
      setRoomCode(code);
      setPlayerName(name);
      setPreloadedGames(data.games);
      setTotalGames(data.numGames);
      setRoundDuration(data.roundDuration);
      setRoomPlayers(data.players || []);  // UPDATE: Set initial players
      setScores([]);
      
      // Join the WebSocket room
      if (socketRef.current) {
        socketRef.current.emit('join_room', {
          roomCode: code,
          playerName: name
        });
      }
      
      setGameState('roomSetup');
    } catch (error) {
      alert('Error joining room: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startMultiplayerGame = async () => {
    if (socketRef.current) {
      socketRef.current.emit('start_game', {
        roomCode,
        playerName
      });
    }
  };

  const playNextMove = () => {
    if (currentMoveIndex >= moves.length) {
      setIsAutoPlaying(false);
      return;
    }
    try {
      const move = chessGame.move(moves[currentMoveIndex]);
      if (move) {
        setCurrentMoveIndex(currentMoveIndex + 1);
        setChessPosition(chessGame.fen());
      } else {
        setIsAutoPlaying(false);
      }
    } catch (e) {
      console.error('Invalid move:', moves[currentMoveIndex], e);
      setIsAutoPlaying(false);
    }
  };

  const playPrevMove = () => {
    if (currentMoveIndex > 0) {
      chessGame.reset();
      const newIndex = currentMoveIndex - 1;
      for (let i = 0; i < newIndex; i++) {
        try {
          chessGame.move(moves[i]);
        } catch (e) {
          console.error('Error replaying move:', moves[i], e);
        }
      }
      setCurrentMoveIndex(newIndex);
      setChessPosition(chessGame.fen());
    }
  };

  const handleNavigation = (action) => {
    setIsAutoPlaying(false);
    if (action === 'start') {
      chessGame.reset();
      setChessPosition(chessGame.fen());
      setCurrentMoveIndex(0);
    } else if (action === 'prev') {
      playPrevMove();
    } else if (action === 'next') {
      playNextMove();
    } else if (action === 'end') {
      chessGame.reset();
      moves.forEach((move) => {
        try {
          chessGame.move(move);
        } catch (e) {
          console.error('Error replaying move:', move, e);
        }
      });
      setChessPosition(chessGame.fen());
      setCurrentMoveIndex(moves.length);
    } else if (action === 'toggle-auto') {
      setIsAutoPlaying(!isAutoPlaying);
    }
  };

  const submitGuess = async () => {
    if (hasSubmitted) return;
    
    if (!guess || isNaN(guess)) {
      alert('Please enter a valid Elo rating');
      return;
    }
    const guessedElo = parseInt(guess);
    const actualElo = currentGame.averageElo;

    try {
      if (gameMode === 'single') {
        const response = await fetch(`${API_URL}/api/calculate-score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actualElo, guessedElo })
        });
        const data = await response.json();
        setScores([...scores, {
          gameNum: currentGameNum,
          score: data.score,
          difference: data.difference,
          actualElo,
          guessedElo,
          white: currentGame.game.White,
          black: currentGame.game.Black,
          whiteElo: currentGame.whiteElo,
          blackElo: currentGame.blackElo
        }]);
        setShowAnswer(true);
      } else {
        // Multiplayer - use WebSocket
        if (socketRef.current) {
          socketRef.current.emit('submit_guess', {
            roomCode,
            playerName,
            gameIndex: currentGameNum - 1,
            guessedElo
          });
          
          // Store locally as well
          const scoreData = calculateScoreLocal(actualElo, guessedElo);
          setScores([...scores, {
            gameNum: currentGameNum,
            score: scoreData.score,
            difference: scoreData.difference,
            actualElo,
            guessedElo,
            white: currentGame.game.White,
            black: currentGame.game.Black,
            whiteElo: currentGame.whiteElo,
            blackElo: currentGame.blackElo
          }]);
          setHasSubmitted(true);
        }
      }
    } catch (error) {
      alert('Error calculating score: ' + error.message);
    }
  };

  const calculateScoreLocal = (actual_elo, guessed_elo) => {
    const difference = Math.abs(actual_elo - guessed_elo);
    let score;
    
    if (difference === 0) {
      score = 1000;
    } else if (difference <= 50) {
      score = 1000 - (difference * 4);
    } else if (difference <= 100) {
      score = 800 - ((difference - 50) * 4);
    } else if (difference <= 200) {
      score = 600 - ((difference - 100) * 2);
    } else if (difference <= 500) {
      score = 400 - ((difference - 200) * 0.67);
    } else {
      score = Math.max(0, 200 - ((difference - 500) * 0.2));
    }
    
    return { score: Math.max(0, Math.floor(score)), difference };
  };

  const nextGame = async () => {
    if (currentGameNum < totalGames) {
      if (gameMode === 'single') {
        setCurrentGameNum(currentGameNum + 1);
        setGameState('playing');
        await loadGame();
      } else {
        // Multiplayer - use WebSocket
        if (socketRef.current) {
          socketRef.current.emit('next_round', {
            roomCode
          });
        }
      }
    } else {
      setGameState('final');
    }
  };

  const restart = () => {
    setGameState('title');
    setGameMode('single');
    setTotalGames(0);
    setCurrentGameNum(0);
    setScores([]);
    setRoomCode('');
    setPlayerName('');
    setPreloadedGames([]);
    setLeaderboard([]);
    setRoomPlayers([]);  // NEW: Clear room players
    setIsHost(false);
    chessGame.reset();
    setChessPosition(chessGame.fen());
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.emit('leave_room', {
        roomCode,
        playerName
      });
    }
  };

  const selectMode = (mode) => {
    setGameMode(mode);
    if (mode === 'single') {
      setGameState('select');
    } else {
      setGameState('lobby');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <LoadingScreen />;
  }
  
  // State routing
  if (gameState === 'title') {
    return <StartScreen onSelectMode={selectMode} />;
  }

  if (gameState === 'lobby') {
    return (
      <MultiplayerLobby
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
      />
    );
  }

  if (gameState === 'select') {
    return (
      <GameOptionsSelector
        onSelect={gameMode === 'single' ? startSinglePlayerGame : startMultiplayerAsHost}
        showTimer={gameMode === 'multiplayer'}
      />
    );
  }

  if (gameState === 'roomSetup') {
    return (
      <RoomSetup
        roomCode={roomCode}
        playerName={playerName}
        isHost={isHost}
        socket={socketRef.current}           // NEW: Pass socket
        initialPlayers={roomPlayers}         // NEW: Pass initial players
        onStartGame={startMultiplayerGame}
      />
    );
  }



  if (gameState === 'playing' && currentGame) {
    return (
      <div className="min-h-screen bg-slate-800 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-emerald-400 mb-3">GUESS THE ELO</h1>
            <p className="text-2xl text-gray-300">
              Game {currentGameNum} of {totalGames}
              {gameMode === 'multiplayer' && roomCode && (
                <span className="ml-4 text-blue-400">Room: {roomCode}</span>
              )}
            </p>
            {gameMode === 'multiplayer' && !showAnswer && (
              <div className="mt-4">
                <div className={`inline-block px-6 py-3 rounded-xl text-2xl font-bold ${
                  timeRemaining <= 10 ? 'bg-red-600 animate-pulse' : 'bg-slate-700'
                }`}>
                  ⏱️ Time Remaining: {formatTime(timeRemaining)}
                </div>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            <div className="flex flex-col">
              <div className="bg-slate-700 p-6 rounded-xl mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white font-bold text-xl">{currentGame?.game.White}</span>
                  <span className="text-gray-400 text-lg">vs</span>
                  <span className="text-white font-bold text-xl">{currentGame?.game.Black}</span>
                </div>
                <div className="text-base text-gray-300 space-y-1">
                  <p>Result: {currentGame?.game.Result}</p>
                  <p>Opening: {currentGame?.game.Opening}</p>
                  <p>Time Control: {currentGame?.game.TimeControl}</p>
                </div>
              </div>
              <ChessBoardDisplay
                position={chessPosition}
                moves={moves}
                currentMoveIndex={currentMoveIndex}
                onNavigate={handleNavigation}
              />
            </div>

            <div className="flex flex-col justify-center">
              {gameMode === 'multiplayer' && leaderboard.length > 0 && (
                <Leaderboard leaderboard={leaderboard} currentPlayer={playerName} />
              )}

              {!showAnswer ? (
                <div className="bg-slate-700 p-10 rounded-xl">
                  <h3 className="text-3xl font-bold text-emerald-400 mb-6">
                    What's the average Elo?
                  </h3>
                  <p className="text-gray-300 mb-6 text-lg">
                    Watch the game and estimate the average rating of both players
                  </p>
                  <input
                    type="number"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Enter Elo (e.g., 2500)"
                    className="w-full px-6 py-4 text-2xl bg-slate-600 text-white rounded-xl mb-6 focus:outline-none focus:ring-4 focus:ring-emerald-500"
                    onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
                    disabled={hasSubmitted}
                  />
                  <button
                    onClick={submitGuess}
                    disabled={hasSubmitted}
                    className={`w-full px-8 py-4 text-2xl font-bold rounded-xl shadow-xl transform transition ${
                      hasSubmitted 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105'
                    }`}
                  >
                    {hasSubmitted ? 'Submitted - Waiting for others...' : 'Submit Guess'}
                  </button>
                  {gameMode === 'multiplayer' && hasSubmitted && (
                    <p className="text-center text-gray-400 mt-4">
                      Waiting for other players or timer to end...
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-slate-700 p-10 rounded-xl">
                  <h3 className="text-3xl font-bold text-emerald-400 mb-6">Results</h3>
                  <div className="space-y-4 text-lg text-gray-300 mb-8">
                    <div className="bg-slate-600 p-4 rounded-xl">
                      <p className="text-sm text-gray-400 mb-1">White</p>
                      <p className="text-xl">
                        <span className="text-white font-bold">{currentGame?.game.White}</span>: {currentGame?.whiteElo}
                      </p>
                    </div>
                    <div className="bg-slate-600 p-4 rounded-xl">
                      <p className="text-sm text-gray-400 mb-1">Black</p>
                      <p className="text-xl">
                        <span className="text-white font-bold">{currentGame?.game.Black}</span>: {currentGame?.blackElo}
                      </p>
                    </div>
                    <div className="bg-emerald-900 p-4 rounded-xl">
                      <p className="text-2xl text-emerald-400 font-bold">
                        Average Elo: {Math.round(currentGame?.averageElo)}
                      </p>
                    </div>
                    {scores.length > 0 && scores[scores.length - 1].gameNum === currentGameNum && (
                      <>
                        <div className="bg-slate-600 p-4 rounded-xl">
                          <p className="text-xl">Your guess: <span className="font-bold">{scores[scores.length - 1].guessedElo}</span></p>
                          <p className="text-xl">Difference: <span className="font-bold">{scores[scores.length - 1].difference}</span></p>
                        </div>
                        <div className="bg-emerald-800 p-5 rounded-xl">
                          <p className="text-3xl text-emerald-300 font-bold">
                            Score: +{scores[scores.length - 1].score}
                          </p>
                        </div>
                      </>
                    )}
                    {!scores.find(s => s.gameNum === currentGameNum) && (
                      <div className="bg-red-900 p-5 rounded-xl">
                        <p className="text-xl text-red-300">
                          Time's up! No guess submitted.
                        </p>
                        <p className="text-3xl text-red-300 font-bold mt-2">
                          Score: 0
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={nextGame}
                    className="w-full px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-2xl font-bold rounded-xl shadow-xl transform transition hover:scale-105"
                  >
                    {currentGameNum < totalGames ? 'Next Game →' : 'See Final Score'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'final') {
    return (
      <FinalResultsScreen
        scores={scores}
        onRestart={restart}
        isMultiplayer={gameMode === 'multiplayer'}
        leaderboard={leaderboard}
        playerName={playerName}
      />
    );
  }

  return null;
}