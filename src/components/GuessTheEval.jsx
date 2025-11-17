import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import io from 'socket.io-client';
import { Chessboard } from 'react-chessboard';
import { StartScreen } from './StartScreen';
import { GameOptionsSelector } from './GameOptionsSelector';
import { LoadingScreen } from './LoadingScreen';
import { FinalResultsScreen } from './Results';
import { MultiplayerLobby } from './MultiplayerLobby';
import { RoomSetup } from './RoomSetup';
import { Leaderboard } from './Leaderboard';
import { MultiplayerChat } from './MultiplayerChat';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function GuessTheEval({ onBack }) {
  // Similar state structure to GuessTheElo
  const [gameState, setGameState] = useState('title');
  const [gameMode, setGameMode] = useState('single');
  const [totalGames, setTotalGames] = useState(0);
  const [currentGameNum, setCurrentGameNum] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [preloadedPositions, setPreloadedPositions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [roundDuration, setRoundDuration] = useState(60);
  const [isHost, setIsHost] = useState(false);
  const [roomPlayers, setRoomPlayers] = useState([]);
  
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const timerSoundRef = useRef(new Audio('/sounds/mixkit-alarm-tone-996.wav'));
  
  const [guess, setGuess] = useState('');
  const [scores, setScores] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Key difference: We display a static position, not move through it
  const [displayFen, setDisplayFen] = useState('');
  const [sideToMove, setSideToMove] = useState('white');
  const [castlingRights, setCastlingRights] = useState('');

  const [stockfishEngine, setStockfishEngine] = useState(null);
  const [stockfishEval, setStockfishEval] = useState(null);
  const [stockfishLoading, setStockfishLoading] = useState(false);
  const [bestMove, setBestMove] = useState(null);
  const [stockfishRawEval, setStockfishRawEval] = useState(null);

  // WebSocket setup
  useEffect(() => {
    if (gameMode === 'multiplayer') {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      const socket = socketRef.current;

      socket.on('connected', (data) => console.log('✅ Connected:', data));
      
      socket.on('error', (data) => {
        console.error('❌ Error:', data);
        // Only show alert for unexpected errors
        if (data.message !== 'Only host can start the game' || isHost) {
          alert('Error: ' + data.message);
        }
      });
      
      socket.on('player_joined', (data) => {
        console.log('👤 Player joined:', data);
        if (data.players) setRoomPlayers(data.players);
      });
      
      socket.on('joined_room', (data) => {
        console.log('✅ Successfully joined room:', data);
        if (data.players) {
          setRoomPlayers(data.players);
        }
      });
      
      socket.on('game_started', (data) => {
        console.log('🎮 Game started');
        setRoundDuration(data.roundDuration);
        setCurrentGameNum(1);
        startClientTimer(data.roundStartTime, data.roundDuration);
        setGameState('playing');
      });
      
      socket.on('round_started', (data) => {
        console.log('🔄 Round started:', data.currentRound);
        setCurrentGameNum(data.currentRound + 1);
        startClientTimer(data.roundStartTime, data.roundDuration);
        setShowAnswer(false);
        setHasSubmitted(false);
      });
      
      socket.on('leaderboard_update', (data) => {
        console.log('📊 Leaderboard updated:', data);
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
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
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (!showAnswer) {
          setShowAnswer(true);
        }
      });
      
      socket.on('game_over', (data) => {
        console.log('🏁 Game over:', data);
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        setGameState('final');
      });

      return () => socket.disconnect();
    }
  }, [gameMode]);

  // Timer sound
  useEffect(() => {
    if (gameMode === 'multiplayer' && !showAnswer && timeRemaining === 20) {
      timerSoundRef.current.currentTime = 0;
      timerSoundRef.current.volume = 0.5;
      timerSoundRef.current.play().catch(err => console.log('Audio failed:', err));
    }
  }, [timeRemaining, showAnswer, gameMode]);

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

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Check URL for room code parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setGameState('lobby');
      setGameMode('multiplayer');
    }
  }, []);

  // Load single player position
  const loadPosition = async () => {
    setIsLoading(true);
    try {
        const response = await fetch(`${API_URL}/api/random-eval`);
        const data = await response.json();
        
        console.log('=== API Response ===');
        console.log('Full data:', data);
        console.log('FEN:', data.fen);
        
        if (data.error) {
        alert('Error loading position: ' + data.error);
        return;
        }

        // Parse FEN to get position details
        const chess = new Chess(data.fen);
        setCurrentPosition(data);
        setDisplayFen(data.fen);
        setSideToMove(chess.turn() === 'w' ? 'White' : 'Black');
        
        // Get castling rights from FEN
        const fen_parts = data.fen.split(' ');
        console.log('FEN parts:', fen_parts);
        console.log('Castling rights (index 2):', fen_parts[2]);
        
        const castling = fen_parts[2] || '-';
        
        // Format castling rights for display
        let castlingDisplay = castling;
        if (castling === '-') {
        castlingDisplay = 'Neither side can castle';
        } else {
        // Make it human-readable
        const hasWhiteKing = castling.includes('K');
        const hasWhiteQueen = castling.includes('Q');
        const hasBlackKing = castling.includes('k');
        const hasBlackQueen = castling.includes('q');
        
        console.log('White castling:', hasWhiteKing || hasWhiteQueen ? 'Yes' : 'No');
        console.log('Black castling:', hasBlackKing || hasBlackQueen ? 'Yes' : 'No');
        
        const parts = [];
        
        // White's castling status
        if (hasWhiteKing && hasWhiteQueen) {
            parts.push('White can castle both sides');
        } else if (hasWhiteKing) {
            parts.push('White can castle kingside');
        } else if (hasWhiteQueen) {
            parts.push('White can castle queenside');
        } else {
            parts.push('White has lost castling rights');
        }
        
        // Black's castling status
        if (hasBlackKing && hasBlackQueen) {
            parts.push('Black can castle both sides');
        } else if (hasBlackKing) {
            parts.push('Black can castle kingside');
        } else if (hasBlackQueen) {
            parts.push('Black can castle queenside');
        } else {
            parts.push('Black has lost castling rights');
        }
        
        castlingDisplay = parts.join('; ');
        }
        
        console.log('Final castling display:', castlingDisplay);
        setCastlingRights(castlingDisplay);
        
        setGuess('');
        setShowAnswer(false);
        setHasSubmitted(false);
    } catch (error) {
        console.error('Error loading position:', error);
        alert('Error: ' + error.message);
    } finally {
        setIsLoading(false);
    }
  };

  // Load multiplayer position
  const loadMultiplayerPosition = (positionData) => {
    if (!positionData?.fen) {
      console.error('❌ Invalid position data:', positionData);
      return;
    }
    
    try {
      const chess = new Chess(positionData.fen);
      setCurrentPosition(positionData);
      setDisplayFen(positionData.fen);
      setSideToMove(chess.turn() === 'w' ? 'White' : 'Black');
      
      // Get castling rights from FEN
      const fen_parts = positionData.fen.split(' ');
      const castling = fen_parts[2] || '-';
      
      // Format castling rights for display
      let castlingDisplay = castling;
      if (castling === '-') {
        castlingDisplay = 'Neither side can castle';
      } else {
        const hasWhiteKing = castling.includes('K');
        const hasWhiteQueen = castling.includes('Q');
        const hasBlackKing = castling.includes('k');
        const hasBlackQueen = castling.includes('q');
        
        const parts = [];
        
        if (hasWhiteKing && hasWhiteQueen) {
          parts.push('White can castle both sides');
        } else if (hasWhiteKing) {
          parts.push('White can castle kingside');
        } else if (hasWhiteQueen) {
          parts.push('White can castle queenside');
        } else {
          parts.push('White has lost castling rights');
        }
        
        if (hasBlackKing && hasBlackQueen) {
          parts.push('Black can castle both sides');
        } else if (hasBlackKing) {
          parts.push('Black can castle kingside');
        } else if (hasBlackQueen) {
          parts.push('Black can castle queenside');
        } else {
          parts.push('Black has lost castling rights');
        }
        
        castlingDisplay = parts.join('; ');
      }
      
      setCastlingRights(castlingDisplay);
      setGuess('');
      setShowAnswer(false);
      setHasSubmitted(false);
      console.log('✅ Position loaded successfully');
    } catch (error) {
      console.error('❌ Error loading position:', error);
    }
  };

  // Effect to load multiplayer positions when game starts
  useEffect(() => {
    if (gameState === 'playing' && 
        gameMode === 'multiplayer' && 
        preloadedPositions.length > 0 && 
        currentGameNum > 0) {
      
      const positionIndex = currentGameNum - 1;
      console.log(`🎯 Loading position ${currentGameNum} (index ${positionIndex})`);
      
      if (preloadedPositions[positionIndex]) {
        loadMultiplayerPosition(preloadedPositions[positionIndex]);
      } else {
        console.error('❌ Position not found at index:', positionIndex);
      }
    }
  }, [gameState, currentGameNum, preloadedPositions, gameMode]);

  useEffect(() => {
    // Initialize Stockfish engine once
    if (!stockfishEngine) {
      const engine = new Worker('/stockfish/stockfish-17.1-8e4d048.js');

      engine.onmessage = (event) => {
        console.log('Worker message:', event.data); // catch everything
      };
      
      setStockfishEngine(engine);
    }
    
    return () => {
      if (stockfishEngine) {
        stockfishEngine.terminate();
      }
    };
  }, []);

  useEffect(() => {
    if (showAnswer && currentPosition && stockfishEngine) {
      analyzePosition(currentPosition.fen);
    }
  }, [showAnswer, currentPosition, stockfishEngine]);

  const analyzePosition = (fen) => {
    if (!stockfishEngine) return;
    
    setStockfishLoading(true);
    setStockfishEval(null);
    setBestMove(null);
    
    // Send commands to Stockfish
    stockfishEngine.postMessage('uci');
    stockfishEngine.postMessage('ucinewgame');
    stockfishEngine.postMessage(`position fen ${fen}`);
    stockfishEngine.postMessage('go depth 20'); // Analyze to depth 20
  };

  const getAdjustedStockfishEval = () => {
    if (stockfishRawEval === null) return null;
    
    // Stockfish always evaluates from White's perspective
    // If Black to move, flip it to match the database format
    if (sideToMove === 'Black') {
      return -stockfishRawEval;
    }
    
    return stockfishRawEval;
  };

  const uciToSAN = (uciMove, fen) => {
    if (!uciMove) return null;
    
    try {
      // Create a temporary chess instance with the current position
      const tempChess = new Chess(fen);
      
      // Extract from/to squares from UCI format (e.g., "e2e4" -> from: "e2", to: "e4")
      const from = uciMove.substring(0, 2);
      const to = uciMove.substring(2, 4);
      const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
      
      // Make the move and get SAN notation
      const move = tempChess.move({
        from: from,
        to: to,
        promotion: promotion
      });
      
      return move ? move.san : uciMove; // Fallback to UCI if conversion fails
    } catch (error) {
      console.error('Error converting UCI to SAN:', error);
      return uciMove; // Return UCI format as fallback
    }
  };

  const formatStockfishEval = (evalValue) => {
    if (evalValue === null) return '...';
    if (evalValue >= 10) return 'Mate';
    if (evalValue <= -10) return '-Mate';
    return evalValue > 0 ? `+${evalValue.toFixed(2)}` : evalValue.toFixed(2);
  };

  // Start single player game
  const startSinglePlayerGame = async (numGames) => {
    setTotalGames(numGames);
    setCurrentGameNum(1);
    setScores([]);
    setGameState('playing');
    await loadPosition();
  };

  const createRoom = async (name) => {
    setPlayerName(name);
    setIsHost(true);
    setGameState('select');
  };

  const startMultiplayerAsHost = async (numGames, timerDuration = 60) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/create-eval-room`, {
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
      setPreloadedPositions(data.positions);
      setTotalGames(numGames);
      setRoundDuration(data.roundDuration);
      setRoomPlayers(data.players || [playerName]);
      
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
      setPreloadedPositions(data.positions);
      setTotalGames(data.numGames);
      setRoundDuration(data.roundDuration);
      setRoomPlayers(data.players || []);
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

  // Submit guess
  const submitGuess = async () => {
    if (hasSubmitted) return;
    
    if (!guess || isNaN(guess)) {
      alert('Please enter a valid evaluation (e.g., +1.5, -2.3)');
      return;
    }

    const guessedEval = parseFloat(guess);
    const actualEval = currentPosition.eval;

    try {
      if (gameMode === 'single') {
        const response = await fetch(`${API_URL}/api/calculate-eval-score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actualEval, guessedEval })
        });
        const data = await response.json();
        
        setScores([...scores, {
          gameNum: currentGameNum,
          score: data.score,
          difference: data.difference,
          actualEval,
          guessedEval,
          fen: currentPosition.fen
        }]);
        setShowAnswer(true);
      } else {
        // Multiplayer logic
        if (socketRef.current) {
          socketRef.current.emit('submit_guess', {
            roomCode,
            playerName,
            gameIndex: currentGameNum - 1,
            guessedEval
          });
          
          // Store locally as well
          const scoreData = calculateScoreLocal(actualEval, guessedEval);
          setScores([...scores, {
            gameNum: currentGameNum,
            score: scoreData.score,
            difference: scoreData.difference,
            actualEval,
            guessedEval,
            fen: currentPosition.fen
          }]);
          setHasSubmitted(true);
        }
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const calculateScoreLocal = (actual_eval, guessed_eval) => {
    const difference = Math.abs(actual_eval - guessed_eval);
    let score;
    
    if (difference === 0) {
      score = 1000;
    } else if (difference <= 0.5) {
      score = 1000 - (difference * 400);
    } else if (difference <= 1.0) {
      score = 800 - ((difference - 0.5) * 400);
    } else if (difference <= 2.0) {
      score = 600 - ((difference - 1.0) * 200);
    } else if (difference <= 5.0) {
      score = 400 - ((difference - 2.0) * 66.67);
    } else {
      score = Math.max(0, 200 - ((difference - 5.0) * 40));
    }
    
    return { score: Math.max(0, Math.floor(score)), difference };
  };

  // Next position
  const nextPosition = async () => {
    // Reset Stockfish analysis
    setStockfishRawEval(null);  // Changed from setStockfishEval
    setBestMove(null);
    setStockfishLoading(false);
    
    if (currentGameNum < totalGames) {
      if (gameMode === 'single') {
        setCurrentGameNum(currentGameNum + 1);
        setGameState('playing');
        await loadPosition();
      } else {
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
    setStockfishRawEval(null);  // Changed from setStockfishEval
    setBestMove(null);
    setStockfishLoading(false);
    setGameState('title');
    setGameMode('single');
    setTotalGames(0);
    setCurrentGameNum(0);
    setScores([]);
    setRoomCode('');
    setPlayerName('');
    setPreloadedPositions([]);
    setLeaderboard([]);
    setRoomPlayers([]);
    setIsHost(false);
    
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatEval = (evalValue) => {
    if (evalValue > 0) return `+${evalValue.toFixed(2)}`;
    return evalValue.toFixed(2);
  };

  const selectMode = (mode) => {
    setGameMode(mode);
    if (mode === 'single') {
      setGameState('select');
    } else {
      setGameState('lobby');
    }
  };

  // State routing
  if (isLoading) return <LoadingScreen />;
  
  if (gameState === 'title') {
    return <StartScreen onSelectMode={selectMode} gameType="eval" />;
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
        socket={socketRef.current}
        initialPlayers={roomPlayers}
        onStartGame={startMultiplayerGame}
      />
    );
  }

  if (gameState === 'playing' && currentPosition) {
    return (
      <div className="h-screen bg-slate-800 p-2 flex flex-col">
        <div className="max-w-[1800px] mx-auto h-full w-full">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-4">
              {gameMode === 'multiplayer' && !showAnswer && (
                <div className={`px-4 py-2 rounded-lg text-xl font-bold ${
                  timeRemaining <= 20 ? 'bg-red-600 animate-pulse' : 'bg-slate-700'
                }`}>
                  ⏱️ {formatTime(timeRemaining)}
                </div>
              )}
              <p className="text-lg md:text-2xl text-gray-300">
                Position {currentGameNum} of {totalGames}
                {gameMode === 'multiplayer' && roomCode && (
                  <span className="ml-2 text-blue-300">
                    Room: {roomCode}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Chessboard */}
            <div className="flex flex-col">
              {/* Position Info */}
              <div className="bg-slate-700 p-4 rounded-lg mb-4">
                <p className="text-white"><span className="font-bold">To Move:</span> {sideToMove}</p>
                <p className="text-white"><span className="font-bold">Castling:</span> {castlingRights}</p>
                <p className="text-gray-400 text-sm mt-2">{currentPosition.opening}</p>
              </div>

              {/* Static Chessboard */}
              <div className="w-full">
                <Chessboard
                  position={displayFen}
                  arePiecesDraggable={false}
                />
              </div>
            </div>

            {/* Middle: Guess Input */}
            <div className="flex flex-col">
              {gameMode === 'multiplayer' && leaderboard.length > 0 && (
                <div className="mb-4">
                  <Leaderboard leaderboard={leaderboard} currentPlayer={playerName} />
                </div>
              )}

              {!showAnswer ? (
                <div className="bg-slate-700 p-6 rounded-lg">
                  <h3 className="text-2xl font-bold text-blue-400 mb-4">
                    What's the evaluation?
                  </h3>
                  <p className="text-gray-300 mb-4 text-sm">
                    Enter evaluation in pawns (e.g., +1.5, -2.3, 0.0)
                  </p>
                  <input
                    type="number"
                    step="0.1"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="e.g., +1.5 or -2.3"
                    className="w-full px-4 py-3 text-xl bg-slate-600 text-white rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
                    disabled={hasSubmitted}
                  />
                  <button
                    onClick={submitGuess}
                    disabled={hasSubmitted}
                    className={`w-full px-6 py-3 text-xl font-bold rounded-lg transition ${
                      hasSubmitted 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {hasSubmitted ? 'Submitted ✓' : 'Submit Guess'}
                  </button>
                  {gameMode === 'multiplayer' && hasSubmitted && (
                    <p className="text-center text-gray-400 mt-2 text-sm">
                      Waiting for others...
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-slate-700 p-6 rounded-lg">
                  <h3 className="text-2xl font-bold text-blue-400 mb-4">Results</h3>
                  <div className="space-y-3 mb-6">
                    {/* Actual Evaluation */}
                    <div className="bg-blue-900 p-4 rounded-lg">
                      <p className="text-xl text-blue-300 font-bold">
                        Actual Eval: {formatEval(currentPosition.eval)}
                      </p>
                    </div>
                    
                    {/* Stockfish Analysis */}
                    <div className="bg-purple-900 p-4 rounded-lg border-2 border-purple-700">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-lg text-purple-300 font-bold flex items-center gap-2">
                          <span>♟️ Stockfish Analysis</span>
                        </p>
                        {stockfishLoading && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-300"></div>
                        )}
                      </div>
                      {stockfishRawEval !== null ? (
                        <div>
                          <p className="text-xl text-purple-200">
                            Eval: <span className="font-bold text-2xl">
                              {formatStockfishEval(getAdjustedStockfishEval())}
                            </span>
                          </p>
                          {bestMove && (
                            <div className="mt-2">
                              <p className="text-sm text-purple-300">
                                Best move: <span className="font-mono bg-purple-800 px-2 py-1 rounded text-base">
                                  {uciToSAN(bestMove, currentPosition.fen)}
                                </span>
                              </p>
                              <p className="text-xs text-purple-400 mt-1">
                                ({sideToMove} to move)
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-purple-400 mt-2">
                            Analyzed to depth 20
                          </p>
                          {Math.abs(getAdjustedStockfishEval() - currentPosition.eval) > 0.5 && (
                            <p className="text-xs text-yellow-400 mt-2">
                              ⚠️ Stockfish eval differs from database eval by {Math.abs(getAdjustedStockfishEval() - currentPosition.eval).toFixed(2)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-purple-300 animate-pulse">
                          {stockfishLoading ? 'Analyzing position...' : 'Starting analysis...'}
                        </p>
                      )}
                    </div>
                    
                    {/* Player's Guess Results */}
                    {scores.length > 0 && scores[scores.length - 1].gameNum === currentGameNum && (
                      <>
                        <div className="bg-slate-600 p-4 rounded-lg text-white">
                          <p>Your guess: <span className="font-bold">{formatEval(scores[scores.length - 1].guessedEval)}</span></p>
                          <p>Difference: <span className="font-bold">{scores[scores.length - 1].difference.toFixed(2)}</span></p>
                        </div>
                        <div className="bg-blue-800 p-4 rounded-lg">
                          <p className="text-2xl text-blue-300 font-bold">
                            Score: +{scores[scores.length - 1].score}
                          </p>
                        </div>
                      </>
                    )}
                    
                    {/* No submission message for multiplayer */}
                    {!scores.find(s => s.gameNum === currentGameNum) && gameMode === 'multiplayer' && (
                      <div className="bg-red-900 p-4 rounded-lg">
                        <p className="text-red-300">
                          Time's up! No guess submitted.
                        </p>
                        <p className="text-2xl text-red-300 font-bold mt-2">
                          Score: 0
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Next Button */}
                  <button
                    onClick={nextPosition}
                    className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold rounded-lg transition"
                  >
                    {currentGameNum < totalGames ? 'Next Position →' : 'See Final Score'}
                  </button>
                </div>
                
              )}
            </div>

            {/* Right: Chat */}
            {gameMode === 'multiplayer' && (
              <div className="flex flex-col">
                <MultiplayerChat 
                  roomCode={roomCode}
                  playerName={playerName}
                  socket={socketRef.current}
                />
              </div>
            )}
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
        gameType="eval"
      />
    );
  }

  return null;
}