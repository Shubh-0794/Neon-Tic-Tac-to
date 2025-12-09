import React from 'react';
import Square from './Square';
import { SquareValue } from '../types';

interface BoardProps {
  squares: SquareValue[];
  onClick: (i: number) => void;
  winningLine: number[] | null;
  disabled: boolean;
}

const Board: React.FC<BoardProps> = ({ squares, onClick, winningLine, disabled }) => {
  return (
    <div className="grid grid-cols-3 gap-3 p-3 bg-slate-800/30 rounded-2xl border border-slate-700 backdrop-blur-sm">
      {squares.map((square, i) => (
        <Square
          key={i}
          value={square}
          onClick={() => onClick(i)}
          isWinningSquare={winningLine?.includes(i) ?? false}
          disabled={disabled || square !== null}
        />
      ))}
    </div>
  );
};

export default Board;