import { Chessboard } from 'react-chessboard';

export function ChessBoardDisplay({ position, moves, currentMoveIndex, onNavigate }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-3xl mb-6">
        <Chessboard 
          position={position}
          boardWidth={600}
          arePiecesDraggable={false}
        />
      </div>

      <div className="bg-slate-700 p-6 rounded-xl w-full max-w-3xl">
        <div className="text-gray-300 text-center mb-4 text-xl">
          Move {currentMoveIndex} of {moves.length}
        </div>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => onNavigate('start')}
            className="px-5 py-3 bg-slate-600 hover:bg-slate-500 text-white text-xl rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentMoveIndex === 0}
            title="Jump to start"
          >
            ⏮
          </button>
          <button
            onClick={() => onNavigate('prev')}
            className="px-5 py-3 bg-slate-600 hover:bg-slate-500 text-white text-xl rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentMoveIndex === 0}
            title="Previous move"
          >
            ◀
          </button>
          <button
            onClick={() => onNavigate('toggle-auto')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xl rounded-lg font-bold"
            title="Auto play"
          >
            ▶ Auto
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="px-5 py-3 bg-slate-600 hover:bg-slate-500 text-white text-xl rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentMoveIndex >= moves.length}
            title="Next move"
          >
            ▶
          </button>
          <button
            onClick={() => onNavigate('end')}
            className="px-5 py-3 bg-slate-600 hover:bg-slate-500 text-white text-xl rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentMoveIndex >= moves.length}
            title="Jump to end"
          >
            ⏭
          </button>
        </div>
      </div>
    </div>
  );
}