import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ArrowLeft, Trophy, AlertCircle, Loader2, Bluetooth } from 'lucide-react';
import Board from './components/Board';
import { GameMode, GameState, Player, BluetoothDeviceState } from './types';
import { bluetoothService, GAME_SERVICE_UUID } from './services/bluetoothService';
import { getBestMove } from './services/geminiService';
import { WINNING_COMBINATIONS, MENU_ITEMS } from './constants';

const INITIAL_STATE: GameState = {
  squares: Array(9).fill(null),
  xIsNext: true,
  winner: null,
  winningLine: null,
};

export default function App() {
  const [mode, setMode] = useState<GameMode>(GameMode.MENU);
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [btState, setBtState] = useState<BluetoothDeviceState>({
    isConnected: false,
    deviceName: null,
    error: null,
  });

  // Calculate winner helper
  const calculateWinner = useCallback((squares: (Player | null)[]) => {
    for (let i = 0; i < WINNING_COMBINATIONS.length; i++) {
      const [a, b, c] = WINNING_COMBINATIONS[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: WINNING_COMBINATIONS[i] };
      }
    }
    if (!squares.includes(null)) {
      return { winner: 'DRAW', line: null };
    }
    return null;
  }, []);

  // Handle a move
  const handleMove = useCallback((i: number, isRemoteMove = false) => {
    setGameState((prev) => {
      if (prev.squares[i] || prev.winner) return prev;

      const newSquares = [...prev.squares];
      newSquares[i] = prev.xIsNext ? 'X' : 'O';
      
      const result = calculateWinner(newSquares);
      
      const newState = {
        squares: newSquares,
        xIsNext: !prev.xIsNext,
        winner: result ? (result.winner as Player | 'DRAW') : null,
        winningLine: result ? result.line : null,
      };

      // If Bluetooth mode, send move if it was made locally
      if (mode === GameMode.BLUETOOTH && !isRemoteMove && btState.isConnected) {
        bluetoothService.sendMove(i);
      }

      return newState;
    });
  }, [calculateWinner, mode, btState.isConnected]);

  // AI Turn Effect
  useEffect(() => {
    if (mode === GameMode.AI && !gameState.xIsNext && !gameState.winner && !isAiThinking) {
      const makeAiMove = async () => {
        setIsAiThinking(true);
        // Artificial delay for UX
        await new Promise(resolve => setTimeout(resolve, 600)); 
        const moveIndex = await getBestMove(gameState.squares);
        handleMove(moveIndex);
        setIsAiThinking(false);
      };
      makeAiMove();
    }
  }, [mode, gameState.xIsNext, gameState.winner, gameState.squares, handleMove, isAiThinking]);

  // Bluetooth Setup
  const connectBluetooth = async () => {
    setBtState(prev => ({ ...prev, error: null }));
    try {
      const name = await bluetoothService.connect(() => {
        setBtState({ isConnected: false, deviceName: null, error: 'Device Disconnected' });
        setMode(GameMode.MENU);
      });
      
      bluetoothService.setMoveHandler((index) => {
        handleMove(index, true);
      });

      setBtState({ isConnected: true, deviceName: name, error: null });
    } catch (err: any) {
      setBtState(prev => ({ ...prev, error: err.message || 'Connection failed' }));
    }
  };

  const startNewGame = () => {
    setGameState(INITIAL_STATE);
  };

  const returnToMenu = () => {
    if (mode === GameMode.BLUETOOTH) {
      bluetoothService.disconnect();
      setBtState({ isConnected: false, deviceName: null, error: null });
    }
    setMode(GameMode.MENU);
    setGameState(INITIAL_STATE);
  };

  // --- RENDERERS ---

  const renderMenu = () => (
    <div className="flex flex-col gap-6 w-full max-w-md animate-fade-in">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-5xl font-bold font-orbitron neon-text">NEON TAC TOE</h1>
        <p className="text-slate-400">Select Game Mode</p>
      </div>
      
      {MENU_ITEMS.map((item) => (
        <button
          key={item.mode}
          onClick={() => {
            if (item.mode === 'BLUETOOTH') {
              setMode(GameMode.BLUETOOTH);
              // Don't auto-connect, let user trigger it in the lobby view
            } else {
              setMode(item.mode as GameMode);
            }
          }}
          className={`
            group relative overflow-hidden p-6 rounded-2xl
            bg-slate-800 border border-slate-700
            hover:border-blue-500 transition-all duration-300
            text-left flex items-center gap-4
            hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]
          `}
        >
          <div className={`p-3 rounded-xl ${item.color} text-white`}>
            {item.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
              {item.label}
            </h3>
            <p className="text-sm text-slate-400">{item.description}</p>
          </div>
        </button>
      ))}
      
      <div className="text-xs text-center text-slate-600 mt-8">
        Powered by React, Tailwind & Gemini API
      </div>
    </div>
  );

  const renderBluetoothLobby = () => (
    <div className="flex flex-col items-center justify-center w-full max-w-md text-center space-y-6 animate-fade-in">
       <button onClick={returnToMenu} className="absolute top-6 left-6 p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="p-4 bg-indigo-900/20 rounded-full mb-4">
        <Bluetooth className="w-16 h-16 text-indigo-400" />
      </div>

      <h2 className="text-2xl font-bold">Bluetooth Connect</h2>
      
      {!btState.isConnected ? (
        <>
          <p className="text-slate-400 max-w-xs">
            Connect to a compatible BLE Tic-Tac-Toe peripheral to play remotely.
            <br/><br/>
            <span className="text-xs text-slate-500">
              Required Service UUID: <br/> {GAME_SERVICE_UUID.slice(0,8)}...
            </span>
          </p>
          <button 
            onClick={connectBluetooth}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
          >
            Scan for Device
          </button>
          {btState.error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg text-sm mt-4">
              <AlertCircle className="w-4 h-4" />
              {btState.error}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
           <div className="flex items-center justify-center gap-2 text-green-400 bg-green-900/20 p-3 rounded-lg">
             <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
             Connected to {btState.deviceName}
           </div>
           <p className="text-slate-400 text-sm">Waiting for game start...</p>
        </div>
      )}
    </div>
  );

  // Determine current player label
  const getStatusText = () => {
    if (gameState.winner) {
      if (gameState.winner === 'DRAW') return "It's a Draw!";
      return `Winner: ${gameState.winner}`;
    }
    if (mode === GameMode.AI && !gameState.xIsNext) return "Gemini is thinking...";
    return `Player ${gameState.xIsNext ? 'X' : 'O'}'s Turn`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      {mode === GameMode.MENU ? (
        renderMenu()
      ) : mode === GameMode.BLUETOOTH && !btState.isConnected ? (
        renderBluetoothLobby()
      ) : (
        <div className="flex flex-col items-center gap-8 w-full max-w-lg animate-fade-in relative">
          
          {/* Header */}
          <div className="w-full flex justify-between items-center">
             <button 
               onClick={returnToMenu}
               className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
             >
               <ArrowLeft className="w-6 h-6" />
             </button>
             <div className="text-xl font-bold font-orbitron tracking-wider">
               {mode === GameMode.LOCAL ? 'LOCAL PVP' : mode === GameMode.AI ? 'VS GEMINI' : 'BLUETOOTH'}
             </div>
             <button 
               onClick={startNewGame}
               className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
             >
               <RefreshCw className="w-6 h-6" />
             </button>
          </div>

          {/* Game Status Board */}
          <div className={`
            px-8 py-4 rounded-xl backdrop-blur-md border
            flex items-center gap-3
            ${gameState.winner 
              ? 'bg-green-900/20 border-green-500/50 text-green-400' 
              : 'bg-slate-800/40 border-slate-700 text-blue-200'
            }
          `}>
             {isAiThinking ? (
               <Loader2 className="w-5 h-5 animate-spin" />
             ) : gameState.winner ? (
               <Trophy className="w-5 h-5" />
             ) : (
               <div className={`w-3 h-3 rounded-full ${gameState.xIsNext ? 'bg-blue-500' : 'bg-rose-500'}`} />
             )}
             <span className="font-bold text-lg">{getStatusText()}</span>
          </div>

          {/* Board */}
          <Board 
            squares={gameState.squares}
            onClick={(i) => handleMove(i)}
            winningLine={gameState.winningLine}
            disabled={!!gameState.winner || isAiThinking || (mode === GameMode.BLUETOOTH && !gameState.xIsNext)} // Assuming Client is X for simplicity, or shared turn
          />

          {/* Footer Info */}
          {mode === GameMode.BLUETOOTH && (
            <div className="text-xs text-slate-500 font-mono">
              Connected: {btState.deviceName}
            </div>
          )}
        </div>
      )}
    </div>
  );
}