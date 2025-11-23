import React from 'react';
import Tile from './Tile';
import { GridData } from '../types';

interface GridProps {
  grid: GridData;
  currentRow: number;
  shakeRow: boolean;
}

const Grid: React.FC<GridProps> = ({ grid, currentRow, shakeRow }) => {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 p-4">
      {grid.map((row, rowIndex) => (
        <div 
          key={rowIndex} 
          className={`flex gap-2 sm:gap-3 justify-center ${
            rowIndex === currentRow && shakeRow ? 'animate-shake' : ''
          }`}
        >
          {row.map((tile, colIndex) => (
            <Tile 
              key={colIndex} 
              data={tile} 
              index={colIndex}
              isRevealed={rowIndex < currentRow} 
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Grid;