import { Chessboard } from 'react-chessboard';

export function ChessBoardDisplay({ position, moves, currentMoveIndex, onNavigate }) {
  return (
    <div className="flex flex-col items-center">
      {/* Chessboard */}
      <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-3xl mb-4 sm:mb-6 flex justify-center">
        <div className="w-full">
          <Chessboard
            position={position}
            arePiecesDraggable={false}
          />
        </div>
      </div>

      {/* Move Controls */}
      <div className="bg-slate-700 p-2 rounded-xl w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-3xl">
        <div className="text-gray-300 text-center mb-3 sm:mb-4 text-base sm:text-lg md:text-xl">
          Move {currentMoveIndex} of {moves.length}
        </div>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          <button
            onClick={() => onNavigate('start')}
            className="px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-3 bg-slate-600 hover:bg-slate-500 text-white text-base sm:text-lg md:text-xl rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentMoveIndex === 0}
            title="Jump to start"
          >
            ⏮
          </button>
          <button
            onClick={() => onNavigate('prev')}
            className="px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-3 bg-slate-600 hover:bg-slate-500 text-white text-base sm:text-lg md:text-xl rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentMoveIndex === 0}
            title="Previous move"
          >
            ◀
          </button>
          <button
            onClick={() => onNavigate('toggle-auto')}
            className="px-4 py-2 sm:px-5 sm:py-2 md:px-6 md:py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-base sm:text-lg md:text-xl rounded-lg font-bold"
            title="Auto play"
          >
            ▶ Auto
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-3 bg-slate-600 hover:bg-slate-500 text-white text-base sm:text-lg md:text-xl rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentMoveIndex >= moves.length}
            title="Next move"
          >
            ▶
          </button>
          <button
            onClick={() => onNavigate('end')}
            className="px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-3 bg-slate-600 hover:bg-slate-500 text-white text-base sm:text-lg md:text-xl rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
