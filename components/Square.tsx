import React from 'react';
import { SquareValue } from '../types';
import { X, Circle } from 'lucide-react';

interface SquareProps {
  value: SquareValue;
  onClick: () => void;
  isWinningSquare: boolean;
  disabled: boolean;
}

const Square: React.FC<SquareProps> = ({ value, onClick, isWinningSquare, disabled }) => {
  return (
    <button
      className={`
        h-24 w-24 sm:h-32 sm:w-32 
        border-2 border-slate-700 
        rounded-xl 
        flex items-center justify-center 
        text-4xl sm:text-6xl 
        transition-all duration-300
        hover:bg-slate-800
        active:scale-95
        ${isWinningSquare ? 'bg-green-900/30 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-slate-900/50'}
        ${disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
      `}
      onClick={onClick}
      disabled={disabled}
    >
      {value === 'X' && (
        <X className="w-16 h-16 sm:w-20 sm:h-20 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" strokeWidth={2.5} />
      )}
      {value === 'O' && (
        <Circle className="w-14 h-14 sm:w-16 sm:h-16 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" strokeWidth={3} />
      )}
    </button>
  );
};

export default Square;